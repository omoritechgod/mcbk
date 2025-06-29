import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError, validateRequest } from "@/lib/utils/api"

/**
 * @swagger
 * /api/wallet/transfer:
 *   post:
 *     summary: Transfer money between users (P2P)
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
 *               - senderId
 *               - receiverId
 *               - amount
 *             properties:
 *               senderId:
 *                 type: integer
 *                 example: 1
 *               receiverId:
 *                 type: integer
 *                 example: 2
 *               amount:
 *                 type: number
 *                 format: float
 *                 example: 100.50
 *               description:
 *                 type: string
 *                 example: "Payment for services"
 *     responses:
 *       201:
 *         description: Transfer completed successfully
 *       400:
 *         description: Validation error or insufficient funds
 *       404:
 *         description: User or wallet not found
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["senderId", "receiverId", "amount"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { senderId, receiverId, amount, description } = validation.data

    if (amount <= 0) {
      return NextResponse.json(createErrorResponse("Amount must be greater than 0"), { status: 400 })
    }

    if (senderId === receiverId) {
      return NextResponse.json(createErrorResponse("Cannot transfer to yourself"), { status: 400 })
    }

    // Execute transfer in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Get sender wallet
      const senderWallet = await tx.wallet.findUnique({
        where: { userId: senderId },
        include: { user: true },
      })

      if (!senderWallet) {
        throw new Error("Sender wallet not found")
      }

      // Get receiver wallet
      const receiverWallet = await tx.wallet.findUnique({
        where: { userId: receiverId },
        include: { user: true },
      })

      if (!receiverWallet) {
        throw new Error("Receiver wallet not found")
      }

      // Check sufficient balance
      if (senderWallet.balance < amount) {
        throw new Error("Insufficient balance")
      }

      // Create P2P transfer record
      const transfer = await tx.p2pTransfer.create({
        data: {
          senderId,
          receiverId,
          amount,
          description,
          status: "SUCCESS",
        },
      })

      // Update sender wallet
      await tx.wallet.update({
        where: { id: senderWallet.id },
        data: { balance: { decrement: amount } },
      })

      // Update receiver wallet
      await tx.wallet.update({
        where: { id: receiverWallet.id },
        data: { balance: { increment: amount } },
      })

      // Create sender transaction
      await tx.walletTransaction.create({
        data: {
          walletId: senderWallet.id,
          type: "DEBIT",
          amount,
          description: `Transfer to ${receiverWallet.user.name} - ${description || "P2P Transfer"}`,
          transactionReference: `P2P-${transfer.id}-${Date.now()}`,
          status: "SUCCESS",
        },
      })

      // Create receiver transaction
      await tx.walletTransaction.create({
        data: {
          walletId: receiverWallet.id,
          type: "CREDIT",
          amount,
          description: `Transfer from ${senderWallet.user.name} - ${description || "P2P Transfer"}`,
          transactionReference: `P2P-${transfer.id}-${Date.now()}`,
          status: "SUCCESS",
        },
      })

      return {
        transfer,
        senderBalance: senderWallet.balance - amount,
        receiverBalance: receiverWallet.balance + amount,
      }
    })

    return NextResponse.json(createApiResponse(result, "Transfer completed successfully"), { status: 201 })
  } catch (error: any) {
    if (error.message.includes("not found") || error.message.includes("Insufficient")) {
      return NextResponse.json(createErrorResponse(error.message), { status: 400 })
    }
    return handleApiError(error)
  }
}
