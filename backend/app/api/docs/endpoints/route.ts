import { NextResponse } from "next/server"

const endpoints = [
  {
    category: "🔐 Authentication",
    endpoints: [
      { method: "POST", path: "/api/auth/register", description: "Register new user (customer/vendor)" },
      { method: "POST", path: "/api/auth/login", description: "User login with JWT token" },
      { method: "GET", path: "/api/auth/me", description: "Get current user profile" },
    ],
  },
  {
    category: "👥 Users",
    endpoints: [
      { method: "GET", path: "/api/users", description: "List users with pagination and search" },
      { method: "POST", path: "/api/users", description: "Create new user" },
      { method: "GET", path: "/api/users/{id}", description: "Get user by ID" },
      { method: "PUT", path: "/api/users/{id}", description: "Update user profile" },
      { method: "DELETE", path: "/api/users/{id}", description: "Deactivate user account" },
    ],
  },
  {
    category: "🏪 Vendors",
    endpoints: [
      { method: "GET", path: "/api/vendors", description: "List vendors with filtering" },
      { method: "POST", path: "/api/vendors", description: "Create vendor profile" },
      { method: "GET", path: "/api/vendors/{id}", description: "Get vendor details" },
      { method: "PUT", path: "/api/vendors/{id}", description: "Update vendor profile" },
      { method: "POST", path: "/api/vendors/{id}/verify", description: "Verify vendor (admin)" },
      { method: "POST", path: "/api/vendors/verify", description: "Submit verification documents" },
    ],
  },
  {
    category: "🛒 Products & E-commerce",
    endpoints: [
      { method: "GET", path: "/api/products", description: "List products with filtering" },
      { method: "POST", path: "/api/products", description: "Create new product (vendor)" },
      { method: "GET", path: "/api/products/{id}", description: "Get product details" },
      { method: "PUT", path: "/api/products/{id}", description: "Update product (vendor)" },
      { method: "DELETE", path: "/api/products/{id}", description: "Delete product (vendor)" },
      { method: "POST", path: "/api/products/reviews", description: "Add product review" },
      { method: "GET", path: "/api/categories", description: "Get product categories" },
      { method: "POST", path: "/api/categories", description: "Create category (admin)" },
    ],
  },
  {
    category: "📦 Orders",
    endpoints: [
      { method: "GET", path: "/api/orders", description: "List orders with filtering" },
      { method: "POST", path: "/api/orders", description: "Create order with escrow payment" },
      { method: "POST", path: "/api/orders/{id}/complete", description: "Complete order and release escrow" },
    ],
  },
  {
    category: "🍕 Food Delivery",
    endpoints: [
      { method: "GET", path: "/api/food/menus", description: "List food menus" },
      { method: "POST", path: "/api/food/menus", description: "Create food menu item (vendor)" },
      { method: "GET", path: "/api/food/orders", description: "List food orders" },
      { method: "POST", path: "/api/food/orders", description: "Create food order" },
      { method: "PUT", path: "/api/food/orders/{id}/status", description: "Update food order status" },
    ],
  },
  {
    category: "🚗 Ride Hailing",
    endpoints: [
      { method: "GET", path: "/api/rides/riders", description: "List available riders" },
      { method: "POST", path: "/api/rides/riders", description: "Register as rider (vendor)" },
      { method: "POST", path: "/api/rides/book", description: "Book a ride" },
      { method: "PUT", path: "/api/rides/{id}/status", description: "Update ride status" },
      { method: "POST", path: "/api/rides/gps", description: "Update GPS location during ride" },
    ],
  },
  {
    category: "🏠 Service Apartments",
    endpoints: [
      { method: "GET", path: "/api/apartments", description: "List apartments with filtering" },
      { method: "POST", path: "/api/apartments", description: "Create apartment listing (vendor)" },
      { method: "GET", path: "/api/apartments/{id}", description: "Get apartment details" },
      { method: "GET", path: "/api/apartments/availability", description: "Check apartment availability" },
      { method: "POST", path: "/api/apartments/book", description: "Book apartment" },
      { method: "GET", path: "/api/apartments/bookings", description: "List apartment bookings" },
      { method: "PUT", path: "/api/apartments/bookings/{id}/status", description: "Update booking status" },
    ],
  },
  {
    category: "🔧 Auto Services",
    endpoints: [
      { method: "GET", path: "/api/auto/services", description: "List auto services" },
      { method: "POST", path: "/api/auto/services", description: "Create auto service (vendor)" },
      { method: "POST", path: "/api/auto/problems", description: "Submit vehicle problem" },
      { method: "POST", path: "/api/auto/problems/{id}/analysis", description: "Add mechanic analysis" },
      { method: "POST", path: "/api/auto/bookings", description: "Book auto service" },
    ],
  },
  {
    category: "🛠️ General Services",
    endpoints: [
      { method: "GET", path: "/api/services", description: "List general services" },
      { method: "POST", path: "/api/services", description: "Create service (vendor)" },
      { method: "POST", path: "/api/services/bookings", description: "Book a service" },
    ],
  },
  {
    category: "💰 Wallet & Payments",
    endpoints: [
      { method: "GET", path: "/api/wallet/balance", description: "Get wallet balance" },
      { method: "POST", path: "/api/wallet/fund", description: "Fund wallet" },
      { method: "POST", path: "/api/wallet/transfer", description: "P2P money transfer" },
    ],
  },
  {
    category: "🔔 Notifications",
    endpoints: [
      { method: "GET", path: "/api/notifications", description: "Get user notifications" },
      { method: "PUT", path: "/api/notifications/{id}/read", description: "Mark notification as read" },
    ],
  },
  {
    category: "🔍 Search",
    endpoints: [{ method: "GET", path: "/api/search", description: "Global search across all modules" }],
  },
  {
    category: "👑 Admin",
    endpoints: [
      { method: "GET", path: "/api/admin/dashboard/stats", description: "Get admin dashboard statistics" },
      { method: "GET", path: "/api/admin/users", description: "Admin user management" },
      { method: "PUT", path: "/api/admin/users/{id}/status", description: "Update user status (admin)" },
      { method: "GET", path: "/api/admin/vendors/pending", description: "Get pending vendor verifications" },
      { method: "POST", path: "/api/admin/vendors/verify", description: "Verify vendor (admin)" },
    ],
  },
]

export async function GET() {
  return NextResponse.json({
    success: true,
    data: {
      title: "Multifunctional Marketplace API Endpoints",
      version: "1.0.0",
      baseUrl: "http://localhost:3000/api",
      totalEndpoints: endpoints.reduce((total, category) => total + category.endpoints.length, 0),
      categories: endpoints,
    },
    message: "API endpoints retrieved successfully",
  })
}
