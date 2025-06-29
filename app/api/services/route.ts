import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  validateRequest,
  getPaginationParams,
} from "@/lib/utils/api"

// GET /api/services - List services
export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip } = getPaginationParams(request)
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const categoryId = searchParams.get("categoryId")
    const vendorId = searchParams.get("vendorId")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")

    const where: any = {
      vendor: {
        isVerified: true,
        vendorType: "SERVICE",
      },
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (categoryId) {
      where.serviceCategoryId = Number.parseInt(categoryId)
    }

    if (vendorId) {
      where.vendorId = Number.parseInt(vendorId)
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = Number.parseFloat(minPrice)
      if (maxPrice) where.price.lte = Number.parseFloat(maxPrice)
    }

    const [services, total] = await Promise.all([
      prisma.service.findMany({
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
          category: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { id: "desc" },
      }),
      prisma.service.count({ where }),
    ])

    return NextResponse.json({
      ...createApiResponse(services, "Services retrieved successfully"),
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

// POST /api/services - Create service
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["vendorId", "name", "price", "serviceCategoryId"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { vendorId, name, description, price, serviceCategoryId } = validation.data

    // Check if vendor is verified and is service vendor
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    })

    if (!vendor) {
      return NextResponse.json(createErrorResponse("Vendor not found"), { status: 404 })
    }

    if (!vendor.isVerified) {
      return NextResponse.json(createErrorResponse("Vendor must be verified"), { status: 403 })
    }

    if (vendor.vendorType !== "SERVICE") {
      return NextResponse.json(createErrorResponse("Vendor must be a service vendor"), { status: 403 })
    }

    const service = await prisma.service.create({
      data: {
        vendorId,
        name,
        description,
        price,
        serviceCategoryId,
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return NextResponse.json(createApiResponse(service, "Service created successfully"), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
