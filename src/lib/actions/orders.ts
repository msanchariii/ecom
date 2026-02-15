"use server";

import { db } from "@/lib/db";
import { orders, orderItems, productVariants, products } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export type OrderWithItems = {
  id: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  totalAmount: string;
  createdAt: Date;
  items: Array<{
    id: string;
    productName: string;
    quantity: number;
    priceAtPurchase: string | null;
  }>;
};

export async function getUserOrders(): Promise<OrderWithItems[]> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return [];
  }

  const userOrders = await db
    .select({
      orderId: orders.id,
      orderStatus: orders.status,
      orderTotalAmount: orders.totalAmount,
      orderCreatedAt: orders.createdAt,
      itemId: orderItems.id,
      productName: products.name,
      itemQuantity: orderItems.quantity,
      priceAtPurchase: orderItems.priceAtPurchase,
    })
    .from(orders)
    .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
    .leftJoin(
      productVariants,
      eq(orderItems.productVariantId, productVariants.id),
    )
    .leftJoin(products, eq(productVariants.productId, products.id))
    .where(eq(orders.userId, session.user.id))
    .orderBy(desc(orders.createdAt));

  // Group items by order
  const ordersMap = new Map<
    string,
    (typeof userOrders)[number] & { items: OrderWithItems["items"] }
  >();

  for (const row of userOrders) {
    if (!ordersMap.has(row.orderId)) {
      ordersMap.set(row.orderId, {
        ...row,
        items: [],
      });
    }

    const order = ordersMap.get(row.orderId)!;
    if (row.itemId) {
      order.items.push({
        id: row.itemId,
        productName: row.productName || "Unknown Product",
        quantity: row.itemQuantity || 1,
        priceAtPurchase: row.priceAtPurchase,
      });
    }
  }

  return Array.from(ordersMap.values()).map((order) => ({
    id: order.orderId,
    status: order.orderStatus,
    totalAmount: order.orderTotalAmount,
    createdAt: order.orderCreatedAt,
    items: order.items,
  }));
}

export interface CreateOrderData {
  items: Array<{
    variantId: string;
    quantity: number;
    price: number;
  }>;
  shippingAddressId: string;
  billingAddressId: string;
  totalAmount: number;
  paymentId?: string;
  razorpayOrderId?: string;
}

export async function createOrder(
  data: CreateOrderData,
): Promise<{ success: boolean; error?: string; orderId?: string }> {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // Create the order
    const [newOrder] = await db
      .insert(orders)
      .values({
        userId: session.user.id,
        status: "paid",
        totalAmount: data.totalAmount.toString(),
        shippingAddressId: data.shippingAddressId,
        billingAddressId: data.billingAddressId,
      })
      .returning();

    // Create order items
    const orderItemsData = data.items.map((item) => ({
      orderId: newOrder.id,
      productVariantId: item.variantId,
      quantity: item.quantity,
      priceAtPurchase: item.price.toString(),
    }));

    await db.insert(orderItems).values(orderItemsData);

    // Revalidate orders page
    revalidatePath("/me/orders");

    console.log("Order created successfully:", {
      orderId: newOrder.id,
      userId: session.user.id,
      totalAmount: data.totalAmount,
      itemsCount: data.items.length,
      paymentId: data.paymentId,
      razorpayOrderId: data.razorpayOrderId,
    });

    return { success: true, orderId: newOrder.id };
  } catch (error) {
    console.error("Failed to create order:", error);
    return { success: false, error: "Failed to create order" };
  }
}
