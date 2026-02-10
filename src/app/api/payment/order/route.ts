// Create an order
// use razorpay for payment processing

import axios from "axios";
import { NextResponse } from "next/server";
import { z } from "zod";
import Razorpay from "razorpay";

const CreateOrderRequest = z.object({
  amount: z.number(), // in paisa
  currency: z.string(), // e.g. "INR"
  notes: z.object().optional(), // optional key-value pairs
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = CreateOrderRequest.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error },
        { status: 400 },
      );
    }
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID || "",
      key_secret: process.env.RAZORPAY_KEY_SECRET || "",
    });
    const order = await razorpay.orders.create({
      amount: parsed.data.amount,
      currency: parsed.data.currency || "INR",
      receipt: "RECEIPT_" + Math.random().toString(36).substring(2, 15),
    });

    return NextResponse.json({ orderId: order.id }, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create order", details: error },
      { status: 500 },
    );
  }
}
/*
{
Sample response from Razorpay when creating an order:
  "amount": 50000,
  "amount_due": 50000,
  "amount_paid": 0,
  "attempts": 0,
  "created_at": 1770730162,
  "currency": "INR",
  "entity": "order",
  "id": "order_SESYj3OPr4LqPj",
  "notes": [],
  "offer_id": null,
  "receipt": null,
  "status": "created"
}
*/
