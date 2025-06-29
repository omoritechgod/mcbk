import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError } from "@/lib/utils/api"
import jwt from "jsonwebtoken"

/**
 * @swagger
 * /api/wallet/balance:
 *   get:
 *     summary: Get user wallet balance
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: User ID (optional, uses token if not provided)
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Wallet'
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Wallet not found
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    let userId = searchParams.get("userId")

    // If no userId provided, get from JWT token
    if (!userId) {
      const authHeader = request.headers.get("authorization")
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return NextResponse.json(createErrorResponse("Authorization token required"), { status: 401 })
      }

      const token = authHeader.substring(7)
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any
      userId = decoded.userId.toString()
    }

    const wallet = await prisma.wallet.findUnique({
      where: { userId: Number.parseInt(userId) },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        transactions: {
          take: 10,
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!wallet) {
      return NextResponse.json(createErrorResponse("Wallet not found"), { status: 404 })
    }

    return NextResponse.json(createApiResponse(wallet, "Wallet balance retrieved successfully"))
  } catch (error) {
    return handleApiError(error)
  }
}
