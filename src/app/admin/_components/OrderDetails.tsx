"use client";

import { X, Package, MapPin, CreditCard } from "lucide-react";

interface OrderDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
}

export default function OrderDetails({
  isOpen,
  onClose,
  orderId,
}: OrderDetailsProps) {
  if (!isOpen) return null;

  // Mock data - replace with actual data fetching
  const order = {
    id: orderId,
    orderId: "#ORD-001",
    customer: {
      name: "John Doe",
      email: "john.doe@example.com",
      phone: "+1 234 567 8900",
    },
    status: "delivered",
    date: "2026-01-24",
    items: [
      {
        id: "1",
        name: "Nike Air Max 270",
        variant: "Black / Size 10",
        quantity: 1,
        price: 150.0,
      },
      {
        id: "2",
        name: "Athletic Socks Pack",
        variant: "White / 3-Pack",
        quantity: 2,
        price: 3.0,
      },
    ],
    shipping: {
      address: "123 Main St",
      city: "New York",
      state: "NY",
      zip: "10001",
      country: "USA",
    },
    payment: {
      method: "Credit Card",
      last4: "4242",
      total: 156.0,
      subtotal: 156.0,
      shipping: 0,
      tax: 0,
    },
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-900">Order Details</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Order Info */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Order ID</p>
              <p className="font-semibold">{order.orderId}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Date</p>
              <p className="font-semibold">
                {new Date(order.date).toLocaleDateString()}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">
                {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
              </span>
            </div>
          </div>

          {/* Customer Info */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4">Customer Information</h3>
            <div className="space-y-2">
              <p>
                <span className="text-gray-600">Name:</span>{" "}
                {order.customer.name}
              </p>
              <p>
                <span className="text-gray-600">Email:</span>{" "}
                {order.customer.email}
              </p>
              <p>
                <span className="text-gray-600">Phone:</span>{" "}
                {order.customer.phone}
              </p>
            </div>
          </div>

          {/* Order Items */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <Package className="w-5 h-5" />
              Order Items
            </h3>
            <div className="space-y-3">
              {order.items.map((item) => (
                <div
                  key={item.id}
                  className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-gray-600">{item.variant}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${item.price.toFixed(2)}</p>
                    <p className="text-sm text-gray-600">
                      Qty: {item.quantity}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Shipping Address */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Shipping Address
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>{order.shipping.address}</p>
              <p>
                {order.shipping.city}, {order.shipping.state}{" "}
                {order.shipping.zip}
              </p>
              <p>{order.shipping.country}</p>
            </div>
          </div>

          {/* Payment Info */}
          <div className="border-t pt-6">
            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Payment Information
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Payment Method:</span>
                <span>
                  {order.payment.method} ending in {order.payment.last4}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Subtotal:</span>
                <span>${order.payment.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Shipping:</span>
                <span>${order.payment.shipping.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Tax:</span>
                <span>${order.payment.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg border-t pt-2">
                <span>Total:</span>
                <span>${order.payment.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="border-t pt-6 flex gap-4">
            <button className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors">
              Update Status
            </button>
            <button className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg transition-colors">
              Print Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
