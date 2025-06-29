import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError, validateRequest } from "@/lib/utils/api"

// PUT /api/rides/[id]/status - Update ride status
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const validation = await validateRequest(request, ["status"])
    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { status } = validation.data
    const rideId = Number.parseInt(params.id)

    const validStatuses = ["REQUESTED", "ONGOING", "COMPLETED", "CANCELLED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json(createErrorResponse("Invalid status"), { status: 400 })
    }

    // If ride is being completed, release escrow and update rider status
    if (status === "COMPLETED") {
      const result = await prisma.$transaction(async (tx) => {
        const ride = await tx.ride.findUnique({
          where: { id: rideId },
          include: {
            rider: {
              include: {
                user: {
                  include: {
                    wallet: true,
                  },
                },
              },
            },
          },
        })

        if (!ride) {
          throw new Error("Ride not found")
        }

        // Update ride status
        const updatedRide = await tx.ride.update({
          where: { id: rideId },
          data: { status },
        })

        // Credit rider wallet
        if (ride.rider.user.wallet) {
          await tx.wallet.update({
            where: { id: ride.rider.user.wallet.id },
            data: { balance: { increment: ride.fare } },
          })

          // Create wallet transaction for rider
          await tx.walletTransaction.create({
            data: {
              walletId: ride.rider.user.wallet.id,
              type: "CREDIT",
              amount: ride.fare,
              description: `Ride payment - Ride #${rideId}`,
              transactionReference: `RIDE-PAY-${rideId}-${Date.now()}`,
              status: "SUCCESS",
            },
          })
        }

        // Update rider status back to active
        await tx.rider.update({
          where: { id: ride.riderId },
          data: { status: "ACTIVE" },
        })

        return updatedRide
      })

      return NextResponse.json(createApiResponse(result, "Ride completed and payment released to rider"))
    } else if (status === "ONGOING") {
      const ride = await prisma.ride.update({
        where: { id: rideId },
        data: { status },
      })

      return NextResponse.json(createApiResponse(ride, "Ride started"))
    } else {
      const ride = await prisma.ride.update({
        where: { id: rideId },
        data: { status },
      })

      // If cancelled, make rider available again
      if (status === "CANCELLED") {
        const rideData = await prisma.ride.findUnique({
          where: { id: rideId },
        })

        if (rideData) {
          await prisma.rider.update({
            where: { id: rideData.riderId },
            data: { status: "ACTIVE" },
          })
        }
      }

      return NextResponse.json(createApiResponse(ride, `Ride status updated to ${status}`))
    }
  } catch (error) {
    return handleApiError(error)
  }
}
