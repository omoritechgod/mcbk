import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, handleApiError, getPaginationParams } from "@/lib/utils/api"

// GET /api/apartments/bookings - List apartment bookings
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
      where.apartment = {
        vendorId: Number.parseInt(vendorId),
      }
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const [bookings, total] = await Promise.all([
      prisma.apartmentBooking.findMany({
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
        orderBy: { id: "desc" },
      }),
      prisma.apartmentBooking.count({ where }),
    ])

    return NextResponse.json({
      ...createApiResponse(bookings, "Apartment bookings retrieved successfully"),
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
