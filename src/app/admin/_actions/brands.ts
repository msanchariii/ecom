"use server";
import { db } from "@/lib/db";
import { brands, insertBrandSchema, InsertBrand } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const getBrands = async () => {
  const rows = await db.select().from(brands);
  return rows;
};

export const getBrandById = async (id: string) => {
  const row = await db.select().from(brands).where(eq(brands.id, id)).limit(1);
  if (row.length === 0) {
    return null;
  }
  return row[0];
};

export const addBrand = async (data: InsertBrand) => {
  try {
    const validated = insertBrandSchema.parse(data);
    await db.insert(brands).values(validated);
    revalidatePath("/admin/brands");
    return { success: true };
  } catch (error) {
    console.error("Failed to add brand:", error);
    throw error;
  }
};

export const updateBrand = async (id: string, data: InsertBrand) => {
  try {
    const validated = insertBrandSchema.parse(data);
    await db.update(brands).set(validated).where(eq(brands.id, id));
    revalidatePath("/admin/brands");
    return { success: true };
  } catch (error) {
    console.error("Failed to update brand:", error);
    throw error;
  }
};
