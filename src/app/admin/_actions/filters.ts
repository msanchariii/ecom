"use server";

import { db } from "@/lib/db";
import { colors, InsertColor } from "@/lib/db/schema/filters/colors";
import { sizes, InsertSize } from "@/lib/db/schema/filters/sizes";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";
import { revalidatePath } from "next/cache";

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
  return rows[0];
};

export const deleteSize = async (id: string) => {
  const rows = await db.delete(sizes).where(eq(sizes.id, id)).returning();
  console.log("Deleted Size:", rows);
  return rows[0];
};
