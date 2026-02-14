"use server";

import { db } from "@/lib/db";
import {
  productVariants,
  InsertVariant,
  products,
  productImages,
  colors,
  sizes,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { size } from "zod";

export const getVariants = async () => {
  const rows = await db
    .select({
      variantId: productVariants.id,
      sku: productVariants.sku,
      price: productVariants.price,
      productName: products.name,
      colorId: productVariants.colorId,
      imageUrl: productImages.url,
      stock: productVariants.inStock,
      size: sizes.name,
    })
    .from(productVariants)
    .where(eq(productVariants.isDeleted, false))
    .leftJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(
      productImages,
      and(
        eq(productVariants.productId, productImages.productId),
        eq(productVariants.colorId, productImages.colorId),
        eq(productImages.isPrimary, true),
      ),
    )
    .leftJoin(sizes, eq(productVariants.sizeId, sizes.id));
  const result = rows.map((row) => ({
    id: row.variantId,
    sku: row.sku,
    price: row.price,
    productName: row.productName,
    imageUrl: row.imageUrl,
    inStock: row.stock,
    size: row.size,
  }));

  return result;
};

export const getVariantById = async (id: string) => {
  const rows = await db
    .select()
    .from(productVariants)
    .where(
      and(eq(productVariants.id, id), eq(productVariants.isDeleted, false)),
    )
    .limit(1);
  if (rows.length === 0) {
    return null;
  }
  return rows[0];
};

// Helper to sanitize variant data - remove empty strings for optional fields
const sanitizeVariantData = (data: any) => {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(data)) {
    // Skip undefined values
    if (value === undefined) continue;

    // Convert empty strings to undefined for optional nullable fields
    if (value === "" && ["salePrice", "costPrice", "weight"].includes(key)) {
      continue; // Don't include this field, let DB handle it
    }

    // Keep all other values as-is
    sanitized[key] = value;
  }

  return sanitized;
};

export const addVariant = async (data: InsertVariant) => {
  const sanitizedData = sanitizeVariantData(data);
  const rows = await db
    .insert(productVariants)
    .values({
      ...sanitizedData,
      id: randomUUID(),
    })
    .returning();
  console.log("Added Variant:", rows);
  return rows[0];
};

export const updateVariant = async (
  id: string,
  data: Partial<InsertVariant>,
) => {
  const sanitizedData = sanitizeVariantData(data);
  const rows = await db
    .update(productVariants)
    .set(sanitizedData)
    .where(eq(productVariants.id, id))
    .returning();
  console.log("Updated Variant:", rows);
  return rows[0];
};

export const deleteVariant = async (id: string) => {
  const rows = await db
    .update(productVariants)
    .set({ isActive: false, isDeleted: true })
    .where(eq(productVariants.id, id))
    .returning();
  console.log("Deleted Variant:", rows);
  return rows[0];
};

export const permanentlyDeleteVariant = async (id: string) => {
  await db.delete(productVariants).where(eq(productVariants.id, id));
};
