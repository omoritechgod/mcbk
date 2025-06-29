import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError } from "@/lib/utils/api"

// GET /api/users/[id] - Get user by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        dateOfBirth: true,
        gender: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
        updatedAt: true,
        addresses: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            businessType: true,
            verificationStatus: true,
            isActive: true,
            isApproved: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(createErrorResponse("User not found"), { status: 404 })
    }

    return NextResponse.json(createApiResponse(user, "User retrieved successfully"))
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/users/[id] - Update user
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()

    // Remove sensitive fields that shouldn't be updated directly
    const { password, email, ...updateData } = data

    const user = await prisma.user.update({
      where: { id: params.id },
      data: {
        ...updateData,
        dateOfBirth: updateData.dateOfBirth ? new Date(updateData.dateOfBirth) : undefined,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        dateOfBirth: true,
        gender: true,
        isActive: true,
        isVerified: true,
        updatedAt: true,
      },
    })

    return NextResponse.json(createApiResponse(user, "User updated successfully"))
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/users/[id] - Delete user (soft delete by deactivating)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { isActive: false },
      select: { id: true, email: true, isActive: true },
    })

    return NextResponse.json(createApiResponse(user, "User deactivated successfully"))
  } catch (error) {
    return handleApiError(error)
  }
}
