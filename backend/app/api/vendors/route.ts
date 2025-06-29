import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  validateRequest,
  getPaginationParams,
} from "@/lib/utils/api"
import type { CreateVendorRequest } from "@/types/api"

// GET /api/vendors - List vendors with filtering
export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip } = getPaginationParams(request)
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const businessType = searchParams.get("businessType")
    const verificationStatus = searchParams.get("verificationStatus")
    const isActive = searchParams.get("isActive")
    const isApproved = searchParams.get("isApproved")

    const where: any = {}

    if (search) {
      where.OR = [
        { businessName: { contains: search, mode: "insensitive" } },
        {
          user: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
            ],
          },
        },
      ]
    }

    if (businessType) {
      where.businessType = businessType
    }

    if (verificationStatus) {
      where.verificationStatus = verificationStatus
    }

    if (isActive !== null) {
      where.isActive = isActive === "true"
    }

    if (isApproved !== null) {
      where.isApproved = isApproved === "true"
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        skip,
        take: limit,
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
        orderBy: { createdAt: "desc" },
      }),
      prisma.vendor.count({ where }),
    ])

    return NextResponse.json({
      ...createApiResponse(vendors, "Vendors retrieved successfully"),
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

// POST /api/vendors - Create new vendor
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, [
      "userId",
      "businessName",
      "businessType",
      "address",
      "city",
      "state",
      "country",
      "zipCode",
    ])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const vendorData: CreateVendorRequest & { userId: string } = validation.data

    // Check if user already has a vendor account
    const existingVendor = await prisma.vendor.findUnique({
      where: { userId: vendorData.userId },
    })

    if (existingVendor) {
      return NextResponse.json(createErrorResponse("User already has a vendor account"), { status: 409 })
    }

    const vendor = await prisma.vendor.create({
      data: {
        userId: vendorData.userId,
        businessName: vendorData.businessName,
        businessType: vendorData.businessType as any,
        description: vendorData.description,
        address: vendorData.address,
        city: vendorData.city,
        state: vendorData.state,
        country: vendorData.country,
        zipCode: vendorData.zipCode,
        latitude: vendorData.latitude,
        longitude: vendorData.longitude,
        businessLicense: vendorData.businessLicense,
        taxId: vendorData.taxId,
      },
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

    return NextResponse.json(createApiResponse(vendor, "Vendor created successfully"), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
