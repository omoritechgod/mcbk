import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import {
  createApiResponse,
  createErrorResponse,
  handleApiError,
  validateRequest,
  verifyPassword,
} from "@/lib/utils/api"
import jwt from "jsonwebtoken"

// POST /api/auth/login - User login
export async function POST(request: NextRequest) {
  try {
    const validation = await validateRequest(request, ["email", "password"])

    if (!validation.isValid) {
      return NextResponse.json(createErrorResponse("Validation failed", validation.errors), { status: 400 })
    }

    const { email, password } = validation.data

    // Find user with vendor info
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        vendor: true,
        wallet: true,
      },
    })

    if (!user) {
      return NextResponse.json(createErrorResponse("Invalid credentials"), { status: 401 })
    }

    // Check if user is active
    if (user.status !== "ACTIVE") {
      return NextResponse.json(createErrorResponse("Account is inactive or banned"), { status: 403 })
    }

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(createErrorResponse("Invalid credentials"), { status: 401 })
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        userType: user.userType,
        vendorId: user.vendor?.id,
      },
      process.env.JWT_SECRET || "your-secret-key",
      { expiresIn: "7d" },
    )

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user

    return NextResponse.json(
      createApiResponse(
        {
          user: userWithoutPassword,
          token,
        },
        "Login successful",
      ),
    )
  } catch (error) {
    return handleApiError(error)
  }
}
