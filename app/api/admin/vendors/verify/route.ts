import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError, validateRequest } from "@/lib/utils/api"

// POST /api/admin/vendors/verify - Approve or reject vendor verification
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["verificationId", "status"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { verificationId, status, notes } = validation.data

    if (!["VERIFIED", "FAILED"].includes(status)) {
      return NextResponse.json(createErrorResponse("Invalid status. Use VERIFIED or FAILED"), { status: 400 })
    }

    // Update verification and vendor status in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update verification
      const verification = await tx.verification.update({
        where: { id: verificationId },
        data: {
          status,
          verifiedAt: status === "VERIFIED" ? new Date() : null,
        },
        include: {
          user: {
            include: {
              vendor: true,
            },
          },
        },
      })

      // If verified, update vendor status
      if (status === "VERIFIED" && verification.user.vendor) {
        await tx.vendor.update({
          where: { id: verification.user.vendor.id },
          data: {
            isVerified: true,
          },
        })
      }

      return verification
    })

    return NextResponse.json(
      createApiResponse(
        result,
        status === "VERIFIED"
          ? "Vendor verified successfully. They can now start selling."
          : "Vendor verification rejected.",
      ),
    )
  } catch (error) {
    return handleApiError(error)
  }
}
