import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError } from "@/lib/utils/api"

// GET /api/products/[id] - Get product by ID
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await prisma.product.findUnique({
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
        category: true,
        reviews: {
          include: {
            user: {
              select: {
                name: true,
              },
            },
          },
          orderBy: { id: "desc" },
          take: 10,
        },
      },
    })

    if (!product) {
      return NextResponse.json(createErrorResponse("Product not found"), { status: 404 })
    }

    // Calculate average rating
    const averageRating =
      product.reviews.length > 0
        ? product.reviews.reduce((sum, review) => sum + review.rating, 0) / product.reviews.length
        : 0

    const productWithRating = {
      ...product,
      averageRating,
      reviewCount: product.reviews.length,
    }

    return NextResponse.json(createApiResponse(productWithRating, "Product retrieved successfully"))
  } catch (error) {
    return handleApiError(error)
  }
}

// PUT /api/products/[id] - Update product (vendor only)
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const data = await request.json()
    const productId = Number.parseInt(params.id)

    const product = await prisma.product.update({
      where: { id: productId },
      data,
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
        category: true,
      },
    })

    return NextResponse.json(createApiResponse(product, "Product updated successfully"))
  } catch (error) {
    return handleApiError(error)
  }
}

// DELETE /api/products/[id] - Delete product (vendor only)
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const productId = Number.parseInt(params.id)

    await prisma.product.delete({
      where: { id: productId },
    })

    return NextResponse.json(createApiResponse(null, "Product deleted successfully"))
  } catch (error) {
    return handleApiError(error)
  }
}
