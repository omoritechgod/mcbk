import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError, validateRequest } from "@/lib/utils/api"

// POST /api/rides/gps - Add GPS location for ride tracking
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["rideId", "latitude", "longitude"])
    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { rideId, latitude, longitude } = validation.data

    const gpsLog = await prisma.gpsLog.create({
      data: {
        rideId,
        timestamp: new Date(),
        latitude,
        longitude,
      },
    })

    return NextResponse.json(createApiResponse(gpsLog, "GPS location recorded"), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}

// GET /api/rides/gps?rideId=123 - Get GPS tracking for a ride
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const rideId = searchParams.get("rideId")

    if (!rideId) {
      return NextResponse.json(createErrorResponse("Ride ID is required"), { status: 400 })
    }

    const gpsLogs = await prisma.gpsLog.findMany({
      where: { rideId: Number.parseInt(rideId) },
      orderBy: { timestamp: "desc" },
      take: 50, // Last 50 GPS points
    })

    return NextResponse.json(createApiResponse(gpsLogs, "GPS tracking data retrieved"))
  } catch (error) {
    return handleApiError(error)
  }
}
