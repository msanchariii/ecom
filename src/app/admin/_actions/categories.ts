import { db } from "@/lib/db";
import { categories, InsertCategory } from "@/lib/db/schema";

export const getCategories = async () => {
  const rows = await db.select().from(categories);
  const results = rows.map((row) => ({
    id: row.id,
    name: row.name,
    parentId: row.parentId,
  }));
  console.log("Categories:", results);
  return results;
};

export const addCategory = async (data: InsertCategory) => {
  const rows = await db
    .insert(categories)
    .values({
      ...data,
      id: crypto.randomUUID(),
    })
    .returning();
  console.log("Added Category:", rows);
  return rows[0];
};
