import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, handleApiError, validateRequest } from "@/lib/utils/api"

// GET /api/categories - Get all product categories
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const type = searchParams.get("type") // 'product' or 'service'

    if (type === "service") {
      const categories = await prisma.serviceCategory.findMany({
        include: {
          children: true,
          _count: {
            select: {
              services: true,
            },
          },
        },
        orderBy: { name: "asc" },
      })
      return NextResponse.json(createApiResponse(categories, "Service categories retrieved successfully"))
    } else {
      const categories = await prisma.productCategory.findMany({
        include: {
          children: true,
          _count: {
            select: {
              products: true,
            },
          },
        },
        orderBy: { name: "asc" },
      })
      return NextResponse.json(createApiResponse(categories, "Product categories retrieved successfully"))
    }
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/categories - Create new category (admin only)
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["name", "type"])
    if (!validation.isValid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 })
    }

    const { name, type, parentId } = validation.data

    if (type === "service") {
      const category = await prisma.serviceCategory.create({
        data: { name, parentId },
      })
      return NextResponse.json(createApiResponse(category, "Service category created successfully"), { status: 201 })
    } else {
      const category = await prisma.productCategory.create({
        data: { name, parentId },
      })
      return NextResponse.json(createApiResponse(category, "Product category created successfully"), { status: 201 })
    }
  } catch (error) {
    return handleApiError(error)
  }
}
