"use server";

import { db } from "@/lib/db";
import { colors, InsertColor } from "@/lib/db/schema/filters/colors";
import { sizes, InsertSize } from "@/lib/db/schema/filters/sizes";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";
import { genders, InsertGender, insertGenderSchema } from "@/lib/db/schema";

// ============= COLORS =============

export const getColors = async () => {
  const rows = await db.select().from(colors).orderBy(colors.name);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    hexCode: row.hexCode,
  }));
};

export const getColorById = async (id: string) => {
  const rows = await db.select().from(colors).where(eq(colors.id, id)).limit(1);
  if (rows.length === 0) {
    return null;
  }
  return rows[0];
};

export const addColor = async (data: InsertColor) => {
  const rows = await db
    .insert(colors)
    .values({
      ...data,
      id: randomUUID(),
    })
    .returning();
  console.log("Added Color:", rows);
  revalidatePath("/admin/colors");
  return rows[0];
};

export const updateColor = async (id: string, data: Partial<InsertColor>) => {
  const rows = await db
    .update(colors)
    .set({
      name: data.name,
      slug: data.slug,
      hexCode: data.hexCode,
    })
    .where(eq(colors.id, id))
    .returning();
  console.log("Updated Color:", rows);
  revalidatePath("/admin/colors");
  return rows[0];
};

export const deleteColor = async (id: string) => {
  const rows = await db.delete(colors).where(eq(colors.id, id)).returning();
  console.log("Deleted Color:", rows);
  revalidatePath("/admin/colors");
  return rows[0];
};

// ============= SIZES =============

export const getSizes = async () => {
  const rows = await db.select().from(sizes).orderBy(sizes.sortOrder);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder,
  }));
};

export const getSizeById = async (id: string) => {
  const rows = await db.select().from(sizes).where(eq(sizes.id, id)).limit(1);
  if (rows.length === 0) {
    return null;
  }
  return rows[0];
};

export const addSize = async (data: InsertSize) => {
  const rows = await db
    .insert(sizes)
    .values({
      ...data,
      id: randomUUID(),
    })
    .returning();
  console.log("Added Size:", rows);
  revalidatePath("/admin/sizes");
  return rows[0];
};

export const updateSize = async (id: string, data: Partial<InsertSize>) => {
  const rows = await db
    .update(sizes)
    .set({
      name: data.name,
      slug: data.slug,
      sortOrder: data.sortOrder,
    })
    .where(eq(sizes.id, id))
    .returning();
  console.log("Updated Size:", rows);
  revalidatePath("/admin/sizes");
  return rows[0];
};

export const deleteSize = async (id: string) => {
  const rows = await db.delete(sizes).where(eq(sizes.id, id)).returning();
  console.log("Deleted Size:", rows);
  revalidatePath("/admin/sizes");
  return rows[0];
};

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
