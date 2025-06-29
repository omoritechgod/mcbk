import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  validateRequest,
  getPaginationParams,
} from "@/lib/utils/api"

// GET /api/apartments - List apartments
export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip } = getPaginationParams(request)
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const apartmentType = searchParams.get("apartmentType")
    const minPrice = searchParams.get("minPrice")
    const maxPrice = searchParams.get("maxPrice")
    const location = searchParams.get("location")

    const where: any = {
      vendor: {
        isVerified: true,
        vendorType: "APARTMENT",
      },
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { location: { contains: search, mode: "insensitive" } },
      ]
    }

    if (apartmentType) {
      where.apartmentType = apartmentType.toUpperCase()
    }

    if (location) {
      where.location = { contains: location, mode: "insensitive" }
    }

    if (minPrice || maxPrice) {
      where.pricePerNight = {}
      if (minPrice) where.pricePerNight.gte = Number.parseFloat(minPrice)
      if (maxPrice) where.pricePerNight.lte = Number.parseFloat(maxPrice)
    }

    const [apartments, total] = await Promise.all([
      prisma.apartment.findMany({
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
          bookings: {
            where: {
              status: "CONFIRMED",
            },
            select: {
              checkInDate: true,
              checkOutDate: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.apartment.count({ where }),
    ])

    return NextResponse.json({
      ...createApiResponse(apartments, "Apartments retrieved successfully"),
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

// POST /api/apartments - Create apartment listing
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, [
      "vendorId",
      "name",
      "location",
      "apartmentType",
      "pricePerNight",
    ])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { vendorId, name, location, apartmentType, pricePerNight, features, imageUrls } = validation.data

    // Check if vendor is verified and is apartment vendor
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    })

    if (!vendor) {
      return NextResponse.json(createErrorResponse("Vendor not found"), { status: 404 })
    }

    if (!vendor.isVerified) {
      return NextResponse.json(createErrorResponse("Vendor must be verified"), { status: 403 })
    }

    if (vendor.vendorType !== "APARTMENT") {
      return NextResponse.json(createErrorResponse("Vendor must be an apartment vendor"), { status: 403 })
    }

    const apartment = await prisma.apartment.create({
      data: {
        vendorId,
        name,
        location,
        apartmentType: apartmentType.toUpperCase(),
        pricePerNight,
        features: features ? JSON.stringify(features) : null,
        imageUrls: imageUrls ? JSON.stringify(imageUrls) : null,
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

    return NextResponse.json(createApiResponse(apartment, "Apartment listing created successfully"), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
