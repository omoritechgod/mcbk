export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
  errors?: Record<string, string[]>
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface CreateUserRequest {
  email: string
  phone?: string
  firstName: string
  lastName: string
  password: string
  dateOfBirth?: string
  gender?: "MALE" | "FEMALE" | "OTHER"
}

export interface CreateVendorRequest {
  businessName: string
  businessType: string
  description?: string
  address: string
  city: string
  state: string
  country: string
  zipCode: string
  latitude?: number
  longitude?: number
  businessLicense?: string
  taxId?: string
}

export interface CreateProductRequest {
  categoryId: string
  name: string
  description?: string
  shortDescription?: string
  price: number
  comparePrice?: number
  costPrice?: number
  sku?: string
  trackQuantity?: boolean
  quantity?: number
  lowStockAlert?: number
  weight?: number
  dimensions?: {
    length: number
    width: number
    height: number
  }
  images?: string[]
  metaTitle?: string
  metaDescription?: string
  isActive?: boolean
  isFeatured?: boolean
}

export interface VendorVerificationRequest {
  vendorId: string
  status: "APPROVED" | "REJECTED"
  notes?: string
}
