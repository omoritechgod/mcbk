import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  validateRequest,
  getPaginationParams,
} from "@/lib/utils/api"
import type { CreateUserRequest } from "@/types/api"
import bcrypt from "bcryptjs"

// GET /api/users - List users with pagination
export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip } = getPaginationParams(request)
    const searchParams = request.nextUrl.searchParams
    const search = searchParams.get("search")
    const isActive = searchParams.get("isActive")

    const where: any = {}

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ]
    }

    if (isActive !== null) {
      where.isActive = isActive === "true"
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          phone: true,
          firstName: true,
          lastName: true,
          avatar: true,
          isActive: true,
          isVerified: true,
          createdAt: true,
          updatedAt: true,
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

// POST /api/users - Create new user
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["email", "firstName", "lastName", "password"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const userData: CreateUserRequest = validation.data

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 12)

    const user = await prisma.user.create({
      data: {
        email: userData.email,
        phone: userData.phone,
        firstName: userData.firstName,
        lastName: userData.lastName,
        password: hashedPassword,
        dateOfBirth: userData.dateOfBirth ? new Date(userData.dateOfBirth) : null,
        gender: userData.gender,
      },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        isActive: true,
        isVerified: true,
        createdAt: true,
      },
    })

    return NextResponse.json(createApiResponse(user, "User created successfully"), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
