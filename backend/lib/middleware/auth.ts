import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import { prisma } from "@/lib/db"

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: number
    email: string
    userType: string
    vendorId?: number
  }
}

export async function authenticateToken(request: NextRequest): Promise<any> {
  const authHeader = request.headers.get("authorization")

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Authorization token required", status: 401 }
  }

  try {
    const token = authHeader.substring(7)
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as any

    // Verify user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        userType: true,
        status: true,
        vendor: {
          select: {
            id: true,
          },
        },
      },
    })

    if (!user || user.status !== "ACTIVE") {
      return { error: "Invalid or inactive user", status: 401 }
    }

    return {
      user: {
        id: user.id,
        email: user.email,
        userType: user.userType,
        vendorId: user.vendor?.id,
      },
    }
  } catch (error) {
    return { error: "Invalid token", status: 401 }
  }
}

export function requireAuth(handler: Function) {
  return async (request: NextRequest, context: any) => {
    const authResult = await authenticateToken(request)

    if (authResult.error) {
      return new Response(JSON.stringify({ success: false, error: authResult.error }), {
        status: authResult.status,
        headers: { "Content-Type": "application/json" },
      })
    }
    // Add user to request
    ;(request as AuthenticatedRequest).user = authResult.user

    return handler(request, context)
  }
}

export function requireVendor(handler: Function) {
  return requireAuth(async (request: AuthenticatedRequest, context: any) => {
    if (request.user?.userType !== "VENDOR") {
      return new Response(JSON.stringify({ success: false, error: "Vendor access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    return handler(request, context)
  })
}

export function requireAdmin(handler: Function) {
  return requireAuth(async (request: AuthenticatedRequest, context: any) => {
    // Check if user is admin
    const admin = await prisma.admin.findUnique({
      where: { userId: request.user!.id },
    })

    if (!admin) {
      return new Response(JSON.stringify({ success: false, error: "Admin access required" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      })
    }

    return handler(request, context)
  })
}
