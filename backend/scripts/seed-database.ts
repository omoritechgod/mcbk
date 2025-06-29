import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Starting database seed...")

  // Clear existing data
  console.log("🧹 Clearing existing data...")
  await prisma.walletTransaction.deleteMany()
  await prisma.p2pTransfer.deleteMany()
  await prisma.wallet.deleteMany()
  await prisma.verification.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.productReview.deleteMany()
  await prisma.product.deleteMany()
  await prisma.productCategory.deleteMany()
  await prisma.foodOrderItem.deleteMany()
  await prisma.foodOrder.deleteMany()
  await prisma.foodMenu.deleteMany()
  await prisma.apartmentBooking.deleteMany()
  await prisma.apartment.deleteMany()
  await prisma.serviceBooking.deleteMany()
  await prisma.service.deleteMany()
  await prisma.serviceCategory.deleteMany()
  await prisma.repairBooking.deleteMany()
  await prisma.mechanicAnalysis.deleteMany()
  await prisma.vehicleProblem.deleteMany()
  await prisma.autoService.deleteMany()
  await prisma.gpsLog.deleteMany()
  await prisma.ride.deleteMany()
  await prisma.rider.deleteMany()
  await prisma.vendor.deleteMany()
  await prisma.address.deleteMany()
  await prisma.admin.deleteMany()
  await prisma.user.deleteMany()

  // Hash password for all users
  const hashedPassword = await bcrypt.hash("password123", 12)

  // Create Admin User
  console.log("👑 Creating admin user...")
  const adminUser = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@marketplace.com",
      phone: "+2348000000000",
      password: hashedPassword,
      userType: "CUSTOMER",
      status: "ACTIVE",
    },
  })

  await prisma.admin.create({
    data: {
      userId: adminUser.id,
      email: adminUser.email,
      password: hashedPassword,
    },
  })

  // Create wallet for admin
  await prisma.wallet.create({
    data: {
      userId: adminUser.id,
      balance: 10000.0,
      currency: "NGN",
    },
  })

  // Create Sample Customers
  console.log("👥 Creating sample customers...")
  const customers = []
  for (let i = 1; i <= 5; i++) {
    const customer = await prisma.user.create({
      data: {
        name: `Customer ${i}`,
        email: `customer${i}@example.com`,
        phone: `+23481000000${i}`,
        password: hashedPassword,
        userType: "CUSTOMER",
        status: "ACTIVE",
      },
    })
    customers.push(customer)

    // Create wallet for customer
    await prisma.wallet.create({
      data: {
        userId: customer.id,
        balance: 5000.0 + i * 1000, // Different balances
        currency: "NGN",
      },
    })

    // Create address for customer
    await prisma.address.create({
      data: {
        userId: customer.id,
        street: `${i} Sample Street`,
        city: "Lagos",
        state: "Lagos",
        country: "Nigeria",
        latitude: 6.5244 + i * 0.01,
        longitude: 3.3792 + i * 0.01,
        isDefault: true,
      },
    })
  }

  // Create Sample Vendors
  console.log("🏪 Creating sample vendors...")
  const vendors = []
  const vendorTypes = ["PRODUCT", "FOOD", "RIDE", "APARTMENT", "SERVICE"]

  for (let i = 1; i <= 10; i++) {
    const vendorUser = await prisma.user.create({
      data: {
        name: `Vendor ${i}`,
        email: `vendor${i}@example.com`,
        phone: `+23482000000${i}`,
        password: hashedPassword,
        userType: "VENDOR",
        status: "ACTIVE",
      },
    })

    const vendor = await prisma.vendor.create({
      data: {
        userId: vendorUser.id,
        vendorType: vendorTypes[i % vendorTypes.length] as any,
        businessName: `Business ${i}`,
        businessDescription: `Description for business ${i}`,
        businessLogo: `https://example.com/logo${i}.jpg`,
        rating: 4.0 + Math.random() * 1, // Random rating between 4-5
        isVerified: i <= 7, // First 7 vendors are verified
      },
    })
    vendors.push(vendor)

    // Create wallet for vendor
    await prisma.wallet.create({
      data: {
        userId: vendorUser.id,
        balance: 2000.0 + i * 500,
        currency: "NGN",
      },
    })

    // Create verification for vendor
    await prisma.verification.create({
      data: {
        userId: vendorUser.id,
        type: "CAC",
        value: `CAC${1000000 + i}`,
        status: i <= 7 ? "VERIFIED" : "PENDING",
        verifiedAt: i <= 7 ? new Date() : null,
      },
    })
  }

  // Create Product Categories
  console.log("📂 Creating product categories...")
  const categories = ["Electronics", "Fashion", "Home & Garden", "Sports", "Books", "Health & Beauty"]

  const productCategories = []
  for (const categoryName of categories) {
    const category = await prisma.productCategory.create({
      data: { name: categoryName },
    })
    productCategories.push(category)
  }

  // Create Products
  console.log("🛒 Creating sample products...")
  const productVendors = vendors.filter((v) => v.vendorType === "PRODUCT")
  const products = []

  for (let i = 1; i <= 20; i++) {
    const vendor = productVendors[i % productVendors.length]
    const category = productCategories[i % productCategories.length]

    const product = await prisma.product.create({
      data: {
        vendorId: vendor.id,
        name: `Product ${i}`,
        description: `Description for product ${i}`,
        price: 100 + i * 50,
        categoryId: category.id,
        imageUrl: `https://example.com/product${i}.jpg`,
        stock: 10 + i * 2,
      },
    })
    products.push(product)
  }

  // Create Food Menus
  console.log("🍕 Creating food menus...")
  const foodVendors = vendors.filter((v) => v.vendorType === "FOOD")
  const foodCategories = ["MAIN", "SIDE", "DRINK"]

  for (let i = 1; i <= 15; i++) {
    const vendor = foodVendors[i % foodVendors.length]

    await prisma.foodMenu.create({
      data: {
        vendorId: vendor.id,
        name: `Food Item ${i}`,
        description: `Delicious food item ${i}`,
        price: 500 + i * 100,
        category: foodCategories[i % foodCategories.length] as any,
        imageUrl: `https://example.com/food${i}.jpg`,
      },
    })
  }

  // Create Service Categories
  console.log("🛠️ Creating service categories...")
  const serviceCategories = []
  const serviceCategoryNames = ["Cleaning", "Plumbing", "Electrical", "Painting", "Gardening"]

  for (const categoryName of serviceCategoryNames) {
    const category = await prisma.serviceCategory.create({
      data: { name: categoryName },
    })
    serviceCategories.push(category)
  }

  // Create Services
  console.log("🔧 Creating services...")
  const serviceVendors = vendors.filter((v) => v.vendorType === "SERVICE")

  for (let i = 1; i <= 10; i++) {
    const vendor = serviceVendors[i % serviceVendors.length]
    const category = serviceCategories[i % serviceCategories.length]

    await prisma.service.create({
      data: {
        vendorId: vendor.id,
        name: `Service ${i}`,
        description: `Professional service ${i}`,
        price: 1000 + i * 200,
        serviceCategoryId: category.id,
      },
    })
  }

  // Create Auto Services
  console.log("🚗 Creating auto services...")
  const autoServiceVendors = vendors.filter((v) => v.vendorType === "SERVICE").slice(0, 3)

  for (let i = 1; i <= 8; i++) {
    const vendor = autoServiceVendors[i % autoServiceVendors.length]

    await prisma.autoService.create({
      data: {
        vendorId: vendor.id,
        name: `Auto Service ${i}`,
        description: `Professional auto service ${i}`,
        priceRange: `₦${1000 + i * 500} - ₦${2000 + i * 1000}`,
      },
    })
  }

  // Create Apartments
  console.log("🏠 Creating apartments...")
  const apartmentVendors = vendors.filter((v) => v.vendorType === "APARTMENT")
  const apartmentTypes = ["HOTEL", "SHORTLET", "HOSTEL"]

  for (let i = 1; i <= 12; i++) {
    const vendor = apartmentVendors[i % apartmentVendors.length]

    await prisma.apartment.create({
      data: {
        vendorId: vendor.id,
        name: `Apartment ${i}`,
        location: `Location ${i}, Lagos`,
        apartmentType: apartmentTypes[i % apartmentTypes.length] as any,
        pricePerNight: 5000 + i * 1000,
        features: {
          wifi: true,
          parking: i % 2 === 0,
          pool: i % 3 === 0,
          gym: i % 4 === 0,
        },
        imageUrls: [`https://example.com/apt${i}_1.jpg`, `https://example.com/apt${i}_2.jpg`],
      },
    })
  }

  // Create Riders
  console.log("🏍️ Creating riders...")
  const rideVendors = vendors.filter((v) => v.vendorType === "RIDE")

  for (let i = 1; i <= 6; i++) {
    const vendor = rideVendors[i % rideVendors.length]

    await prisma.rider.create({
      data: {
        userId: vendor.userId,
        vendorId: vendor.id,
        vehicleType: "MOTORCYCLE",
        licenseNumber: `LIC${10000 + i}`,
        assignedArea: `Area ${i}`,
        status: i % 3 === 0 ? "BUSY" : "ACTIVE",
      },
    })
  }

  // Create Sample Orders
  console.log("📦 Creating sample orders...")
  for (let i = 1; i <= 5; i++) {
    const customer = customers[i % customers.length]
    const customerAddress = await prisma.address.findFirst({
      where: { userId: customer.id },
    })

    const order = await prisma.order.create({
      data: {
        userId: customer.id,
        total: 500 + i * 200,
        status: ["PENDING", "PAID", "SHIPPED", "DELIVERED"][i % 4] as any,
        deliveryAddressId: customerAddress!.id,
      },
    })

    // Add order items
    const orderProducts = products.slice(i * 2, i * 2 + 2)
    for (const product of orderProducts) {
      await prisma.orderItem.create({
        data: {
          orderId: order.id,
          productId: product.id,
          quantity: 1 + (i % 3),
          price: product.price,
        },
      })
    }
  }

  console.log("✅ Database seeded successfully!")
  console.log("\n📊 Summary:")
  console.log(`👑 Admin users: 1`)
  console.log(`👥 Customers: ${customers.length}`)
  console.log(`🏪 Vendors: ${vendors.length}`)
  console.log(`🛒 Products: ${products.length}`)
  console.log(`🍕 Food items: 15`)
  console.log(`🏠 Apartments: 12`)
  console.log(`🔧 Services: 10`)
  console.log(`🚗 Auto services: 8`)
  console.log(`🏍️ Riders: 6`)
  console.log(`📦 Orders: 5`)

  console.log("\n🔐 Test Credentials:")
  console.log("Admin: admin@marketplace.com / password123")
  console.log("Customer: customer1@example.com / password123")
  console.log("Vendor: vendor1@example.com / password123")
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
