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
 * /api/food/orders:
 *   get:
 *     summary: List food orders
 *     tags: [Food Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
 *       - in: query
 *         name: vendorId
 *         schema:
 *           type: integer
 *         description: Filter by vendor ID
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, PREPARING, DELIVERED, CANCELLED]
 *         description: Filter by order status
 *     responses:
 *       200:
 *         description: Food orders retrieved successfully
 */
export async function GET(request: NextRequest) {
  try {
    const { page, limit, skip } = getPaginationParams(request)
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const vendorId = searchParams.get("vendorId")
    const status = searchParams.get("status")

    const where: any = {}

    if (userId) {
      where.userId = Number.parseInt(userId)
    }

    if (vendorId) {
      where.vendorId = Number.parseInt(vendorId)
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const [orders, total] = await Promise.all([
      prisma.foodOrder.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              phone: true,
            },
          },
          vendor: {
            select: {
              id: true,
              businessName: true,
            },
          },
          deliveryAddress: true,
          items: {
            include: {
              menu: {
                select: {
                  name: true,
                  imageUrl: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.foodOrder.count({ where }),
    ])

    return NextResponse.json({
      ...createApiResponse(orders, "Food orders retrieved successfully"),
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
 * /api/food/orders:
 *   post:
 *     summary: Create food order
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
 *               - userId
 *               - vendorId
 *               - items
 *               - deliveryAddressId
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               vendorId:
 *                 type: integer
 *                 example: 1
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     menuId:
 *                       type: integer
 *                       example: 1
 *                     quantity:
 *                       type: integer
 *                       example: 2
 *               deliveryAddressId:
 *                 type: integer
 *                 example: 1
 *     responses:
 *       201:
 *         description: Food order created successfully
 *       400:
 *         description: Validation error or insufficient funds
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["userId", "vendorId", "items", "deliveryAddressId"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { userId, vendorId, items, deliveryAddressId } = validation.data

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(createErrorResponse("Items array is required"), { status: 400 })
    }

    // Execute order creation in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get user wallet
      const userWallet = await tx.wallet.findUnique({
        where: { userId },
      })

      if (!userWallet) {
        throw new Error("User wallet not found")
      }

      // Calculate total and validate menu items
      let total = 0
      const orderItems = []

      for (const item of items) {
        const menu = await tx.foodMenu.findUnique({
          where: { id: item.menuId },
          include: { vendor: true },
        })

        if (!menu) {
          throw new Error(`Menu item ${item.menuId} not found`)
        }

        if (menu.vendorId !== vendorId) {
          throw new Error(`Menu item ${item.menuId} does not belong to vendor ${vendorId}`)
        }

        if (!menu.vendor.isVerified) {
          throw new Error(`Menu from unverified vendor: ${menu.name}`)
        }

        const itemTotal = menu.price * item.quantity
        total += itemTotal

        orderItems.push({
          menuId: menu.id,
          quantity: item.quantity,
          price: menu.price,
        })
      }

      // Check if user has sufficient balance
      if (userWallet.balance < total) {
        throw new Error("Insufficient wallet balance")
      }

      // Create food order
      const order = await tx.foodOrder.create({
        data: {
          userId,
          vendorId,
          total,
          status: "PENDING",
          deliveryAddressId,
          items: {
            create: orderItems,
          },
        },
        include: {
          items: {
            include: {
              menu: true,
            },
          },
          vendor: true,
          user: true,
        },
      })

      // Debit user wallet
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: total } },
      })

      // Create wallet transaction
      await tx.walletTransaction.create({
        data: {
          walletId: userWallet.id,
          type: "DEBIT",
          amount: total,
          description: `Food order payment - Order #${order.id}`,
          transactionReference: `FOOD-${order.id}-${Date.now()}`,
          status: "SUCCESS",
        },
      })

      return order
    })

    return NextResponse.json(createApiResponse(result, "Food order created successfully"), { status: 201 })
  } catch (error: any) {
    if (error.message.includes("Insufficient") || error.message.includes("not found")) {
      return NextResponse.json(createErrorResponse(error.message), { status: 400 })
    }
    return handleApiError(error)
  }
}
