# 🏪 McDee Multifunctional Marketplace API

A comprehensive REST API backend for a multifunctional marketplace platform supporting:

- 🛒 **E-commerce** (Products, Orders, Reviews)
- 🍕 **Food Delivery** (Restaurants, Menus, Orders)
- 🚗 **Ride Hailing** (Riders, Bookings, GPS Tracking)
- 🏠 **Service Apartments** (Listings, Bookings)
- 🔧 **Auto Services** (Repairs, Diagnostics)
- 💰 **Wallet System** (Payments, P2P Transfers)
- 👑 **Admin Panel** (User Management, Vendor Verification)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- MySQL 8.0+
- XAMPP/WAMP (for local MySQL)

### Installation

1. **Clone & Install**
\`\`\`bash
git clone <your-repo>
cd marketplace-api
npm install
\`\`\`

2. **Database Setup**
\`\`\`bash
# Start XAMPP/WAMP MySQL service
# Create database 'marketplace_db' in phpMyAdmin

# Copy environment file
cp .env.example .env

# Edit .env with your database credentials
DATABASE_URL="mysql://root:@localhost:3306/marketplace_db"
JWT_SECRET="your-super-secret-jwt-key-here"
\`\`\`

3. **Database Migration & Seeding**
\`\`\`bash
# Generate Prisma client
npm run db:generate

# Push schema to database
npm run db:push

# Seed with sample data
npm run db:seed
\`\`\`

4. **Start Development Server**
\`\`\`bash
npm run dev
\`\`\`

🎉 **API is now running at:** `http://localhost:3000`

## 📚 API Documentation

- **📖 Full Swagger Docs:** [http://localhost:3000/api-docs](http://localhost:3000/api-docs)
- **🔗 Quick Endpoints:** [http://localhost:3000/api/docs/endpoints](http://localhost:3000/api/docs/endpoints)
- **🏠 API Home:** [http://localhost:3000](http://localhost:3000)

## 🔧 Available Scripts

\`\`\`bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio (database GUI)
npm run db:reset     # Reset database and reseed
\`\`\`

## 🏗️ Project Structure

\`\`\`
marketplace-api/
├── app/
│   ├── api/                 # API routes
│   │   ├── auth/           # Authentication endpoints
│   │   ├── users/          # User management
│   │   ├── vendors/        # Vendor management
│   │   ├── products/       # E-commerce products
│   │   ├── orders/         # Order management
│   │   ├── food/           # Food delivery
│   │   ├── rides/          # Ride hailing
│   │   ├── apartments/     # Service apartments
│   │   ├── services/       # General services
│   │   ├── auto/           # Auto services
│   │   ├── wallet/         # Wallet & payments
│   │   ├── admin/          # Admin endpoints
│   │   └── docs/           # API documentation
│   ├── api-docs/           # Swagger UI page
│   └── page.tsx            # API home page
├── lib/
│   ├── db.ts               # Prisma client
│   ├── swagger.ts          # Swagger configuration
│   └── utils/
│       └── api.ts          # API utilities
├── prisma/
│   └── schema.prisma       # Database schema
├── scripts/
│   └── seed-database.ts    # Database seeding
└── types/
    └── api.ts              # TypeScript types
\`\`\`

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication.

### Login Example
\`\`\`bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
\`\`\`

### Using Token
\`\`\`bash
curl -X GET http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
\`\`\`

## 🛒 Key API Endpoints

### Authentication
- `POST /api/auth/register` - Register user/vendor
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### E-commerce
- `GET /api/products` - List products
- `POST /api/products` - Create product (vendor)
- `POST /api/orders` - Create order with escrow
- `POST /api/orders/{id}/complete` - Complete order

### Food Delivery
- `GET /api/food/menus` - List food menus
- `POST /api/food/orders` - Create food order
- `PUT /api/food/orders/{id}/status` - Update order status

### Ride Hailing
- `GET /api/rides/riders` - List available riders
- `POST /api/rides/book` - Book a ride
- `POST /api/rides/gps` - Update GPS location

### Wallet System
- `GET /api/wallet/balance` - Get wallet balance
- `POST /api/wallet/fund` - Fund wallet
- `POST /api/wallet/transfer` - P2P transfer

## 🗄️ Database Management

### Using phpMyAdmin
1. Open `http://localhost/phpmyadmin`
2. Select `marketplace_db` database
3. View/edit tables and data

### Using Prisma Studio
\`\`\`bash
npm run db:studio
# Opens at http://localhost:5555
\`\`\`

## 🔧 Configuration

### Environment Variables (.env)
\`\`\`env
DATABASE_URL="mysql://root:@localhost:3306/marketplace_db"
JWT_SECRET="your-super-secret-jwt-key-here"
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"
\`\`\`

### Database Schema
The database includes tables for:
- Users & Authentication
- Vendors & Verification
- Products & Categories
- Orders & Payments
- Food Menus & Orders
- Rides & GPS Tracking
- Apartments & Bookings
- Services & Auto Repairs
- Wallet & Transactions

## 🧪 Testing the API

### Using Browser
Visit endpoints directly:
- `http://localhost:3000/api/products`
- `http://localhost:3000/api/food/menus`

### Using Postman
1. Import the API collection from Swagger docs
2. Set base URL: `http://localhost:3000/api`
3. Add Authorization header for protected routes

### Using curl
\`\`\`bash
# Get products
curl http://localhost:3000/api/products

# Create user
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "phone": "+2348123456789",
    "password": "password123",
    "userType": "customer"
  }'
\`\`\`

## 🚀 Connecting Your React Frontend

### API Service Example
\`\`\`javascript
// frontend/src/services/api.js
const API_BASE = 'http://localhost:3000/api';

class ApiService {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('token');
    
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      ...options,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, config);
    return response.json();
  }

  // Auth methods
  login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  // Product methods
  getProducts(params = {}) {
    const query = new URLSearchParams(params).toString();
    return this.request(`/products?${query}`);
  }
}

export default new ApiService();
\`\`\`

## 🛠️ Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Ensure MySQL is running in XAMPP
   - Check DATABASE_URL in .env file
   - Verify database exists in phpMyAdmin

2. **Prisma Client Error**
   \`\`\`bash
   npm run db:generate
   \`\`\`

3. **Port Already in Use**
   \`\`\`bash
   # Kill process on port 3000
   npx kill-port 3000
   \`\`\`

4. **JWT Secret Error**
   - Set JWT_SECRET in .env file
   - Use a strong, random secret key

## 📝 License

MIT License - feel free to use this project for your applications!

## 🤝 Support

For issues and questions:
1. Check the API documentation at `/api-docs`
2. Review this README
3. Check database schema in `prisma/schema.prisma`
4. Open an issue in the repository

---

**Happy coding! 🚀**
