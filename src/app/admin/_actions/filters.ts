"use server";

import { db } from "@/lib/db";
import { colors } from "@/lib/db/schema/filters/colors";
import { sizes } from "@/lib/db/schema/filters/sizes";

export const getColors = async () => {
  const rows = await db.select().from(colors).orderBy(colors.name);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    hexCode: row.hexCode,
  }));
};

export const getSizes = async () => {
  const rows = await db.select().from(sizes).orderBy(sizes.sortOrder);
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    sortOrder: row.sortOrder,
  }));
};
