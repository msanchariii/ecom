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
    const rows = await db
        .select({
            username: users.name,
            totalAmount: orders.totalAmount,
            status: orders.status,
            quantity: orderItems.quantity,
            totalCost: orderItems.priceAtPurchase,
            createdAt: orders.createdAt,
            shippingAddress: addresses.line1,
            billingAddress: addresses,
        })
        .from(orders)
        .where(eq(orders.id, id))
        .limit(1)
        .leftJoin(users, eq(orders.userId, users.id))
        .leftJoin(orderItems, eq(orders.id, orderItems.orderId))
        .leftJoin(
            productVariants,
            eq(orderItems.productVariantId, productVariants.id),
        )
        .leftJoin(addresses, eq(orders.shippingAddressId, addresses.id))
        .leftJoin(addresses, eq(orders.billingAddressId, addresses.id));

    return rows[0];
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
