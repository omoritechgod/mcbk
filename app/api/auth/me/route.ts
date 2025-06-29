import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError } from "@/lib/utils/api"
import jwt from "jsonwebtoken"

// GET /api/auth/me - Get current user profile
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(createErrorResponse("Authorization token required"), { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        userType: true,
        status: true,
        createdAt: true,
        vendor: {
          select: {
            id: true,
            businessName: true,
            businessDescription: true,
            vendorType: true,
            rating: true,
            isVerified: true,
          },
        },
        wallet: {
          select: {
            id: true,
            balance: true,
            currency: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json(createErrorResponse("User not found"), { status: 404 })
    }

    return NextResponse.json(createApiResponse(user, "User profile retrieved successfully"))
  } catch (error) {
    return handleApiError(error)
  }
}
