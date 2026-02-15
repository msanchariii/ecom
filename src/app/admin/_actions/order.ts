"use server";
import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  addresses,
  orderItems,
  orders,
  products,
  productVariants,
  users,
} from "@/lib/db/schema";

export const getAllOrders = async () => {
  const rows = await db
    .select({
      id: orders.id,
      userId: orders.userId,
      userName: users.name,
      totalAmount: orders.totalAmount,
      status: orders.status,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .orderBy(desc(orders.createdAt))
    .leftJoin(users, eq(orders.userId, users.id));
  return rows.map((row) => ({
    id: row.id,
    userId: row.userId,
    userName: row.userName,
    totalAmount: row.totalAmount,
    status: row.status,
    createdAt: row.createdAt,
  }));
};
export const getOrderDetailsById = async (id: string) => {
  // Get order with user and addresses
  const orderData = await db
    .select({
      id: orders.id,
      status: orders.status,
      totalAmount: orders.totalAmount,
      createdAt: orders.createdAt,
      userName: users.name,
      userPhone: users.phone,
      shippingAddress: {
        line1: addresses.line1,
        line2: addresses.line2,
        city: addresses.city,
        state: addresses.state,
        country: addresses.country,
        postalCode: addresses.postalCode,
        phone: addresses.phone,
      },
    })
    .from(orders)
    .where(eq(orders.id, id))
    .leftJoin(users, eq(orders.userId, users.id))
    .leftJoin(addresses, eq(orders.shippingAddressId, addresses.id))
    .limit(1);

  if (!orderData[0]) return null;

  // Get billing address separately
  const billingAddressData = await db
    .select({
      line1: addresses.line1,
      line2: addresses.line2,
      city: addresses.city,
      state: addresses.state,
      country: addresses.country,
      postalCode: addresses.postalCode,
      phone: addresses.phone,
    })
    .from(orders)
    .where(eq(orders.id, id))
    .leftJoin(addresses, eq(orders.billingAddressId, addresses.id))
    .limit(1);

  // Get order items with product details
  const items = await db
    .select({
      id: orderItems.id,
      quantity: orderItems.quantity,
      priceAtPurchase: orderItems.priceAtPurchase,
      productName: products.name,
      variantId: productVariants.id,
    })
    .from(orderItems)
    .where(eq(orderItems.orderId, id))
    .leftJoin(
      productVariants,
      eq(orderItems.productVariantId, productVariants.id),
    )
    .leftJoin(products, eq(productVariants.productId, products.id));

  return {
    ...orderData[0],
    billingAddress: billingAddressData[0] || null,
    items: items.map((item) => ({
      id: item.id,
      productName: item.productName || "Unknown Product",
      quantity: item.quantity,
      priceAtPurchase: item.priceAtPurchase,
    })),
  };
};
export const updateOrderStatus = async (
  id: string,
  status: "pending" | "shipped" | "delivered" | "cancelled" | "paid",
) => {
  const rows = await db
    .update(orders)
    .set({ status })
    .where(eq(orders.id, id))
    .returning();
  console.log("Updated Order Status:", rows);
  return rows[0];
};
