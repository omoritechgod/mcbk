import swaggerJSDoc from "swagger-jsdoc"

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Multifunctional Marketplace API",
      version: "1.0.0",
      description:
        "A comprehensive marketplace API supporting e-commerce, food delivery, ride-hailing, apartments, and auto services",
      contact: {
        name: "API Support",
        email: "support@marketplace.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000/api",
        description: "Development server",
      },
      {
        url: "https://your-domain.com/api",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
      schemas: {
        ApiResponse: {
          type: "object",
          properties: {
            success: {
              type: "boolean",
              example: true,
            },
            data: {
              type: "object",
            },
            message: {
              type: "string",
              example: "Operation successful",
            },
            error: {
              type: "string",
            },
            errors: {
              type: "object",
            },
          },
        },
        User: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            name: {
              type: "string",
              example: "John Doe",
            },
            email: {
              type: "string",
              format: "email",
              example: "john@example.com",
            },
            phone: {
              type: "string",
              example: "+2348123456789",
            },
            userType: {
              type: "string",
              enum: ["CUSTOMER", "VENDOR"],
              example: "CUSTOMER",
            },
            status: {
              type: "string",
              enum: ["ACTIVE", "INACTIVE", "BANNED"],
              example: "ACTIVE",
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Product: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            name: {
              type: "string",
              example: "iPhone 15 Pro",
            },
            description: {
              type: "string",
              example: "Latest iPhone with advanced features",
            },
            price: {
              type: "number",
              format: "float",
              example: 999.99,
            },
            stock: {
              type: "integer",
              example: 50,
            },
            imageUrl: {
              type: "string",
              example: "https://example.com/image.jpg",
            },
            categoryId: {
              type: "integer",
              example: 1,
            },
            vendorId: {
              type: "integer",
              example: 1,
            },
          },
        },
        Order: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            userId: {
              type: "integer",
              example: 1,
            },
            total: {
              type: "number",
              format: "float",
              example: 1299.98,
            },
            status: {
              type: "string",
              enum: ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"],
              example: "PENDING",
            },
            deliveryAddressId: {
              type: "integer",
              example: 1,
            },
            createdAt: {
              type: "string",
              format: "date-time",
            },
          },
        },
        Vendor: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            userId: {
              type: "integer",
              example: 1,
            },
            vendorType: {
              type: "string",
              enum: ["PRODUCT", "FOOD", "RIDE", "APARTMENT", "SERVICE"],
              example: "PRODUCT",
            },
            businessName: {
              type: "string",
              example: "Tech Store Inc",
            },
            businessDescription: {
              type: "string",
              example: "Premium electronics and gadgets",
            },
            rating: {
              type: "number",
              format: "float",
              example: 4.5,
            },
            isVerified: {
              type: "boolean",
              example: true,
            },
          },
        },
        Wallet: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              example: 1,
            },
            userId: {
              type: "integer",
              example: 1,
            },
            balance: {
              type: "number",
              format: "float",
              example: 1500.5,
            },
            currency: {
              type: "string",
              example: "NGN",
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./app/api/**/*.ts"], // Path to the API files
}

export const swaggerSpec = swaggerJSDoc(options)
