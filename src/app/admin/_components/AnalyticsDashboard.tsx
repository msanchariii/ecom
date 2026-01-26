"use client";

import { BarChart3, TrendingUp, TrendingDown } from "lucide-react";

export default function AnalyticsDashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>

      {/* Revenue Chart */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Revenue Overview
          </h2>
          <select className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option>Last 7 days</option>
            <option>Last 30 days</option>
            <option>Last 90 days</option>
            <option>Last 12 months</option>
          </select>
        </div>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center text-gray-500">
            <BarChart3 className="w-12 h-12 mx-auto mb-2" />
            <p>Chart placeholder - Integrate with charting library</p>
          </div>
        </div>
      </div>

      {/* Sales Performance */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Sales</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">$45,231</p>
          <p className="text-sm text-green-600 mt-2">+12.5% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Conversion Rate</h3>
            <TrendingUp className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">3.2%</p>
          <p className="text-sm text-green-600 mt-2">+0.5% from last month</p>
        </div>

        <div className="bg-white rounded-lg shadow border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-gray-900">Avg Order Value</h3>
            <TrendingDown className="w-5 h-5 text-red-600" />
          </div>
          <p className="text-3xl font-bold text-gray-900">$127.23</p>
          <p className="text-sm text-red-600 mt-2">-3.1% from last month</p>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            Top Selling Products
          </h2>
        </div>
        <div className="p-6">
          <div className="space-y-4">
            {[
              { name: "Nike Air Max 270", sales: 245, revenue: "$36,750" },
              { name: "Adidas Ultraboost", sales: 198, revenue: "$35,640" },
              { name: "Puma RS-X", sales: 167, revenue: "$18,370" },
            ].map((product, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">
                    {product.sales} units sold
                  </p>
                </div>
                <p className="font-semibold text-blue-600">{product.revenue}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
