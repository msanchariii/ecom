"use client";

import Image from "next/image";
import Link from "next/link";
import { useCartStore } from "@/store/cart";
import { Minus, Plus, Trash2, ShoppingBag, ArrowLeft } from "lucide-react";

export default function CartPage() {
  const { items, total, updateQuantity, removeItem, getItemCount } =
    useCartStore();
  const itemCount = getItemCount();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-12">
          <ShoppingBag className="h-24 w-24 text-dark-300 mb-6" />
          <h2 className="text-heading-2 text-dark-900 mb-4">
            Your cart is empty
          </h2>
          <p className="text-body text-dark-600 mb-8">
            Add some products to get started!
          </p>
          <Link
            href="/products"
            className="inline-flex items-center gap-2 rounded-md bg-dark-900 px-6 py-3 text-body font-medium text-light-100 transition-colors hover:bg-dark-700"
          >
            <ArrowLeft className="h-5 w-5" />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  const shippingCost = total > 100 ? 0 : 10;
  const tax = total * 0.08; // 8% tax
  const finalTotal = total + shippingCost + tax;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-heading-1 text-dark-900 mb-2">Shopping Cart</h1>
        <p className="text-body text-dark-600">
          {itemCount} {itemCount === 1 ? "item" : "items"} in your cart
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Cart Items */}
        <div className="lg:col-span-2">
          <div className="space-y-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 rounded-lg border border-light-300 bg-light-100 p-4 transition-shadow hover:shadow-md"
              >
                {/* Product Image */}
                <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-light-200">
                  {item.image ? (
                    <Image
                      src={item.image}
                      alt={item.name}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ShoppingBag className="h-8 w-8 text-dark-300" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <h3 className="text-body-lg font-medium text-dark-900">
                      {item.name}
                    </h3>
                    {(item.color || item.size) && (
                      <p className="mt-1 text-body text-dark-600">
                        {[item.color, item.size].filter(Boolean).join(" · ")}
                      </p>
                    )}
                    <p className="mt-1 text-body font-semibold text-dark-900">
                      ${item.price.toFixed(2)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 rounded-md border border-light-300 bg-light-100">
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity - 1)
                        }
                        className="p-2 transition-colors hover:bg-light-200"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-4 w-4 text-dark-700" />
                      </button>
                      <span className="min-w-8 text-center text-body font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.id, item.quantity + 1)
                        }
                        className="p-2 transition-colors hover:bg-light-200"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-4 w-4 text-dark-700" />
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-2 text-dark-600 transition-colors hover:text-red-600"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>

                {/* Item Total */}
                <div className="flex flex-col items-end justify-between">
                  <p className="text-body-lg font-semibold text-dark-900">
                    ${(item.price * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/products"
            className="mt-6 inline-flex items-center gap-2 text-body text-dark-700 transition-colors hover:text-dark-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Link>
        </div>

        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 rounded-lg border border-light-300 bg-light-100 p-6">
            <h2 className="text-heading-3 text-dark-900 mb-4">Order Summary</h2>

            <div className="space-y-3 border-b border-light-300 pb-4">
              <div className="flex justify-between text-body">
                <span className="text-dark-600">Subtotal</span>
                <span className="font-medium text-dark-900">
                  ${total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-body">
                <span className="text-dark-600">Shipping</span>
                <span className="font-medium text-dark-900">
                  {shippingCost === 0 ? (
                    <span className="text-green-600">FREE</span>
                  ) : (
                    `$${shippingCost.toFixed(2)}`
                  )}
                </span>
              </div>
              {total <= 100 && (
                <p className="text-caption text-dark-500">
                  Add ${(100 - total).toFixed(2)} more for free shipping!
                </p>
              )}
              <div className="flex justify-between text-body">
                <span className="text-dark-600">Tax (8%)</span>
                <span className="font-medium text-dark-900">
                  ${tax.toFixed(2)}
                </span>
              </div>
            </div>

            <div className="mt-4 flex justify-between border-b border-light-300 pb-4">
              <span className="text-body-lg font-semibold text-dark-900">
                Total
              </span>
              <span className="text-body-lg font-bold text-dark-900">
                ${finalTotal.toFixed(2)}
              </span>
            </div>

            <button className="mt-6 w-full rounded-md bg-dark-900 px-6 py-3 text-body font-medium text-light-100 transition-colors hover:bg-dark-700">
              Proceed to Checkout
            </button>

            <div className="mt-4 space-y-2 text-caption text-dark-500">
              <p className="flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Secure checkout
              </p>
              <p className="flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                30-day return policy
              </p>
              <p className="flex items-center gap-2">
                <svg
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Free returns
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
