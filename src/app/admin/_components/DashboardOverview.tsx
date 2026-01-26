import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  Eye,
} from "lucide-react";
import StatsCard from "./StatsCard";

export default function DashboardOverview() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900">Dashboard Overview</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Total Revenue"
          value="$45,231"
          icon={DollarSign}
          trend={{ value: 12.5, isPositive: true }}
          description="Last 30 days"
        />
        <StatsCard
          title="Total Orders"
          value="356"
          icon={ShoppingCart}
          trend={{ value: 8.2, isPositive: true }}
          description="Last 30 days"
        />
        <StatsCard
          title="Products"
          value="142"
          icon={Package}
          description="Active products"
        />
        <StatsCard
          title="Customers"
          value="2,543"
          icon={Users}
          trend={{ value: 15.3, isPositive: true }}
          description="Total registered"
        />
        <StatsCard
          title="Conversion Rate"
          value="3.2%"
          icon={TrendingUp}
          trend={{ value: 0.5, isPositive: true }}
        />
        <StatsCard
          title="Page Views"
          value="12,453"
          icon={Eye}
          trend={{ value: -2.4, isPositive: false }}
          description="Last 30 days"
        />
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Orders</h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table>
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Status</th>
                  <th>Amount</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b hover:bg-gray-50">
                  <td className="py-4 font-medium">#ORD-001</td>
                  <td className="py-4">John Doe</td>
                  <td className="py-4">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                      Delivered
                    </span>
                  </td>
                  <td>$156.00</td>
                  <td>Jan 24, 2026</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td>#ORD-002</td>
                  <td>Jane Smith</td>
                  <td>
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                      Shipped
                    </span>
                  </td>
                  <td>$243.50</td>
                  <td>Jan 25, 2026</td>
                </tr>
                <tr className="hover:bg-gray-50">
                  <td>#ORD-003</td>
                  <td>Bob Johnson</td>
                  <td>
                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                      Pending
                    </span>
                  </td>
                  <td>$89.99</td>
                  <td>Jan 26, 2026</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
