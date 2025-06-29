import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, createErrorResponse, handleApiError, validateRequest, hashPassword } from "@/lib/utils/api"

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user (customer or vendor)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - phone
 *               - password
 *               - userType
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 format: email
 *                 example: "john@example.com"
 *               phone:
 *                 type: string
 *                 example: "+2348123456789"
 *               password:
 *                 type: string
 *                 minLength: 6
 *                 example: "password123"
 *               userType:
 *                 type: string
 *                 enum: [customer, vendor]
 *                 example: "customer"
 *               vendorData:
 *                 type: object
 *                 properties:
 *                   vendorType:
 *                     type: string
 *                     enum: [PRODUCT, FOOD, RIDE, APARTMENT, SERVICE]
 *                   businessName:
 *                     type: string
 *                   businessDescription:
 *                     type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["name", "email", "phone", "password", "userType"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { name, email, phone, password, userType, vendorData } = validation.data

    // Validate user type
    if (!["customer", "vendor"].includes(userType)) {
      return NextResponse.json(createErrorResponse("Invalid user type"), { status: 400 })
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user with transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const user = await tx.user.create({
        data: {
          name,
          email,
          phone,
          password: hashedPassword,
          userType: userType.toUpperCase() as any,
        },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          userType: true,
          status: true,
          createdAt: true,
        },
      })

      // Create wallet for user
      await tx.wallet.create({
        data: {
          userId: user.id,
          balance: 0,
          currency: "NGN",
        },
      })

      // If vendor, create vendor profile
      let vendor = null
      if (userType === "vendor" && vendorData) {
        vendor = await tx.vendor.create({
          data: {
            userId: user.id,
            vendorType: vendorData.vendorType.toUpperCase(),
            businessName: vendorData.businessName,
            businessDescription: vendorData.businessDescription,
            businessLogo: vendorData.businessLogo,
            isVerified: false, // Requires verification
          },
        })
      }

      return { user, vendor }
    })

    return NextResponse.json(
      createApiResponse(
        result,
        userType === "vendor"
          ? "Vendor account created successfully. Verification required before you can start selling."
          : "Customer account created successfully",
      ),
      { status: 201 },
    )
  } catch (error) {
    return handleApiError(error)
  }
}
