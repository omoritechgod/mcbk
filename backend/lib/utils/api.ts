import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string[]>
}

export function createApiResponse<T>(data?: T, message?: string, success = true): ApiResponse<T> {
  return {
    success,
    data,
    message,
  }
}

export function createErrorResponse(error: string, errors?: Record<string, string[]>): ApiResponse {
  return {
    success: false,
    error,
    errors,
  }
}

export function handleApiError(error: any): NextResponse {
  console.error("API Error:", error)

  if (error.code === "P2002") {
    return NextResponse.json(createErrorResponse("A record with this information already exists"), { status: 409 })
  }

  if (error.code === "P2025") {
    return NextResponse.json(createErrorResponse("Record not found"), { status: 404 })
  }

  return NextResponse.json(createErrorResponse("Internal server error"), { status: 500 })
}

export async function validateRequest(
  request: NextRequest,
  requiredFields: string[],
): Promise<{ isValid: boolean; data?: any; errors?: Record<string, string[]> }> {
  try {
    const data = await request.json()
    const errors: Record<string, string[]> = {}

    requiredFields.forEach((field) => {
      if (!data[field]) {
        errors[field] = [`${field} is required`]
      }
    })

    if (Object.keys(errors).length > 0) {
      return { isValid: false, errors }
    }

    return { isValid: true, data }
  } catch (error) {
    return {
      isValid: false,
      errors: { general: ["Invalid JSON data"] },
    }
  }
}

export function getPaginationParams(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const page = Math.max(1, Number.parseInt(searchParams.get("page") || "1"))
  const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get("limit") || "10")))
  const skip = (page - 1) * limit

  return { page, limit, skip }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}
