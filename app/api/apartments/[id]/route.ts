import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError } from "@/lib/utils/api"

// GET /api/apartments/[id] - Get apartment details
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const apartment = await prisma.apartment.findUnique({
      where: { id: Number.parseInt(params.id) },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
            businessDescription: true,
            rating: true,
            user: {
              select: {
                name: true,
                phone: true,
              },
            },
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
    })

    if (!apartment) {
      return NextResponse.json(createErrorResponse("Apartment not found"), { status: 404 })
    }

    // Parse JSON fields
    const apartmentWithParsedData = {
      ...apartment,
      features: apartment.features ? JSON.parse(apartment.features as string) : [],
      imageUrls: apartment.imageUrls ? JSON.parse(apartment.imageUrls as string) : [],
    }

    return NextResponse.json(createApiResponse(apartmentWithParsedData, "Apartment retrieved successfully"))
  } catch (error) {
    return handleApiError(error)
  }
}
