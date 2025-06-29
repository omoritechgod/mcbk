import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  validateRequest,
  getPaginationParams,
} from "@/lib/utils/api"

/**
 * @swagger
 * /api/food/menus:
 *   get:
 *     summary: List food menu items
 *     tags: [Food Delivery]
 *     parameters:
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: integer
 *         description: Filter by vendor ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [MAIN, SIDE, DRINK]
 *         description: Filter by food category
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search in menu name and description
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Food menus retrieved successfully
 */
export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip } = getPaginationParams(request)
    const searchParams = request.nextUrl.searchParams
    const vendorId = searchParams.get("vendorId")
    const category = searchParams.get("category")
    const search = searchParams.get("search")

    const where: any = {}

    if (vendorId) {
      where.vendorId = Number.parseInt(vendorId)
    }

    if (category) {
      where.category = category.toUpperCase()
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ]
    }

    // Only show menus from verified vendors
    where.vendor = {
      isVerified: true,
    }

    const [menus, total] = await Promise.all([
      prisma.foodMenu.findMany({
        where,
        skip,
        take: limit,
        include: {
          vendor: {
            select: {
              id: true,
              businessName: true,
              rating: true,
              user: {
                select: {
                  name: true,
                  phone: true,
                },
              },
            },
          },
        },
        orderBy: { id: "desc" },
      }),
      prisma.foodMenu.count({ where }),
    ])

    return NextResponse.json({
      ...createApiResponse(menus, "Food menus retrieved successfully"),
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

/**
 * @swagger
 * /api/food/menus:
 *   post:
 *     summary: Create food menu item (vendor only)
 *     tags: [Food Delivery]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - vendorId
 *               - name
 *               - price
 *               - category
 *             properties:
 *               vendorId:
 *                 type: integer
 *                 example: 1
 *               name:
 *                 type: string
 *                 example: "Jollof Rice with Chicken"
 *               description:
 *                 type: string
 *                 example: "Delicious Nigerian jollof rice served with grilled chicken"
 *               price:
 *                 type: number
 *                 format: float
 *                 example: 2500.00
 *               category:
 *                 type: string
 *                 enum: [MAIN, SIDE, DRINK]
 *                 example: "MAIN"
 *               imageUrl:
 *                 type: string
 *                 example: "https://example.com/jollof.jpg"
 *     responses:
 *       201:
 *         description: Food menu item created successfully
 *       400:
 *         description: Validation error
 *       403:
 *         description: Vendor not verified
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["vendorId", "name", "price", "category"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { vendorId, name, description, price, category, imageUrl } = validation.data

    // Check if vendor is verified and is food vendor
    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
    })

    if (!vendor) {
      return NextResponse.json(createErrorResponse("Vendor not found"), { status: 404 })
    }

    if (!vendor.isVerified) {
      return NextResponse.json(createErrorResponse("Vendor must be verified to add menu items"), { status: 403 })
    }

    if (vendor.vendorType !== "FOOD") {
      return NextResponse.json(createErrorResponse("Only food vendors can add menu items"), { status: 403 })
    }

    const menu = await prisma.foodMenu.create({
      data: {
        vendorId,
        name,
        description,
        price,
        category: category.toUpperCase(),
        imageUrl,
      },
      include: {
        vendor: {
          select: {
            id: true,
            businessName: true,
          },
        },
      },
    })

    return NextResponse.json(createApiResponse(menu, "Food menu item created successfully"), { status: 201 })
  } catch (error) {
    return handleApiError(error)
  }
}
