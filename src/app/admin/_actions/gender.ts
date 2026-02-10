"use server";
import { db } from "@/lib/db";
import { genders, insertGenderSchema, InsertGender } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

export const getGenders = async () => {
  const rows = await db.select().from(genders);
  const results = rows.map((row) => ({
    id: row.id,
    label: row.label,
    slug: row.slug,
  }));
  return results;
};

export const getGenderById = async (id: string) => {
  const row = await db
    .select()
    .from(genders)
    .where(eq(genders.id, id))
    .limit(1);
  if (row.length === 0) {
    return null;
  }
  const gender = row[0];
  return {
    id: gender.id,
    label: gender.label,
    slug: gender.slug,
  };
};

export const addGender = async (data: InsertGender) => {
  try {
    const validated = insertGenderSchema.parse(data);
    await db.insert(genders).values(validated);
    revalidatePath("/admin/gender");
    return { success: true };
  } catch (error) {
    console.error("Failed to add gender:", error);
    throw error;
  }
};

export const updateGender = async (id: string, data: InsertGender) => {
  try {
    const validated = insertGenderSchema.parse(data);
    await db.update(genders).set(validated).where(eq(genders.id, id));
    revalidatePath("/admin/gender");
    return { success: true };
  } catch (error) {
    console.error("Failed to update gender:", error);
    throw error;
  }
};
