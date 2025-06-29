import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  validateRequest,
  getPaginationParams,
} from "@/lib/utils/api"

// GET /api/auto/bookings - List auto service bookings
export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip } = getPaginationParams(request)
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const vendorId = searchParams.get("vendorId")
    const status = searchParams.get("status")

    const where: any = {}

    if (userId) {
      where.userId = Number.parseInt(userId)
    }

    if (vendorId) {
      where.autoService = {
        vendorId: Number.parseInt(vendorId),
      }
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const [bookings, total] = await Promise.all([
      prisma.repairBooking.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          autoService: {
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
        orderBy: { id: "desc" },
      }),
      prisma.repairBooking.count({ where }),
    ])

    return NextResponse.json({
      ...createApiResponse(bookings, "Auto service bookings retrieved successfully"),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/auto/bookings - Create auto service booking
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["userId", "autoServiceId", "scheduleDate"])
    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { userId, autoServiceId, scheduleDate } = validation.data

    // Execute booking with commitment fee in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get user wallet
      const userWallet = await tx.wallet.findUnique({
        where: { userId },
      })

      if (!userWallet) {
        throw new Error("User wallet not found")
      }

      const commitmentFee = 5000 // ₦5,000 commitment fee

      if (userWallet.balance < commitmentFee) {
        throw new Error("Insufficient wallet balance for commitment fee")
      }

      // Create booking
      const booking = await tx.repairBooking.create({
        data: {
          userId,
          autoServiceId,
          scheduleDate: new Date(scheduleDate),
          status: "PENDING",
        },
        include: {
          autoService: {
            include: {
              vendor: {
                select: {
                  businessName: true,
                },
              },
            },
          },
        },
      })

      // Debit commitment fee
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: commitmentFee } },
      })

      // Create wallet transaction for commitment fee
      await tx.walletTransaction.create({
        data: {
          walletId: userWallet.id,
          type: "DEBIT",
          amount: commitmentFee,
          description: `Auto service commitment fee - Booking #${booking.id}`,
          transactionReference: `AUTO-COMMIT-${booking.id}-${Date.now()}`,
          status: "SUCCESS",
        },
      })

      return booking
    })

    return NextResponse.json(
      createApiResponse(result, "Auto service booking created successfully. ₦5,000 commitment fee charged."),
      { status: 201 },
    )
  } catch (error: any) {
    if (error.message.includes("Insufficient")) {
      return NextResponse.json(createErrorResponse(error.message), { status: 400 })
    }
    return handleApiError(error)
  }
}
