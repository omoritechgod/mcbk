import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError } from "@/lib/utils/api"

// GET /api/vendors/[id] - Get vendor by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const vendor = await prisma.vendor.findUnique({
      where: { id: params.id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            avatar: true,
          },
        },
        documents: true,
        _count: {
          select: {
            products: true,
            foodItems: true,
            vehicles: true,
            apartments: true,
            orders: true,
            reviews: true,
          },
        },
      },
    })

    if (!vendor) {
      return NextResponse.json(createErrorResponse("Vendor not found"), { status: 404 })
    }

    return NextResponse.json(createApiResponse(vendor, "Vendor retrieved successfully"))
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/vendors/[id] - Update vendor
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()

    const vendor = await prisma.vendor.update({
      where: { id: params.id },
      data,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json(createApiResponse(vendor, "Vendor updated successfully"))
  } catch (error) {
    return handleApiError(error)
  }
}
