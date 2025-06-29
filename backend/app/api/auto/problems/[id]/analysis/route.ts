import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError, validateRequest } from "@/lib/utils/api"

// POST /api/auto/problems/[id]/analysis - Add mechanic analysis
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const validation = await validateRequest(request, ["diagnosis", "recommendations"])
    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { diagnosis, recommendations, mechanicId } = validation.data
    const problemId = Number.parseInt(params.id)

    const analysis = await prisma.mechanicAnalysis.create({
      data: {
        problemId,
        mechanicId: mechanicId || null, // null for AI analysis
        diagnosis,
        recommendations,
      },
      include: {
        problem: {
          include: {
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
      },
    })

    return NextResponse.json(createApiResponse(analysis, "Mechanic analysis added successfully"), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

// GET /api/auto/problems/[id]/analysis - Get analysis for a problem
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const problemId = Number.parseInt(params.id)

    const analyses = await prisma.mechanicAnalysis.findMany({
      where: { problemId },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(createApiResponse(analyses, "Mechanic analyses retrieved successfully"))
  } catch (error) {
    return handleApiError(error)
  }
}
