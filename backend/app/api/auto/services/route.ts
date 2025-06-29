import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  validateRequest,
  getPaginationParams,
} from "@/lib/utils/api"

// GET /api/auto/services - List auto services
export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip } = getPaginationParams(request)
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const vendorId = searchParams.get("vendorId")

    const where: any = {
      vendor: {
        isVerified: true,
        vendorType: "SERVICE", // Auto services are under general services
      },
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (vendorId) {
      where.vendorId = Number.parseInt(vendorId)
    }

    const [autoServices, total] = await Promise.all([
      prisma.autoService.findMany({
        where,
        skip,
        take: limit,
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              rating: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.autoService.count({ where }),
    ])

    return NextResponse.json({
      ...createApiResponse(autoServices, "Auto services retrieved successfully"),
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

// POST /api/auto/services - Create auto service
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["vendorId", "name", "priceRange"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { vendorId, name, description, priceRange } = validation.data

    // Check if vendor is verified
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    })

    if (!vendor) {
      return NextResponse.json(createErrorResponse("Vendor not found"), { status: 404 })
    }

    if (!vendor.isVerified) {
      return NextResponse.json(createErrorResponse("Vendor must be verified"), { status: 403 })
    }

    const autoService = await prisma.autoService.create({
      data: {
        vendorId,
        name,
        description,
        priceRange,
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    })

    return NextResponse.json(createApiResponse(autoService, "Auto service created successfully"), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
