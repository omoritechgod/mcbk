import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, handleApiError, getPaginationParams } from "@/lib/utils/api"

// GET /api/admin/vendors/pending - Get pending vendor verifications
export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip } = getPaginationParams(request)

    const [verifications, total] = await Promise.all([
      prisma.verification.findMany({
        where: { status: "PENDING" },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              vendor: {
                select: {
                  id: true,
                  businessName: true,
                  vendorType: true,
                  businessDescription: true,
                },
              },
            },
          },
        },
        orderBy: { id: "desc" },
      }),
      prisma.verification.count({ where: { status: "PENDING" } }),
    ])

    return NextResponse.json({
      ...createApiResponse(verifications, "Pending verifications retrieved successfully"),
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
