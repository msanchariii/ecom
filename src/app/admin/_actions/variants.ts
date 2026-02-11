"use server";

import { db } from "@/lib/db";
import {
  productVariants,
  productVariantImages,
  InsertVariant,
  products,
  productImages,
} from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export const getVariants = async () => {
  const rows = await db
    .select({
      variantId: productVariants.id,
      sku: productVariants.sku,
      price: productVariants.price,
      productName: products.name,
      imageUrl: productImages.url,
      stock: productVariants.inStock,
    })
    .from(productVariants)
    .where(eq(productVariants.isDeleted, false))
    .leftJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(productImages, eq(productVariants.id, productImages.variantId));
  // .where(eq(productImages.isPrimary, true));

  const result = rows.map((row) => ({
    id: row.variantId,
    sku: row.sku,
    price: row.price,
    productName: row.productName,
    imageUrl: row.imageUrl,
    inStock: row.stock,
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

export const addVariant = async (data: InsertVariant) => {
  const rows = await db
    .insert(productVariants)
    .values({
      ...data,
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
  const rows = await db
    .update(productVariants)
    .set(data)
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
  await db
    .delete(productVariantImages)
    .where(eq(productVariantImages.variantId, id));
  await db.delete(productVariants).where(eq(productVariants.id, id));
};

// Variant Images
export const addVariantImages = async (
  variantId: string,
  images: Array<{ imageUrl: string; isPrimary: boolean }>,
) => {
  const rows = await db
    .insert(productVariantImages)
    .values(
      images.map((img) => ({
        id: randomUUID(),
        variantId,
        imageUrl: img.imageUrl,
        isPrimary: img.isPrimary,
      })),
    )
    .returning();
  console.log("Added Variant Images:", rows);
  return rows;
};

export const getVariantImages = async (variantId: string) => {
  const rows = await db
    .select()
    .from(productVariantImages)
    .where(eq(productVariantImages.variantId, variantId));
  return rows;
};

export const deleteVariantImages = async (variantId: string) => {
  await db
    .delete(productVariantImages)
    .where(eq(productVariantImages.variantId, variantId));
};
