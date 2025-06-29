import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError, validateRequest } from "@/lib/utils/api"

// POST /api/rides/book - Book a ride
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["userId", "riderId", "pickupAddress", "dropoffAddress", "fare"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { userId, riderId, pickupAddress, dropoffAddress, fare } = validation.data

    // Execute ride booking with escrow in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Check if rider is available
      const rider = await tx.rider.findUnique({
        where: { id: riderId },
        include: { vendor: true },
      })

      if (!rider) {
        throw new Error("Rider not found")
      }

      if (rider.status !== "ACTIVE") {
        throw new Error("Rider is not available")
      }

      if (!rider.vendor.isVerified) {
        throw new Error("Cannot book ride from unverified vendor")
      }

      // Get user wallet
      const userWallet = await tx.wallet.findUnique({
        where: { userId },
      })

      if (!userWallet) {
        throw new Error("User wallet not found")
      }

      if (userWallet.balance < fare) {
        throw new Error("Insufficient wallet balance")
      }

      // Create ride booking
      const ride = await tx.ride.create({
        data: {
          userId,
          riderId,
          pickupAddress,
          dropoffAddress,
          fare,
          status: "REQUESTED",
        },
        include: {
          rider: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
      })

      // Debit user wallet (escrow)
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: fare } },
      })

      // Create wallet transaction for escrow
      await tx.walletTransaction.create({
        data: {
          walletId: userWallet.id,
          type: "DEBIT",
          amount: fare,
          description: `Ride booking (Escrow) - Ride #${ride.id}`,
          transactionReference: `RIDE-${ride.id}-${Date.now()}`,
          status: "SUCCESS",
        },
      })

      // Update rider status to busy
      await tx.rider.update({
        where: { id: riderId },
        data: { status: "BUSY" },
      })

      return ride
    })

    return NextResponse.json(
      createApiResponse(result, "Ride booked successfully. Funds held in escrow until completion."),
      { status: 201 },
    )
  } catch (error: any) {
    if (error.message.includes("not available") || error.message.includes("Insufficient")) {
      return NextResponse.json(createErrorResponse(error.message), { status: 400 })
    }
    return handleApiError(error)
  }
}
