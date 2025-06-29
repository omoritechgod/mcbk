"use client"

import dynamic from "next/dynamic"
import { useEffect, useState } from "react"

const SwaggerUI = dynamic(() => import("swagger-ui-react"), { ssr: false })

export default function ApiDocsPage() {
  const [spec, setSpec] = useState(null)

  useEffect(() => {
    fetch("/api/docs")
      .then((res) => res.json())
      .then((data) => setSpec(data))
      .catch((err) => console.error("Failed to load API spec:", err))
  }, [])

  if (!spec) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading API Documentation...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-blue-600 text-white p-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold">🏪 Marketplace API Documentation</h1>
          <p className="text-blue-100">Interactive API documentation with live testing</p>
        </div>
      </div>
      <div className="max-w-6xl mx-auto">
        <SwaggerUI spec={spec} />
      </div>
    </div>
  )
}
