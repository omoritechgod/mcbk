import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, handleApiError, getPaginationParams } from "@/lib/utils/api"

// GET /api/admin/users - List all users for admin
export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip } = getPaginationParams(request)
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const userType = searchParams.get("userType")
    const status = searchParams.get("status")

    const where: any = {}

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { phone: { contains: search, mode: "insensitive" } },
      ]
    }

    if (userType) {
      where.userType = userType.toUpperCase()
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          userType: true,
          status: true,
          createdAt: true,
          vendor: {
            select: {
              id: true,
              businessName: true,
              vendorType: true,
              isVerified: true,
              rating: true,
            },
          },
          wallet: {
            select: {
              balance: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.user.count({ where }),
    ])

    return NextResponse.json({
      ...createApiResponse(users, "Users retrieved successfully"),
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
