import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError } from "@/lib/utils/api"

// POST /api/orders/[id]/complete - Complete order and release escrow
export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const orderId = Number.parseInt(params.id)

    // Execute order completion with escrow release in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get order details
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              product: {
                include: {
                  vendor: {
                    include: {
                      user: {
                        include: {
                          wallet: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      })

      if (!order) {
        throw new Error("Order not found")
      }

      if (order.status !== "DELIVERED") {
        throw new Error("Order must be delivered before completion")
      }

      // Group items by vendor and calculate amounts
      const vendorPayments = new Map()

      for (const item of order.items) {
        const vendorId = item.product.vendor.id
        const vendorUserId = item.product.vendor.userId
        const amount = item.price * item.quantity

        if (vendorPayments.has(vendorId)) {
          vendorPayments.get(vendorId).amount += amount
        } else {
          vendorPayments.set(vendorId, {
            vendorId,
            vendorUserId,
            amount,
            wallet: item.product.vendor.user.wallet,
          })
        }
      }

      // Release escrow to vendors
      for (const [vendorId, payment] of vendorPayments) {
        if (!payment.wallet) {
          throw new Error(`Vendor ${vendorId} wallet not found`)
        }

        // Credit vendor wallet
        await tx.wallet.update({
          where: { id: payment.wallet.id },
          data: { balance: { increment: payment.amount } },
        })

        // Create wallet transaction for vendor
        await tx.walletTransaction.create({
          data: {
            walletId: payment.wallet.id,
            type: "CREDIT",
            amount: payment.amount,
            description: `Order payment - Order #${orderId}`,
            transactionReference: `ORD-PAY-${orderId}-${vendorId}-${Date.now()}`,
            status: "SUCCESS",
          },
        })
      }

      // Update order status
      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { status: "DELIVERED" },
      })

      return updatedOrder
    })

    return NextResponse.json(createApiResponse(result, "Order completed and payments released to vendors"))
  } catch (error: any) {
    if (error.message.includes("not found") || error.message.includes("must be delivered")) {
      return NextResponse.json(createErrorResponse(error.message), { status: 400 })
    }
    return handleApiError(error)
  }
}
