import { db } from "@/lib/db";
import { categories, InsertCategory } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

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


const deleteCategory = async (id: string) => {
  const rows = await db.update(categories)
    .set({ isDeleted: true })
    .where(eq(categories.id, id))
    .returning();
  console.log("Deleted Category:", rows);
  return rows[0];
 }

const updateCategory = async (id: string, data: Partial<InsertCategory>) => {
    const rows = await db.update(categories)
      .set(
        {
          name: data.name,
          slug: data.name?.toLowerCase().replace(/\s+/g, "-"),
          parentId: data.parentId,
        }
      )
      .where(eq(categories.id, id))
      .returning();
    console.log("Updated Category:", rows);
    return rows[0];
}