import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError, validateRequest } from "@/lib/utils/api"

// POST /api/auto/problems - Submit vehicle problem
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["userId", "vehicleMake", "vehicleModel", "problemDescription"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { userId, vehicleMake, vehicleModel, problemDescription } = validation.data

    const problem = await prisma.vehicleProblem.create({
      data: {
        userId,
        vehicleMake,
        vehicleModel,
        problemDescription,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
          },
        },
      },
    })

    return NextResponse.json(createApiResponse(problem, "Vehicle problem submitted successfully"), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

// GET /api/auto/problems - List vehicle problems (for mechanics)
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    const where: any = {}

    if (userId) {
      where.userId = Number.parseInt(userId)
    }

    const problems = await prisma.vehicleProblem.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
        mechanicAnalysis: {
          include: {
            problem: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(createApiResponse(problems, "Vehicle problems retrieved successfully"))
  } catch (error) {
    return handleApiError(error)
  }
}
