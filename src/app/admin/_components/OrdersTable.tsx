"use client";

import { Search, Eye, Download } from "lucide-react";
import { useState, useEffect } from "react";
import { getAllOrders, getOrderDetailsById } from "../_actions/order";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Order {
  id: string;
  userId: string | null;
  userName: string | null;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  totalAmount: string;
  createdAt: Date;
}

interface OrderDetails {
  id: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  totalAmount: string;
  createdAt: Date;
  userName: string | null;
  userPhone: string | null;
  shippingAddress: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postalCode: string | null;
    phone: string | null;
  } | null;
  billingAddress: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    postalCode: string | null;
    phone: string | null;
  } | null;
  items: {
    id: string;
    productName: string;
    quantity: number;
    priceAtPurchase: string;
  }[];
}

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  // to not fetch orders again when dialog opens/closes
  const [ordersDetails, setOrderDetails] = useState<OrderDetails[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await getAllOrders();
        setOrders(data);
      } catch (error) {
        console.error("Failed to fetch orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleViewOrder = async (orderId: string) => {
    setLoadingDetails(true);
    setDialogOpen(true);
    // if we already have details for this order, use it instead of fetching again
    const existingDetails = ordersDetails.find((o) => o.id === orderId);
    if (existingDetails) {
      setSelectedOrder(existingDetails);
      setLoadingDetails(false);
      return;
    }
    try {
      const details = await getOrderDetailsById(orderId);
      if (details) {
        setOrderDetails((prev) => [...prev, details]);
        setSelectedOrder(details);
      } else {
        // console.error("Order details not found for ID:", orderId);
        // toast error
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
    } finally {
      setLoadingDetails(false);
    }
  };

  const getStatusColor = (status: Order["status"]) => {
    switch (status) {
      case "delivered":
        return "bg-green-100 text-green-800";
      case "shipped":
        return "bg-blue-100 text-blue-800";
      case "paid":
        return "bg-purple-100 text-purple-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "" || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <div className="flex items-center justify-center py-12">
          <p className="text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow border border-gray-200 p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search orders by customer or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-lg shadow border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No orders found
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{order.id.slice(0, 8)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {order.userName || "Guest"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                      >
                        {order.status.charAt(0).toUpperCase() +
                          order.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      ${Number(order.totalAmount).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewOrder(order.id)}
                        className="text-blue-600 hover:text-blue-800"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Showing {filteredOrders.length} of {orders.length} orders
        </p>
      </div>

      {/* Order Details Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="lg:min-w-4xl max-h-[85vh] overflow-y-auto p-5">
          <DialogHeader>
            <DialogTitle className="text-lg font-semibold">
              Order Details
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              {selectedOrder && `Order #${selectedOrder.id.slice(0, 8)}`}
            </DialogDescription>
          </DialogHeader>

          {loadingDetails ? (
            <div className="flex items-center justify-center py-10">
              <p className="text-sm text-gray-500">Loading order details...</p>
            </div>
          ) : selectedOrder ? (
            <div className="space-y-5">
              {/* Compact Summary */}
              <div className="bg-gray-50 p-3 rounded-md">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-xs">
                  <div>
                    <p className="text-gray-500">Customer</p>
                    <p className="font-medium text-gray-900 truncate">
                      {selectedOrder.userName || "Guest"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Phone</p>
                    <p className="font-medium text-gray-900">
                      {selectedOrder.userPhone || "N/A"}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Total</p>
                    <p className="font-semibold text-gray-900">
                      ${Number(selectedOrder.totalAmount).toFixed(2)}
                    </p>
                  </div>

                  <div>
                    <p className="text-gray-500">Status</p>
                    <span
                      className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${getStatusColor(
                        selectedOrder.status,
                      )}`}
                    >
                      {selectedOrder.status}
                    </span>
                  </div>

                  <div>
                    <p className="text-gray-500">Placed</p>
                    <p className="font-medium text-gray-900">
                      {new Date(selectedOrder.createdAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        },
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-2">
                  Order Items
                </h3>

                <div className="border rounded-md overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wide">
                          Product
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wide">
                          Qty
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wide">
                          Price
                        </th>
                        <th className="px-3 py-2 text-left font-medium text-gray-500 uppercase tracking-wide">
                          Subtotal
                        </th>
                      </tr>
                    </thead>

                    <tbody className="divide-y divide-gray-200">
                      {selectedOrder.items.map((item) => (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-gray-800">
                            {item.productName}
                          </td>

                          <td className="px-3 py-2 text-gray-800">
                            {item.quantity}
                          </td>

                          <td className="px-3 py-2 text-gray-800">
                            ${Number(item.priceAtPurchase).toFixed(2)}
                          </td>

                          <td className="px-3 py-2 font-semibold text-gray-900">
                            $
                            {(
                              Number(item.priceAtPurchase) * item.quantity
                            ).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Addresses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Shipping */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">
                    Shipping Address
                  </h3>

                  {selectedOrder.shippingAddress ? (
                    <div className="space-y-0.5 text-gray-700">
                      <p>{selectedOrder.shippingAddress.line1}</p>
                      {selectedOrder.shippingAddress.line2 && (
                        <p>{selectedOrder.shippingAddress.line2}</p>
                      )}
                      <p>
                        {selectedOrder.shippingAddress.city},{" "}
                        {selectedOrder.shippingAddress.state}
                      </p>
                      <p>
                        {selectedOrder.shippingAddress.country} -{" "}
                        {selectedOrder.shippingAddress.postalCode}
                      </p>
                      <p className="font-medium">
                        {selectedOrder.shippingAddress.phone}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No shipping address</p>
                  )}
                </div>

                {/* Billing */}
                <div className="bg-gray-50 p-3 rounded-md">
                  <h3 className="text-sm font-semibold text-gray-800 mb-2">
                    Billing Address
                  </h3>

                  {selectedOrder.billingAddress ? (
                    <div className="space-y-0.5 text-gray-700">
                      <p>{selectedOrder.billingAddress.line1}</p>
                      {selectedOrder.billingAddress.line2 && (
                        <p>{selectedOrder.billingAddress.line2}</p>
                      )}
                      <p>
                        {selectedOrder.billingAddress.city},{" "}
                        {selectedOrder.billingAddress.state}
                      </p>
                      <p>
                        {selectedOrder.billingAddress.country} -{" "}
                        {selectedOrder.billingAddress.postalCode}
                      </p>
                      <p className="font-medium">
                        {selectedOrder.billingAddress.phone}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">No billing address</p>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500 text-sm">
              Failed to load order details
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
