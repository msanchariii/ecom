import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import type {
  CreateOrderRequest,
  CreateOrderResponse,
} from "@/lib/payment/types";

/**
 * API Route: Create Razorpay Order
 * POST /api/payment/create-order
 *
 * Creates a new order in Razorpay before initializing payment.
 * This is a server-side operation for security.
 */
export async function POST(request: NextRequest) {
  try {
    const body: CreateOrderRequest = await request.json();
    const { amount, currency = "INR", customerData, notes } = body;

    // Validate environment variables
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      console.error("Razorpay credentials not configured");
      return NextResponse.json(
        { error: "Payment gateway not configured" },
        { status: 500 },
      );
    }

    // Validate request
    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
    }

    if (!customerData?.email || !customerData?.firstName) {
      return NextResponse.json(
        { error: "Customer data is required" },
        { status: 400 },
      );
    }

    // Initialize Razorpay instance
    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    // Create order
    const order = await razorpay.orders.create({
      amount: amount, // Amount in smallest currency unit
      currency: currency,
      receipt: `rcpt_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      notes: {
        customer_email: customerData.email,
        customer_name: `${customerData.firstName} ${customerData.lastName}`,
        ...notes,
      },
    });

    const response: CreateOrderResponse = {
      orderId: order.id,
      amount:
        typeof order.amount === "string"
          ? parseInt(order.amount, 10)
          : order.amount,
      currency: order.currency,
    };

    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error("Error creating Razorpay order:", error);

    // Handle specific Razorpay errors
    if (error instanceof Error) {
      return NextResponse.json(
        {
          error: "Failed to create order",
          message: error.message,
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 },
    );
  }
}
