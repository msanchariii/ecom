import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import type {
  VerifyPaymentRequest,
  VerifyPaymentResponse,
} from "@/lib/payment/types";

/**
 * API Route: Verify Razorpay Payment
 * POST /api/payment/verify
 *
 * Verifies the payment signature to ensure the payment is legitimate.
 * This is a critical security step and must be done server-side.
 *
 * Razorpay sends three pieces of information:
 * - razorpay_order_id
 * - razorpay_payment_id
 * - razorpay_signature
 *
 * We need to verify the signature using our key_secret.
 */
export async function POST(request: NextRequest) {
  try {
    const body: VerifyPaymentRequest = await request.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      customerData,
    } = body;

    // Validate environment variables
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      console.error("Razorpay key secret not configured");
      return NextResponse.json(
        { success: false, message: "Payment gateway not configured" },
        { status: 500 },
      );
    }

    // Validate request
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { success: false, message: "Missing payment verification data" },
        { status: 400 },
      );
    }

    // Generate signature to verify
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Verify signature
    const isValid = generatedSignature === razorpay_signature;

    if (!isValid) {
      console.error("Payment signature verification failed");
      return NextResponse.json(
        {
          success: false,
          message: "Payment verification failed. Invalid signature.",
        },
        { status: 400 },
      );
    }

    // Payment is verified successfully
    // Here you can:
    // 1. Update order status in your database
    // 2. Send confirmation email
    // 3. Update inventory
    // 4. Create invoice
    // etc.

    console.log("Payment verified successfully:", {
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      customerEmail: customerData?.email,
    });

    // TODO: Add your business logic here
    // Example:
    // await db.orders.update({
    //   where: { razorpayOrderId: razorpay_order_id },
    //   data: {
    //     status: 'PAID',
    //     razorpayPaymentId: razorpay_payment_id,
    //     paidAt: new Date(),
    //   },
    // });

    const response: VerifyPaymentResponse = {
      success: true,
      message: "Payment verified successfully",
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error verifying payment:", error);

    if (error instanceof Error) {
      return NextResponse.json(
        {
          success: false,
          message: "Payment verification failed",
          error: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Payment verification failed",
      },
      { status: 500 },
    );
  }
}
