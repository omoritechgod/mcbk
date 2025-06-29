import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError, validateRequest } from "@/lib/utils/api"

/**
 * @swagger
 * /api/wallet/fund:
 *   post:
 *     summary: Fund user wallet
 *     tags: [Wallet]
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
 *               - amount
 *               - paymentMethod
 *             properties:
 *               userId:
 *                 type: integer
 *                 example: 1
 *               amount:
 *                 type: number
 *                 format: float
 *                 example: 500.00
 *               paymentMethod:
 *                 type: string
 *                 enum: [card, bank_transfer, paystack]
 *                 example: "card"
 *               paymentReference:
 *                 type: string
 *                 example: "PAY_123456789"
 *     responses:
 *       201:
 *         description: Wallet funded successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Wallet not found
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["userId", "amount", "paymentMethod"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { userId, amount, paymentMethod, paymentReference } = validation.data

    if (amount <= 0) {
      return NextResponse.json(createErrorResponse("Amount must be greater than 0"), { status: 400 })
    }

    // Execute funding in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get user wallet
      const wallet = await tx.wallet.findUnique({
        where: { userId },
        include: { user: true },
      })

      if (!wallet) {
        throw new Error("Wallet not found")
      }

      // Update wallet balance
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } },
      })

      // Create wallet transaction
      const transaction = await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          type: "CREDIT",
          amount,
          description: `Wallet funding via ${paymentMethod}`,
          transactionReference: paymentReference || `FUND-${Date.now()}`,
          status: "SUCCESS",
        },
      })

      return {
        wallet: updatedWallet,
        transaction,
        newBalance: updatedWallet.balance,
      }
    })

    return NextResponse.json(createApiResponse(result, "Wallet funded successfully"), { status: 201 })
  } catch (error: any) {
    if (error.message.includes("not found")) {
      return NextResponse.json(createErrorResponse(error.message), { status: 404 })
    }
    return handleApiError(error)
  }
}
