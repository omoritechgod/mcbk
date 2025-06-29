import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError, validateRequest } from "@/lib/utils/api"

// POST /api/vendors/verify - Submit verification documents
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["userId", "verificationType", "value"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { userId, verificationType, value } = validation.data

    // Validate verification type
    if (!["NIN", "CAC"].includes(verificationType)) {
      return NextResponse.json(createErrorResponse("Invalid verification type. Use NIN or CAC"), { status: 400 })
    }

    // Check if user exists and is a vendor
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { vendor: true },
    })

    if (!user) {
      return NextResponse.json(createErrorResponse("User not found"), { status: 404 })
    }

    if (user.userType !== "VENDOR" || !user.vendor) {
      return NextResponse.json(createErrorResponse("User is not a vendor"), { status: 400 })
    }

    // Create verification record
    const verification = await prisma.verification.create({
      data: {
        userId,
        type: verificationType,
        value,
        status: "PENDING",
      },
    })

    return NextResponse.json(
      createApiResponse(verification, "Verification submitted successfully. Please wait for admin approval."),
      { status: 201 },
    )
  } catch (error) {
    return handleApiError(error)
  }
}
