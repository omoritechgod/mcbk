import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  validateRequest,
  getPaginationParams,
} from "@/lib/utils/api"

// GET /api/rides/riders - List available riders
export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip } = getPaginationParams(request)
    const searchParams = request.nextUrl.searchParams
    const area = searchParams.get("area")
    const status = searchParams.get("status") || "ACTIVE"

    const where: any = {
      status: status.toUpperCase(),
      vendor: {
        isVerified: true,
        vendorType: "RIDE",
      },
    }

    if (area) {
      where.assignedArea = { contains: area, mode: "insensitive" }
    }

    const [riders, total] = await Promise.all([
      prisma.rider.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          vendor: {
            select: {
              id: true,
              businessName: true,
              rating: true,
            },
          },
        },
        orderBy: { id: "desc" },
      }),
      prisma.rider.count({ where }),
    ])

    return NextResponse.json({
      ...createApiResponse(riders, "Riders retrieved successfully"),
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

// POST /api/rides/riders - Register as rider
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, [
      "userId",
      "vendorId",
      "vehicleType",
      "licenseNumber",
      "assignedArea",
    ])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { userId, vendorId, vehicleType, licenseNumber, assignedArea } = validation.data

    // Check if vendor is verified and is ride vendor
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    })

    if (!vendor) {
      return NextResponse.json(createErrorResponse("Vendor not found"), { status: 404 })
    }

    if (!vendor.isVerified) {
      return NextResponse.json(createErrorResponse("Vendor must be verified"), { status: 403 })
    }

    if (vendor.vendorType !== "RIDE") {
      return NextResponse.json(createErrorResponse("Vendor must be a ride vendor"), { status: 403 })
    }

    const rider = await prisma.rider.create({
      data: {
        userId,
        vendorId,
        vehicleType: vehicleType.toUpperCase(),
        licenseNumber,
        assignedArea,
        status: "ACTIVE",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    })

    return NextResponse.json(createApiResponse(rider, "Rider registered successfully"), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
