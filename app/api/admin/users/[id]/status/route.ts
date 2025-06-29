import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError, validateRequest } from "@/lib/utils/api"

// PUT /api/admin/users/[id]/status - Update user status (ban/unban)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const validation = await validateRequest(request, ["status"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { status, reason } = validation.data
    const userId = Number.parseInt(params.id)

    if (!["ACTIVE", "INACTIVE", "BANNED"].includes(status)) {
      return NextResponse.json(createErrorResponse("Invalid status"), { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { status: status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
      },
    })

    return NextResponse.json(createApiResponse(user, `User status updated to ${status}`))
  } catch (error) {
    return handleApiError(error)
  }
}
