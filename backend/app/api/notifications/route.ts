import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  validateRequest,
  getPaginationParams,
} from "@/lib/utils/api"

// GET /api/notifications - Get user notifications
export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip } = getPaginationParams(request)
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const isRead = searchParams.get("isRead")

    if (!userId) {
      return NextResponse.json(createErrorResponse("User ID is required"), { status: 400 })
    }

    const where: any = {
      userId: Number.parseInt(userId),
    }

    if (isRead !== null) {
      where.isRead = isRead === "true"
    }

    const [notifications, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId: Number.parseInt(userId),
          isRead: false,
        },
      }),
    ])

    return NextResponse.json({
      ...createApiResponse(notifications, "Notifications retrieved successfully"),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      unreadCount,
    })
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/notifications - Create notification
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["userId", "type", "title", "message"])
    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { userId, type, title, message, data } = validation.data

    const notification = await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
      },
    })

    return NextResponse.json(createApiResponse(notification, "Notification created successfully"), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
