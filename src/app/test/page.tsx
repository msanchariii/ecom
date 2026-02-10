"use client";

import Payment from "@/components/Payment";
import Upload from "@/lib/upload/Upload";
import React from "react";
import { toast } from "sonner";

const TestPage = () => {
  const handlePaymentSuccess = async (paymentData: {
    orderId: string;
    paymentId: string;
  }) => {
    console.log("Payment successful!", paymentData);

    // Here you can:
    // 1. Update order status in database
    // 2. Send confirmation email
    // 3. Redirect to success page
    // etc.

    toast.success(`Payment ID: ${paymentData.paymentId}`);
  };

  const handlePaymentFailure = (error: Error) => {
    console.error("Payment failed:", error);

    // Handle payment failure
    // Maybe log to error tracking service
  };

  return (
    <div className="container mx-auto p-8 space-y-8">
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">Test Page</h1>
        <p className="text-muted-foreground">
          This page is for testing components
        </p>
      </div>

      {/* File Upload Test */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">File Upload</h2>
        <Upload />
      </div>

      {/* Payment Test */}
      <div className="border rounded-lg p-6 space-y-4">
        <h2 className="text-xl font-semibold">Payment Integration</h2>
        <p className="text-sm text-muted-foreground">
          Test Razorpay payment integration with modern best practices
        </p>

        <div className="max-w-md space-y-4">
          <div className="space-y-2">
            <p className="text-sm font-medium">Amount: ₹1.00</p>
            <p className="text-sm text-muted-foreground">
              Customer: John Doe (john@example.com)
            </p>
          </div>

          <Payment
            amountInRupees={1}
            customerData={{
              firstName: "John",
              lastName: "Doe",
              email: "john@example.com",
              phone: "9876543210",
            }} // !should be fetched from user profile in real app
            onPaymentSuccess={handlePaymentSuccess}
            onPaymentFailure={handlePaymentFailure}
            companyName="Test Company"
            description="Test Payment"
            themeColor="#6366f1"
            notes={{
              test: "true",
              environment: "development",
            }}
          >
            Pay ₹1 with Razorpay
          </Payment>
        </div>

        <div className="mt-4 p-4 bg-muted rounded-md">
          <p className="text-xs font-mono">
            💡 Tip: Use Razorpay test cards for testing
          </p>
          <ul className="text-xs font-mono mt-2 space-y-1">
            <li>Card: 4111 1111 1111 1111</li>
            <li>CVV: Any 3 digits</li>
            <li>Expiry: Any future date</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default TestPage;
