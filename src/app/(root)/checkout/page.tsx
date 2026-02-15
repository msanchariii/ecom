"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cart";
import { getUserAddresses } from "@/lib/actions/addresses";
import { createOrder } from "@/lib/actions/orders";
import type { SelectAddress } from "@/lib/db/schema";
import Payment from "@/components/Payment";
import { MapPin, ShoppingBag, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { getCurrentUser } from "@/lib/auth/actions";

export default function CheckoutPage() {
  const router = useRouter();
  const { items, total, clearCart } = useCartStore();
  const [addresses, setAddresses] = useState<SelectAddress[]>([]);
  const [shippingAddressId, setShippingAddressId] = useState<string>("");
  const [billingAddressId, setBillingAddressId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const userData = await getCurrentUser();
        setUser(userData);

        if (!userData) {
          toast.error("Please login to continue");
          router.push("/sign-in");
          return;
        }

        const userAddresses = await getUserAddresses();
        setAddresses(userAddresses);

        // Set default addresses if available
        const defaultAddress = userAddresses.find((addr) => addr.isDefault);
        if (defaultAddress) {
          setShippingAddressId(defaultAddress.id);
          setBillingAddressId(defaultAddress.id);
        }
      } catch (error) {
        console.error("Failed to load checkout data:", error);
        toast.error("Failed to load checkout data");
      } finally {
        setLoading(false);
      }
    };

    init();
  }, [router]);

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center justify-center py-12">
          <ShoppingBag className="h-24 w-24 text-dark-300 mb-6" />
          <h2 className="text-heading-2 text-dark-900 mb-4">
            Your cart is empty
          </h2>
          <p className="text-body text-dark-600 mb-8">
            Add some products to checkout!
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

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-body text-dark-600">Loading checkout...</p>
        </div>
      </div>
    );
  }

  const shippingCost = total > 100 ? 0 : 10;
  const tax = total * 0.08; // 8% tax
  const finalTotal = total + shippingCost + tax;

  const handlePaymentSuccess = async (paymentData: {
    orderId: string;
    paymentId: string;
  }) => {
    console.log("Payment successful:", paymentData);

    try {
      // Create order in database
      const result = await createOrder({
        items: items.map((item) => ({
          variantId: item.id, // item.id is the variantId
          quantity: item.quantity,
          price: item.price,
        })),
        shippingAddressId,
        billingAddressId,
        totalAmount: finalTotal,
        paymentId: paymentData.paymentId,
        razorpayOrderId: paymentData.orderId,
      });

      if (!result.success) {
        throw new Error(result.error || "Failed to create order");
      }

      console.log("Order created successfully:", result.orderId);
      toast.success("Order placed successfully!");
      clearCart();
      router.push("/me/orders");
    } catch (error) {
      console.error("Failed to create order:", error);
      toast.error(
        "Payment successful but failed to create order. Please contact support.",
      );
    }
  };

  const handlePaymentFailure = (error: Error) => {
    console.error("Payment failed:", error);
    toast.error("Payment failed. Please try again.");
  };

  const canProceed = shippingAddressId && billingAddressId;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <Link
          href="/cart"
          className="inline-flex items-center gap-2 text-body text-dark-700 transition-colors hover:text-dark-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Cart
        </Link>
        <h1 className="text-heading-1 text-dark-900">Checkout</h1>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Order Items */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-heading-3 text-dark-900 mb-4">Order Items</h2>
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 rounded-lg border border-light-300 bg-light-100 p-4"
                >
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-md bg-light-200">
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
                  <div className="flex flex-1 justify-between">
                    <div>
                      <h3 className="text-body font-medium text-dark-900">
                        {item.name}
                      </h3>
                      {(item.color || item.size) && (
                        <p className="mt-1 text-caption text-dark-600">
                          {[item.color, item.size].filter(Boolean).join(" · ")}
                        </p>
                      )}
                      <p className="mt-1 text-caption text-dark-600">
                        Qty: {item.quantity}
                      </p>
                    </div>
                    <p className="text-body font-semibold text-dark-900">
                      ${(item.price * item.quantity).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Order Summary & Payment */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-6">
            {/* Address Selection */}
            <div className="rounded-lg border border-light-300 bg-light-100 p-6">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-heading-3 text-dark-900">
                  Delivery Addresses
                </h2>
                <Link
                  href="/me/addresses"
                  className="inline-flex items-center gap-1 text-caption text-dark-700 transition-colors hover:text-dark-900"
                >
                  <MapPin className="h-3 w-3" />
                  Add Address
                </Link>
              </div>

              {addresses.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-body text-dark-600 mb-4">
                    No addresses found
                  </p>
                  <Link
                    href="/me/addresses"
                    className="inline-flex items-center gap-2 rounded-md bg-dark-900 px-4 py-2 text-body font-medium text-light-100 transition-colors hover:bg-dark-700"
                  >
                    <MapPin className="h-4 w-4" />
                    Add Address
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Shipping Address */}
                  <div>
                    <label className="mb-2 block text-body-medium font-medium text-dark-900">
                      Shipping Address
                    </label>
                    <select
                      value={shippingAddressId}
                      onChange={(e) => setShippingAddressId(e.target.value)}
                      className="w-full rounded-md border border-light-300 px-3 py-2 text-body text-dark-900 focus:border-dark-900 focus:outline-none"
                    >
                      <option value="">Select address</option>
                      {addresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.line1}, {address.city} - {address.postalCode}
                          {address.isDefault ? " (Default)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Billing Address */}
                  <div>
                    <label className="mb-2 block text-body-medium font-medium text-dark-900">
                      Billing Address
                    </label>
                    <select
                      value={billingAddressId}
                      onChange={(e) => setBillingAddressId(e.target.value)}
                      className="w-full rounded-md border border-light-300 px-3 py-2 text-body text-dark-900 focus:border-dark-900 focus:outline-none"
                    >
                      <option value="">Select address</option>
                      {addresses.map((address) => (
                        <option key={address.id} value={address.id}>
                          {address.line1}, {address.city} - {address.postalCode}
                          {address.isDefault ? " (Default)" : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => {
                      const shipping = addresses.find(
                        (a) => a.id === shippingAddressId,
                      );
                      if (shipping) {
                        setBillingAddressId(shippingAddressId);
                        toast.success("Same as shipping address");
                      }
                    }}
                    className="text-caption text-dark-700 hover:text-dark-900"
                  >
                    Use shipping address for billing
                  </button>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="rounded-lg border border-light-300 bg-light-100 p-6">
              <h2 className="text-heading-3 text-dark-900 mb-4">
                Order Summary
              </h2>

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

              <div className="mt-6">
                {!canProceed ? (
                  <div className="text-center">
                    <p className="text-caption text-dark-600 mb-3">
                      Please select shipping and billing addresses to proceed
                    </p>
                    <button
                      disabled
                      className="w-full rounded-md bg-dark-300 px-6 py-3 text-body font-medium text-light-100 cursor-not-allowed"
                    >
                      Select Addresses to Continue
                    </button>
                  </div>
                ) : (
                  <Payment
                    amountInRupees={finalTotal}
                    customerData={{
                      firstName: user?.name?.split(" ")[0] || "Customer",
                      lastName: user?.name?.split(" ").slice(1).join(" ") || "",
                      email: user?.email || "",
                      phone: user?.phone || "",
                    }}
                    onPaymentSuccess={handlePaymentSuccess}
                    onPaymentFailure={handlePaymentFailure}
                    companyName="E-Commerce Store"
                    description="Product Purchase"
                    notes={{
                      shippingAddressId,
                      billingAddressId,
                      items: JSON.stringify(
                        items.map((i) => ({ id: i.id, qty: i.quantity })),
                      ),
                    }}
                  >
                    Pay ${finalTotal.toFixed(2)}
                  </Payment>
                )}
              </div>

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
                  Secure Razorpay checkout
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
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
