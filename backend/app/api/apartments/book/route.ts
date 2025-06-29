import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError, validateRequest } from "@/lib/utils/api"

// POST /api/apartments/book - Book apartment with escrow
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["userId", "apartmentId", "checkInDate", "checkOutDate"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { userId, apartmentId, checkInDate, checkOutDate } = validation.data

    const checkIn = new Date(checkInDate)
    const checkOut = new Date(checkOutDate)

    if (checkIn >= checkOut) {
      return NextResponse.json(createErrorResponse("Check-out date must be after check-in date"), { status: 400 })
    }

    // Execute booking with escrow in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get apartment details
      const apartment = await tx.apartment.findUnique({
        where: { id: apartmentId },
        include: { vendor: true },
      })

      if (!apartment) {
        throw new Error("Apartment not found")
      }

      if (!apartment.vendor.isVerified) {
        throw new Error("Cannot book from unverified vendor")
      }

      // Check for conflicting bookings
      const conflictingBooking = await tx.apartmentBooking.findFirst({
        where: {
          apartmentId,
          status: "CONFIRMED",
          OR: [
            {
              checkInDate: { lte: checkOut },
              checkOutDate: { gte: checkIn },
            },
          ],
        },
      })

      if (conflictingBooking) {
        throw new Error("Apartment is not available for selected dates")
      }

      // Calculate total price
      const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24))
      const totalPrice = apartment.pricePerNight * nights

      // Get user wallet
      const userWallet = await tx.wallet.findUnique({
        where: { userId },
      })

      if (!userWallet) {
        throw new Error("User wallet not found")
      }

      if (userWallet.balance < totalPrice) {
        throw new Error("Insufficient wallet balance")
      }

      // Create booking
      const booking = await tx.apartmentBooking.create({
        data: {
          userId,
          apartmentId,
          checkInDate: checkIn,
          checkOutDate: checkOut,
          totalPrice,
          status: "PENDING",
        },
        include: {
          apartment: {
            include: {
              vendor: {
                select: {
                  id: true,
                  businessName: true,
                },
              },
            },
          },
        },
      })

      // Debit user wallet (escrow)
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: totalPrice } },
      })

      // Create wallet transaction for escrow
      await tx.walletTransaction.create({
        data: {
          walletId: userWallet.id,
          type: "DEBIT",
          amount: totalPrice,
          description: `Apartment booking (Escrow) - Booking #${booking.id}`,
          transactionReference: `APT-${booking.id}-${Date.now()}`,
          status: "SUCCESS",
        },
      })

      return booking
    })

    return NextResponse.json(
      createApiResponse(result, "Apartment booked successfully. Funds held in escrow until check-in."),
      { status: 201 },
    )
  } catch (error: any) {
    if (error.message.includes("not available") || error.message.includes("Insufficient")) {
      return NextResponse.json(createErrorResponse(error.message), { status: 400 })
    }
    return handleApiError(error)
  }
}
