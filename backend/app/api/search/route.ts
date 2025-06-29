import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, handleApiError } from "@/lib/utils/api"

// GET /api/search?q=query&type=products|services|vendors|apartments|food
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get("q")
    const type = searchParams.get("type") || "all"
    const limit = Math.min(20, Number.parseInt(searchParams.get("limit") || "10"))

    if (!query) {
      return NextResponse.json(createApiResponse([], "Search query is required"))
    }

    const results: any = {
      products: [],
      services: [],
      vendors: [],
      apartments: [],
      food: [],
    }

    const searchCondition = {
      contains: query,
      mode: "insensitive" as const,
    }

    // Search products
    if (type === "all" || type === "products") {
      results.products = await prisma.product.findMany({
        where: {
          OR: [{ name: searchCondition }, { description: searchCondition }],
          vendor: { isVerified: true },
        },
        include: {
          vendor: {
            select: {
              businessName: true,
              rating: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
        },
        take: limit,
      })
    }

    // Search services
    if (type === "all" || type === "services") {
      results.services = await prisma.service.findMany({
        where: {
          OR: [{ name: searchCondition }, { description: searchCondition }],
          vendor: { isVerified: true },
        },
        include: {
          vendor: {
            select: {
              businessName: true,
              rating: true,
            },
          },
          category: {
            select: {
              name: true,
            },
          },
        },
        take: limit,
      })
    }

    // Search vendors
    if (type === "all" || type === "vendors") {
      results.vendors = await prisma.vendor.findMany({
        where: {
          OR: [{ businessName: searchCondition }, { businessDescription: searchCondition }],
          isVerified: true,
        },
        include: {
          user: {
            select: {
              name: true,
            },
          },
        },
        take: limit,
      })
    }

    // Search apartments
    if (type === "all" || type === "apartments") {
      results.apartments = await prisma.apartment.findMany({
        where: {
          OR: [{ name: searchCondition }, { location: searchCondition }],
          vendor: { isVerified: true },
        },
        include: {
          vendor: {
            select: {
              businessName: true,
              rating: true,
            },
          },
        },
        take: limit,
      })
    }

    // Search food
    if (type === "all" || type === "food") {
      results.food = await prisma.foodMenu.findMany({
        where: {
          OR: [{ name: searchCondition }, { description: searchCondition }],
          vendor: { isVerified: true },
        },
        include: {
          vendor: {
            select: {
              businessName: true,
              rating: true,
            },
          },
        },
        take: limit,
      })
    }

    return NextResponse.json(createApiResponse(results, "Search completed successfully"))
  } catch (error) {
    return handleApiError(error)
  }
}
