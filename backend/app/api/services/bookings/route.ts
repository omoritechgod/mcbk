import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  validateRequest,
  getPaginationParams,
} from "@/lib/utils/api"

// GET /api/services/bookings - List service bookings
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
      where.service = {
        vendorId: Number.parseInt(vendorId),
      }
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const [bookings, total] = await Promise.all([
      prisma.serviceBooking.findMany({
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
          service: {
            include: {
              vendor: {
                select: {
                  id: true,
                  businessName: true,
                },
              },
              category: {
                select: {
                  name: true,
                },
              },
            },
          },
        },
        orderBy: { id: "desc" },
      }),
      prisma.serviceBooking.count({ where }),
    ])

    return NextResponse.json({
      ...createApiResponse(bookings, "Service bookings retrieved successfully"),
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

// POST /api/services/bookings - Create service booking
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["userId", "serviceId", "scheduleDate"])
    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { userId, serviceId, scheduleDate } = validation.data

    const booking = await prisma.serviceBooking.create({
      data: {
        userId,
        serviceId,
        scheduleDate: new Date(scheduleDate),
        status: "PENDING",
      },
      include: {
        service: {
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

    return NextResponse.json(createApiResponse(booking, "Service booking created successfully"), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
