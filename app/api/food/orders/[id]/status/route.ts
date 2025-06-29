import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError, validateRequest } from "@/lib/utils/api"

/**
 * @swagger
 * /api/food/orders/{id}/status:
 *   put:
 *     summary: Update food order status
 *     tags: [Food Delivery]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Food order ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PENDING, PREPARING, DELIVERED, CANCELLED]
 *                 example: "PREPARING"
 *     responses:
 *       200:
 *         description: Food order status updated successfully
 *       400:
 *         description: Invalid status
 *       404:
 *         description: Order not found
 */
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const validation = await validateRequest(request, ["status"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { status } = validation.data
    const orderId = Number.parseInt(params.id)

    if (!["PENDING", "PREPARING", "DELIVERED", "CANCELLED"].includes(status.toUpperCase())) {
      return NextResponse.json(createErrorResponse("Invalid status"), { status: 400 })
    }

    // Execute status update with payment release if delivered
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.foodOrder.findUnique({
        where: { id: orderId },
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
      })

      if (!order) {
        throw new Error("Order not found")
      }

      // Update order status
      const updatedOrder = await tx.foodOrder.update({
        where: { id: orderId },
        data: { status: status.toUpperCase() },
      })

      // If delivered, release payment to vendor
      if (status.toUpperCase() === "DELIVERED" && order.vendor.user.wallet) {
        await tx.wallet.update({
          where: { id: order.vendor.user.wallet.id },
          data: { balance: { increment: order.total } },
        })

        // Create vendor wallet transaction
        await tx.walletTransaction.create({
          data: {
            walletId: order.vendor.user.wallet.id,
            type: "CREDIT",
            amount: order.total,
            description: `Food order payment - Order #${orderId}`,
            transactionReference: `FOOD-PAY-${orderId}-${Date.now()}`,
            status: "SUCCESS",
          },
        })
      }

      return updatedOrder
    })

    return NextResponse.json(createApiResponse(result, "Food order status updated successfully"))
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return NextResponse.json(createErrorResponse(error.message), { status: 404 })
    }
    return handleApiError(error)
  }
}
