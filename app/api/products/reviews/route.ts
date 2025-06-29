import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError, validateRequest } from "@/lib/utils/api"

// POST /api/products/reviews - Add product review
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["userId", "productId", "rating"])
    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { userId, productId, rating, comment } = validation.data

    if (rating < 1 || rating > 5) {
      return NextResponse.json(createErrorResponse("Rating must be between 1 and 5"), { status: 400 })
    }

    // Check if user has purchased this product
    const order = await prisma.order.findFirst({
      where: {
        userId,
        status: "DELIVERED",
        items: {
          some: {
            productId,
          },
        },
      },
    })

    if (!order) {
      return NextResponse.json(createErrorResponse("You can only review products you have purchased"), { status: 403 })
    }

    // Check if user already reviewed this product
    const existingReview = await prisma.productReview.findFirst({
      where: { userId, productId },
    })

    if (existingReview) {
      return NextResponse.json(createErrorResponse("You have already reviewed this product"), { status: 409 })
    }

    const review = await prisma.productReview.create({
      data: {
        userId,
        productId,
        rating,
        comment,
      },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        product: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(createApiResponse(review, "Review added successfully"), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
