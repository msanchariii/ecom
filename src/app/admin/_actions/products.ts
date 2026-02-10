"use server";
// * GET /admin/products
// * POST /admin/products
// * PUT /admin/products/:id
// * DELETE /admin/products/:id

import { db } from "@/lib/db";
import { brands, categories, genders, products } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export const getProducts = async () => {
  const rows = await db
    .select()
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(genders, eq(products.genderId, genders.id))
    .groupBy(products.id, brands.id, categories.id, genders.id);
  const results = rows.map((row) => ({
    id: row.products.id,
    name: row.products.name,
    imageUrl: null, // Placeholder for image URL
    minPrice: null, // Placeholder for minimum price
    maxPrice: null, // Placeholder for maximum price
    isPublished: row.products.isPublished,
    createdAt: row.products.createdAt,
    brandName: row.brands?.name || null,
    category: row.categories?.name || null,
    gender: row.genders?.label || null,
  }));
  console.log("Products:", results);

  return results;
};
