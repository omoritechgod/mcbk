import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  validateRequest,
  getPaginationParams,
} from "@/lib/utils/api"

// GET /api/products - List products with filtering
export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip } = getPaginationParams(request)
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const categoryId = searchParams.get("categoryId")
    const vendorId = searchParams.get("vendorId")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    if (categoryId) {
      where.categoryId = Number.parseInt(categoryId)
    }

    if (vendorId) {
      where.vendorId = Number.parseInt(vendorId)
    }

    if (minPrice || maxPrice) {
      where.price = {}
      if (minPrice) where.price.gte = Number.parseFloat(minPrice)
      if (maxPrice) where.price.lte = Number.parseFloat(maxPrice)
    }

    // Only show products from verified vendors
    where.vendor = {
      isVerified: true,
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
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
          reviews: {
            select: {
              rating: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.product.count({ where }),
    ])

    // Calculate average rating for each product
    const productsWithRating = products.map((product) => ({
      ...product,
      averageRating:
        product.reviews.length > 0
          ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
          : 0,
      reviewCount: product.reviews.length,
    }))

    return NextResponse.json({
      ...createApiResponse(productsWithRating, "Products retrieved successfully"),
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

// POST /api/products - Create new product (vendor only)
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["vendorId", "name", "price", "categoryId", "stock"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { vendorId, name, description, price, categoryId, imageUrl, stock } = validation.data

    // Check if vendor is verified
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    })

    if (!vendor) {
      return NextResponse.json(createErrorResponse("Vendor not found"), { status: 404 })
    }

    if (!vendor.isVerified) {
      return NextResponse.json(createErrorResponse("Vendor must be verified to add products"), { status: 403 })
    }

    const product = await prisma.product.create({
      data: {
        vendorId,
        name,
        description,
        price,
        categoryId,
        imageUrl,
        stock,
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

    return NextResponse.json(createApiResponse(product, "Product created successfully"), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
