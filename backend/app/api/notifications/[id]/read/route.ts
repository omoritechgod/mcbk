import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, handleApiError } from "@/lib/utils/api"

// PUT /api/notifications/[id]/read - Mark notification as read
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const notificationId = Number.parseInt(params.id)

    const notification = await prisma.notification.update({
      where: { id: notificationId },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    })

    return NextResponse.json(createApiResponse(notification, "Notification marked as read"))
  } catch (error) {
    return handleApiError(error)
  }
}
