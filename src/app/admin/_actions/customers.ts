"use server";

import { db } from "@/lib/db";
import { users, orders } from "@/lib/db/schema";
import { desc, sql, eq, count } from "drizzle-orm";

export interface CustomerData {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  orderCount: number;
  totalSpent: string;
  createdAt: Date;
}

export async function getAllCustomers(): Promise<CustomerData[]> {
  try {
    // Get all users with their order stats
    const customers = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        emailVerified: users.emailVerified,
        createdAt: users.createdAt,
        orderCount: sql<number>`cast(count(${orders.id}) as int)`,
        totalSpent: sql<string>`coalesce(sum(${orders.totalAmount}), '0')`,
      })
      .from(users)
      .leftJoin(orders, eq(users.id, orders.userId))
      .groupBy(
        users.id,
        users.name,
        users.email,
        users.phone,
        users.emailVerified,
        users.createdAt,
      )
      .orderBy(desc(users.createdAt));

    return customers.map((customer) => ({
      id: customer.id,
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      emailVerified: customer.emailVerified,
      orderCount: customer.orderCount || 0,
      totalSpent: customer.totalSpent || "0",
      createdAt: customer.createdAt,
    }));
  } catch (error) {
    console.error("Failed to fetch customers:", error);
    return [];
  }
}

export async function getCustomerById(customerId: string) {
  try {
    const customer = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        phone: users.phone,
        emailVerified: users.emailVerified,
        image: users.image,
        createdAt: users.createdAt,
      })
      .from(users)
      .where(eq(users.id, customerId))
      .limit(1);

    if (!customer.length) {
      return null;
    }

    // Get order count and total spent
    const orderStats = await db
      .select({
        orderCount: count(orders.id),
        totalSpent: sql<string>`coalesce(sum(${orders.totalAmount}), '0')`,
      })
      .from(orders)
      .where(eq(orders.userId, customerId));

    return {
      ...customer[0],
      orderCount: orderStats[0]?.orderCount || 0,
      totalSpent: orderStats[0]?.totalSpent || "0",
    };
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    return null;
  }
}
