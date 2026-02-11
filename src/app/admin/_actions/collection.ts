"use server";
import { db } from "@/lib/db";
import { collections, InsertCollection } from "@/lib/db/schema";
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

// Edit Collection
export const updateCollection = async (
  id: string,
  data: Partial<InsertCollection>,
) => {
  const rows = await db
    .update(collections)
    .set({
      name: data.name,
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
