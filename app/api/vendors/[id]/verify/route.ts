import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError, validateRequest } from "@/lib/utils/api"

// POST /api/vendors/[id]/verify - Verify vendor
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const validation = await validateRequest(request, ["status"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { status, notes } = validation.data

    if (!["APPROVED", "REJECTED"].includes(status)) {
      return NextResponse.json(createErrorResponse("Invalid verification status"), { status: 400 })
    }

    const vendor = await prisma.vendor.update({
      where: { id: params.id },
      data: {
        verificationStatus: status,
        verificationNotes: notes,
        verifiedAt: status === "APPROVED" ? new Date() : null,
        isApproved: status === "APPROVED",
        approvedAt: status === "APPROVED" ? new Date() : null,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })

    // Create notification for vendor
    await prisma.notification.create({
      data: {
        userId: vendor.userId,
        type: "VENDOR_VERIFICATION",
        title: `Vendor ${status === "APPROVED" ? "Approved" : "Rejected"}`,
        message:
          status === "APPROVED"
            ? "Congratulations! Your vendor account has been approved."
            : `Your vendor account verification was rejected. ${notes || ""}`,
        data: {
          vendorId: vendor.id,
          status,
          notes,
        },
      },
    })

    return NextResponse.json(createApiResponse(vendor, `Vendor ${status.toLowerCase()} successfully`))
  } catch (error) {
    return handleApiError(error)
  }
}
