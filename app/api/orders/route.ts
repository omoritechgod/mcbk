import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  validateRequest,
  getPaginationParams,
} from "@/lib/utils/api"

// GET /api/orders - List orders
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
      where.items = {
        some: {
          product: {
            vendorId: Number.parseInt(vendorId),
          },
        },
      }
    }

    if (status) {
      where.status = status.toUpperCase()
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
            },
          },
          deliveryAddress: true,
          items: {
            include: {
              product: {
                include: {
                  vendor: {
                    select: {
                      id: true,
                      businessName: true,
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.order.count({ where }),
    ])

    return NextResponse.json({
      ...createApiResponse(orders, "Orders retrieved successfully"),
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

// POST /api/orders - Create new order with escrow
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["userId", "items", "deliveryAddressId"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { userId, items, deliveryAddressId } = validation.data

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(createErrorResponse("Items array is required"), { status: 400 })
    }

    // Execute order creation with escrow in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get user wallet
      const userWallet = await tx.wallet.findUnique({
        where: { userId },
      })

      if (!userWallet) {
        throw new Error("User wallet not found")
      }

      // Calculate total and validate products
      let total = 0
      const orderItems = []

      for (const item of items) {
        const product = await tx.product.findUnique({
          where: { id: item.productId },
          include: { vendor: true },
        })

        if (!product) {
          throw new Error(`Product ${item.productId} not found`)
        }

        if (!product.vendor.isVerified) {
          throw new Error(`Product from unverified vendor: ${product.name}`)
        }

        if (product.stock < item.quantity) {
          throw new Error(`Insufficient stock for product: ${product.name}`)
        }

        const itemTotal = product.price * item.quantity
        total += itemTotal

        orderItems.push({
          productId: product.id,
          quantity: item.quantity,
          price: product.price,
        })

        // Update product stock
        await tx.product.update({
          where: { id: product.id },
          data: { stock: { decrement: item.quantity } },
        })
      }

      // Check if user has sufficient balance
      if (userWallet.balance < total) {
        throw new Error("Insufficient wallet balance")
      }

      // Create order
      const order = await tx.order.create({
        data: {
          userId,
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
              product: {
                include: {
                  vendor: true,
                },
              },
            },
          },
        },
      })

      // Debit user wallet (escrow - funds held until delivery confirmation)
      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: total } },
      })

      // Create wallet transaction for escrow
      await tx.walletTransaction.create({
        data: {
          walletId: userWallet.id,
          type: "DEBIT",
          amount: total,
          description: `Order payment (Escrow) - Order #${order.id}`,
          transactionReference: `ORD-${order.id}-${Date.now()}`,
          status: "SUCCESS",
        },
      })

      return order
    })

    return NextResponse.json(
      createApiResponse(result, "Order created successfully. Funds held in escrow until delivery."),
      { status: 201 },
    )
  } catch (error: any) {
    if (error.message.includes("Insufficient")) {
      return NextResponse.json(createErrorResponse(error.message), { status: 400 })
    }
    return handleApiError(error)
  }
}
