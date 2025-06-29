import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError } from "@/lib/utils/api"

// GET /api/apartments/availability?apartmentId=123&checkIn=2024-01-01&checkOut=2024-01-03
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const apartmentId = searchParams.get("apartmentId")
    const checkIn = searchParams.get("checkIn")
    const checkOut = searchParams.get("checkOut")

    if (!apartmentId || !checkIn || !checkOut) {
      return NextResponse.json(createErrorResponse("apartmentId, checkIn, and checkOut are required"), { status: 400 })
    }

    const checkInDate = new Date(checkIn)
    const checkOutDate = new Date(checkOut)

    if (checkInDate >= checkOutDate) {
      return NextResponse.json(createErrorResponse("Check-out date must be after check-in date"), { status: 400 })
    }

    // Check for conflicting bookings
    const conflictingBooking = await prisma.apartmentBooking.findFirst({
      where: {
        apartmentId: Number.parseInt(apartmentId),
        status: "CONFIRMED",
        OR: [
          {
            checkInDate: { lte: checkOutDate },
            checkOutDate: { gte: checkInDate },
          },
        ],
      },
    })

    const isAvailable = !conflictingBooking

    // Calculate total price
    const apartment = await prisma.apartment.findUnique({
      where: { id: Number.parseInt(apartmentId) },
      select: { pricePerNight: true },
    })

    if (!apartment) {
      return NextResponse.json(createErrorResponse("Apartment not found"), { status: 404 })
    }

    const nights = Math.ceil((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24))
    const totalPrice = apartment.pricePerNight * nights

    return NextResponse.json(
      createApiResponse(
        {
          isAvailable,
          nights,
          pricePerNight: apartment.pricePerNight,
          totalPrice,
          conflictingBooking: conflictingBooking ? true : false,
        },
        "Availability checked successfully",
      ),
    )
  } catch (error) {
    return handleApiError(error)
  }
}
