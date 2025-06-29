import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { createApiResponse, handleApiError } from "@/lib/utils/api"

// GET /api/admin/dashboard/stats - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const [
      totalUsers,
      totalVendors,
      pendingVerifications,
      totalOrders,
      totalRevenue,
      activeRides,
      apartmentBookings,
      serviceBookings,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.vendor.count(),
      prisma.verification.count({ where: { status: "PENDING" } }),
      prisma.order.count(),
      prisma.walletTransaction.aggregate({
        where: { type: "CREDIT" },
        _sum: { amount: true },
      }),
      prisma.ride.count({ where: { status: "ONGOING" } }),
      prisma.apartmentBooking.count({ where: { status: "CONFIRMED" } }),
      prisma.serviceBooking.count({ where: { status: "CONFIRMED" } }),
    ])

    const stats = {
      users: {
        total: totalUsers,
        vendors: totalVendors,
        customers: totalUsers - totalVendors,
      },
      verifications: {
        pending: pendingVerifications,
      },
      orders: {
        total: totalOrders,
      },
      revenue: {
        total: totalRevenue._sum.amount || 0,
      },
      activeServices: {
        rides: activeRides,
        apartments: apartmentBookings,
        services: serviceBookings,
      },
    }

    return NextResponse.json(createApiResponse(stats, "Dashboard statistics retrieved successfully"))
  } catch (error) {
    return handleApiError(error)
  }
}
