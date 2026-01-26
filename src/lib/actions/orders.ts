"use server";

import { db } from "@/lib/db";
import { orders, orderItems, productVariants, products } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";

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
