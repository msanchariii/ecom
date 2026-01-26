"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getUserOrders, type OrderWithItems } from "@/lib/actions/orders";
import { Package, ArrowLeft } from "lucide-react";

export default function OrdersPage() {
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const result = await getUserOrders();
        setOrders(result);
      } catch (err) {
        setError("Failed to load orders");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-body text-dark-600">Loading your orders...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-12">
          <p className="text-body text-red-600 mb-4">{error}</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 rounded-md bg-dark-900 px-6 py-3 text-body font-medium text-light-100 transition-colors hover:bg-dark-700"
          >
            <ArrowLeft className="h-5 w-5" />
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-12">
          <Package className="h-24 w-24 text-dark-300 mb-6" />
          <h2 className="text-heading-2 text-dark-900 mb-4">No orders yet</h2>
          <p className="text-body text-dark-600 mb-8">
            You haven't placed any orders yet. Start shopping to create your
            first order!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-md bg-dark-900 px-6 py-3 text-body font-medium text-light-100 transition-colors hover:bg-dark-700"
          >
            <Package className="h-5 w-5" />
            Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (
    status: "pending" | "paid" | "shipped" | "delivered" | "cancelled",
  ) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "paid":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-heading-1 text-dark-900 mb-2">My Orders</h1>
        <p className="text-body text-dark-600">
          {orders.length} {orders.length === 1 ? "order" : "orders"} found
        </p>
      </div>

      <div className="space-y-6">
        {orders.map((order) => (
          <div
            key={order.id}
            className="rounded-lg border border-light-300 bg-light-100 p-6"
          >
            <div className="mb-4 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h3 className="text-body-lg font-semibold text-dark-900">
                  Order #{order.id.slice(0, 8)}
                </h3>
                <p className="mt-1 text-caption text-dark-600">
                  {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <span
                  className={`rounded-full px-3 py-1 text-caption font-medium capitalize ${getStatusColor(order.status)}`}
                >
                  {order.status}
                </span>
                <p className="text-body-lg font-bold text-dark-900">
                  ${Number(order.totalAmount).toFixed(2)}
                </p>
              </div>
            </div>

            <div className="border-t border-light-300 pt-4">
              <p className="mb-3 text-body-medium font-medium text-dark-900">
                Items ({order.items.length})
              </p>
              <ul className="space-y-2">
                {order.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center justify-between text-body text-dark-700"
                  >
                    <div>
                      <p>{item.productName}</p>
                      <p className="text-caption text-dark-600">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold text-dark-900">
                      ${Number(item.priceAtPurchase).toFixed(2)}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/products"
        className="mt-8 inline-flex items-center gap-2 text-body text-dark-700 transition-colors hover:text-dark-900"
      >
        <ArrowLeft className="h-4 w-4" />
        Continue Shopping
      </Link>
    </main>
  );
}
