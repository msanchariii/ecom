import { db } from "@/lib/db";
import { orders, orderItems, products, productVariants } from "@/lib/db/schema";
import { eq, sql, asc } from "drizzle-orm";

export const getTotalRevenue = async (): Promise<number> => {
  const result = await db
    .select({
      total: sql<number>`SUM(total_amount)`,
    })
    .from(orders)
    .where(eq(orders.status, "delivered"))
    .execute();
  return result[0]?.total || 0;
};

export const getTotalOrders = async (): Promise<number> => {
  const result = await db
    .select({
      total: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(eq(orders.status, "delivered"))
    .execute();
  return result[0]?.total || 0;
};

export const getTotalCustomers = async (): Promise<number> => {
  const result = await db
    .select({
      total: sql<number>`COUNT(DISTINCT user_id)`,
    })
    .from(orders)
    .where(eq(orders.status, "delivered"))
    .execute();
  return result[0]?.total || 0;
};

export const getRevenueByDate = async (): Promise<
  { date: string; revenue: number }[]
> => {
  const result = await db
    .select({
      date: sql<string>`DATE(created_at)`,
      revenue: sql<number>`SUM(total_amount)`,
    })
    .from(orders)
    .where(eq(orders.status, "delivered"))
    .groupBy(sql`DATE(created_at)`)
    .orderBy(asc(sql`DATE(created_at)`))
    .execute();
  return result.map((row) => ({
    date: row.date,
    revenue: row.revenue,
  }));
};

export const getConversionRate = async (): Promise<number> => {
  const totalOrdersResult = await db
    .select({
      total: sql<number>`COUNT(*)`,
    })
    .from(orders)
    .where(eq(orders.status, "delivered"))
    .execute();
  const totalOrders = totalOrdersResult[0]?.total || 0;

  const totalCustomersResult = await db
    .select({
      total: sql<number>`COUNT(DISTINCT user_id)`,
    })
    .from(orders)
    .where(eq(orders.status, "delivered"))
    .execute();
  const totalCustomers = totalCustomersResult[0]?.total || 0;

  if (totalCustomers === 0) {
    return 0;
  }

  return (totalOrders / totalCustomers) * 100;
};

export const getAverageOrderValue = async (): Promise<number> => {
  const result = await db
    .select({
      average: sql<number>`AVG(total_amount)`,
    })
    .from(orders)
    .where(eq(orders.status, "delivered"))
    .execute();
  return result[0]?.average || 0;
};

export const getTopSellingProducts = async (): Promise<
  { productId: string; productName: string; totalSold: number }[]
> => {
  const result = await db
    .select({
      productId: productVariants.productId,
      productName: products.name,
      totalSold: sql<number>`SUM(${orderItems.quantity})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(
      productVariants,
      eq(orderItems.productVariantId, productVariants.id),
    )
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(eq(orders.status, "delivered"))
    .groupBy(productVariants.productId, products.name)
    .orderBy(sql`SUM(${orderItems.quantity}) DESC`)
    .limit(10)
    .execute();
  return result.map((row) => ({
    productId: row.productId,
    productName: row.productName,
    totalSold: row.totalSold,
  }));
};
