export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-4xl mx-auto text-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <div className="mb-8">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-4">🏪 Marketplace API</h1>
            <p className="text-xl text-gray-600 mb-8">Multifunctional Marketplace Backend API</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">📚 API Documentation</h3>
              <p className="text-blue-700 mb-4">Interactive Swagger documentation with all endpoints</p>
              <a
                href="/api-docs"
                className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Docs
              </a>
            </div>

            <div className="bg-green-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">🔗 Quick Endpoints</h3>
              <p className="text-green-700 mb-4">List of all available API endpoints</p>
              <a
                href="/api/docs/endpoints"
                className="inline-block bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                View Endpoints
              </a>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">🚀 Available Modules</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-3 rounded border">
                <span className="font-medium">🛒 E-commerce</span>
                <p className="text-gray-600">Products, Orders, Reviews</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <span className="font-medium">🍕 Food Delivery</span>
                <p className="text-gray-600">Restaurants, Menus, Orders</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <span className="font-medium">🚗 Ride Hailing</span>
                <p className="text-gray-600">Riders, Bookings, GPS</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <span className="font-medium">🏠 Apartments</span>
                <p className="text-gray-600">Listings, Bookings</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <span className="font-medium">🔧 Auto Services</span>
                <p className="text-gray-600">Repairs, Diagnostics</p>
              </div>
              <div className="bg-white p-3 rounded border">
                <span className="font-medium">💰 Wallet</span>
                <p className="text-gray-600">Payments, Transfers</p>
              </div>
            </div>
          </div>

          <div className="mt-8 text-sm text-gray-500">
            <p>
              API Base URL: <code className="bg-gray-100 px-2 py-1 rounded">http://localhost:3000/api</code>
            </p>
            <p className="mt-2">Built with Next.js, Prisma, MySQL & TypeScript</p>
          </div>
        </div>
      </div>
    </div>
  )
}
