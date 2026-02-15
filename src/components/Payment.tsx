"use client";

import React, { useState, useCallback } from "react";
import Script from "next/script";
import axios from "axios";
import { toast } from "sonner";
import { Button } from "./ui/button";
import type {
  CustomerData,
  CreateOrderResponse,
  RazorpaySuccessResponse,
  VerifyPaymentResponse,
} from "@/lib/payment/types";

interface PaymentProps {
  amountInRupees: number;
  onPaymentSuccess: (paymentData: {
    orderId: string;
    paymentId: string;
  }) => void | Promise<void>;
  onPaymentFailure?: (error: Error) => void;
  customerData: CustomerData;
  currency?: string;
  companyName?: string;
  description?: string;
  themeColor?: string;
  children: React.ReactNode;
  disabled?: boolean;
  notes?: Record<string, string>;
}

const Payment: React.FC<PaymentProps> = ({
  amountInRupees,
  onPaymentSuccess,
  onPaymentFailure,
  customerData,
  currency = "INR",
  companyName = "Your Company",
  description = "Product Purchase",
  themeColor = "#3399cc",
  children,
  disabled = false,
  notes,
}) => {
  const [isProcessing, setProcessing] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  // Convert rupees to paise (smallest currency unit)
  const amountInPaise = amountInRupees * 100;
  const verifyPayment = useCallback(
    async (response: RazorpaySuccessResponse): Promise<boolean> => {
      try {
        const { data } = await axios.post<VerifyPaymentResponse>(
          "/api/payment/verify",
          {
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            customerData,
          },
        );

        if (!data.success) {
          throw new Error(data.message || "Payment verification failed");
        }

        return true;
      } catch (error) {
        console.error("Payment verification error:", error);
        if (axios.isAxiosError(error)) {
          throw new Error(
            error.response?.data?.message || "Payment verification failed",
          );
        }
        throw error;
      }
    },
    [customerData],
  );

  /**
   * Handle the complete payment flow
   */
  const handlePayment = useCallback(async () => {
    // Validation
    if (!scriptLoaded) {
      toast.error("Payment gateway is loading. Please try again.");
      return;
    }

    if (scriptError) {
      toast.error("Payment gateway failed to load. Please refresh the page.");
      return;
    }

    if (!customerData.email || !customerData.firstName) {
      toast.error("Customer information is required");
      return;
    }

    setProcessing(true);

    try {
      // Step 1: Create order on server
      toast.loading("Initializing payment...");

      const { data: orderData } = await axios.post<CreateOrderResponse>(
        "/api/payment/create-order",
        {
          amount: amountInPaise,
          currency,
          customerData,
          notes,
        },
      );

      toast.dismiss();

      if (orderData.error) {
        throw new Error(orderData.error || "Failed to create order");
      }

      // Step 2: Open Razorpay checkout
      const razorpayKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;

      if (!razorpayKey) {
        throw new Error("Payment gateway not configured");
      }

      const options = {
        key: razorpayKey,
        amount: amountInPaise,
        currency: orderData.currency,
        name: companyName,
        description: description,
        order_id: orderData.orderId,
        handler: async function (response: RazorpaySuccessResponse) {
          try {
            // Step 3: Verify payment signature on server
            toast.loading("Verifying payment...");

            await verifyPayment(response);

            toast.dismiss();
            toast.success("Payment successful!");

            // Step 4: Call success callback
            await onPaymentSuccess({
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
            });
          } catch (error) {
            toast.dismiss();
            toast.error("Payment verification failed");

            const err =
              error instanceof Error
                ? error
                : new Error("Payment verification failed");
            onPaymentFailure?.(err);

            console.error("Payment handler error:", error);
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: `${customerData.firstName} ${customerData.lastName}`,
          email: customerData.email,
          contact: customerData.phone || "",
        },
        theme: {
          color: themeColor,
        },
        modal: {
          ondismiss: () => {
            toast.info("Payment cancelled");
            setProcessing(false);
          },
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", function () {
        toast.error("Payment failed. Please try again.");
        setProcessing(false);
      });

      razorpayInstance.open();
    } catch (error) {
      console.error("Payment error:", error);

      let errorMessage = "Payment failed";
      if (axios.isAxiosError(error)) {
        errorMessage = error.response?.data?.error || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast.error(errorMessage);

      const err = error instanceof Error ? error : new Error("Payment failed");
      onPaymentFailure?.(err);

      setProcessing(false);
    }
  }, [
    amountInPaise,
    currency,
    customerData,
    companyName,
    description,
    themeColor,
    scriptLoaded,
    scriptError,
    verifyPayment,
    onPaymentSuccess,
    onPaymentFailure,
    notes,
  ]);

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        onLoad={() => {
          setScriptLoaded(true);
          console.log("Razorpay SDK loaded successfully");
        }}
        onError={() => {
          setScriptError(true);
          console.error("Failed to load Razorpay SDK");
          toast.error("Payment gateway failed to load");
        }}
        strategy="lazyOnload"
      />
      <Button
        onClick={handlePayment}
        disabled={disabled || isProcessing || scriptError || !scriptLoaded}
        className="w-full"
      >
        {isProcessing ? "Processing..." : children}
      </Button>
    </>
  );
};

export default Payment;
