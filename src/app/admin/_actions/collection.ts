"use server";
import { db } from "@/lib/db";
import {
  collections,
  InsertCollection,
  productCollections,
  InsertProductCollection,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const getCollections = async () => {
  const rows = await db
    .select({
      id: collections.id,
      name: collections.name,
    })
    .from(collections);

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
  }));
};

export const getCollectionById = async (id: string) => {
  const rows = await db
    .select()
    .from(collections)
    .where(eq(collections.id, id))
    .limit(1);
  if (rows.length === 0) {
    return null;
  }
  return rows[0];
};

// Add New Collection
export const addCollection = async (data: InsertCollection) => {
  const rows = await db
    .insert(collections)
    .values({
      ...data,
      id: crypto.randomUUID(),
    })
    .returning();
  revalidatePath("/admin/collections");
  return rows[0];
};

// Get collections for a product
export const getCollectionsForProduct = async (productId: string) => {
  const rows = await db
    .select({
      id: collections.id,
      name: collections.name,
      slug: collections.slug,
    })
    .from(collections)
    .innerJoin(
      productCollections,
      eq(collections.id, productCollections.collectionId),
    )
    .where(eq(productCollections.productId, productId));

  return rows;
};

// Edit Collection
export const updateCollection = async (
  id: string,
  data: Partial<InsertCollection>,
) => {
  const rows = await db
    .update(collections)
    .set({
      name: data.name,
      slug: data.slug,
    })
    .where(eq(collections.id, id))
    .returning();
  revalidatePath("/admin/collections");
  return rows[0];
};

// Delete Collection
export const deleteCollection = async (id: string) => {
  const rows = await db
    .delete(collections)
    .where(eq(collections.id, id))
    .returning();
  revalidatePath("/admin/collections");
  return rows[0];
};

// Product Collections Management
export const addProductCollections = async (
  productId: string,
  collectionIds: string[],
) => {
  if (collectionIds.length === 0) return [];

  const rows = await db
    .insert(productCollections)
    .values(
      collectionIds.map((collectionId) => ({
        id: crypto.randomUUID(),
        productId,
        collectionId,
      })),
    )
    .returning();

  revalidatePath("/admin/variants");
  revalidatePath("/admin/products");
  return rows;
};

export const deleteProductCollections = async (productId: string) => {
  await db
    .delete(productCollections)
    .where(eq(productCollections.productId, productId));

  revalidatePath("/admin/variants");
  revalidatePath("/admin/products");
};

export const updateProductCollections = async (
  productId: string,
  collectionIds: string[],
) => {
  // Delete existing associations
  await deleteProductCollections(productId);

  // Add new associations
  if (collectionIds.length > 0) {
    return await addProductCollections(productId, collectionIds);
  }

  return [];
};
