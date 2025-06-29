import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError, validateRequest } from "@/lib/utils/api"

// PUT /api/apartments/bookings/[id]/status - Update booking status
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const validation = await validateRequest(request, ["status"])
    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { status } = validation.data
    const bookingId = Number.parseInt(params.id)

    const validStatuses = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(createErrorResponse("Invalid status"), { status: 400 })
    }

    // If booking is being completed, release escrow
    if (status === "COMPLETED") {
      const result = await prisma.$transaction(async (tx) => {
        const booking = await tx.apartmentBooking.findUnique({
          where: { id: bookingId },
          include: {
            apartment: {
              include: {
                vendor: {
                  include: {
                    user: {
                      include: {
                        wallet: true,
                      },
                    },
                  },
                },
              },
            },
          },
        })

        if (!booking) {
          throw new Error("Booking not found")
        }

        // Update booking status
        const updatedBooking = await tx.apartmentBooking.update({
          where: { id: bookingId },
          data: { status },
        })

        // Credit vendor wallet
        if (booking.apartment.vendor.user.wallet) {
          await tx.wallet.update({
            where: { id: booking.apartment.vendor.user.wallet.id },
            data: { balance: { increment: booking.totalPrice } },
          })

          // Create wallet transaction for vendor
          await tx.walletTransaction.create({
            data: {
              walletId: booking.apartment.vendor.user.wallet.id,
              type: "CREDIT",
              amount: booking.totalPrice,
              description: `Apartment booking payment - Booking #${bookingId}`,
              transactionReference: `APT-PAY-${bookingId}-${Date.now()}`,
              status: "SUCCESS",
            },
          })
        }

        return updatedBooking
      })

      return NextResponse.json(createApiResponse(result, "Booking completed and payment released to vendor"))
    } else {
      const booking = await prisma.apartmentBooking.update({
        where: { id: bookingId },
        data: { status },
      })

      return NextResponse.json(createApiResponse(booking, `Booking status updated to ${status}`))
    }
  } catch (error) {
    return handleApiError(error)
  }
}
