"use server";
// * GET /admin/products
// * POST /admin/products
// * PUT /admin/products/:id
// * DELETE /admin/products/:id

import { db } from "@/lib/db";
import {
  brands,
  categories,
  genders,
  InsertProduct,
  products,
  productImages,
  InsertProductImage,
  colors,
} from "@/lib/db/schema";
import { eq, and, isNotNull } from "drizzle-orm";
import { randomUUID } from "crypto";

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

export const addProduct = async (data: InsertProduct) => {
  const rows = await db
    .insert(products)
    .values({
      ...data,
      id: randomUUID(),
    })
    .returning();
  console.log("Added Product:", rows);
  return rows[0];
};

export const getProductById = async (id: string) => {
  const rows = await db
    .select()
    .from(products)
    .where(eq(products.id, id))
    .limit(1);
  if (rows.length === 0) {
    return null;
  }
  return rows[0];
};

export const updateProduct = async (
  id: string,
  data: Partial<InsertProduct>,
) => {
  const rows = await db
    .update(products)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(products.id, id))
    .returning();
  console.log("Updated Product:", rows);
  return rows[0];
};

// Product Images (Product + Color based)
export const addProductImages = async (
  productId: string,
  colorId: string,
  images: Array<{ url: string; isPrimary: boolean; sortOrder?: number }>,
) => {
  const rows = await db
    .insert(productImages)
    .values(
      images.map((img, index) => ({
        id: randomUUID(),
        productId,
        colorId,
        url: img.url,
        isPrimary: img.isPrimary,
        sortOrder: img.sortOrder ?? index,
      })),
    )
    .returning();
  console.log("Added Product Images:", rows);
  return rows;
};

export const getProductImages = async (productId: string, colorId?: string) => {
  const conditions = colorId
    ? and(
        eq(productImages.productId, productId),
        eq(productImages.colorId, colorId),
      )
    : eq(productImages.productId, productId);

  const rows = await db
    .select()
    .from(productImages)
    .where(conditions)
    .orderBy(productImages.sortOrder);
  return rows;
};

export const deleteProductImages = async (
  productId: string,
  colorId: string,
) => {
  await db
    .delete(productImages)
    .where(
      and(
        eq(productImages.productId, productId),
        eq(productImages.colorId, colorId),
      ),
    );
};

export const deleteProductImageById = async (imageId: string) => {
  await db.delete(productImages).where(eq(productImages.id, imageId));
};

export const checkImagesExistForColor = async (
  productId: string,
  colorId: string,
): Promise<boolean> => {
  const images = await db
    .select({ id: productImages.id })
    .from(productImages)
    .where(
      and(
        eq(productImages.productId, productId),
        eq(productImages.colorId, colorId),
      ),
    )
    .limit(1);
  return images.length > 0;
};

export const getProductListings = async () => {
  const rows = await db
    .select({
      productId: products.id,
      name: products.name,
      brandName: brands.name,
      categoryName: categories.name,
      genderLabel: genders.label,
      imageUrl: productImages.url,
      colorCode: colors.hexCode,
      colorName: colors.name,
    })
    .from(products)
    .leftJoin(productImages, eq(products.id, productImages.productId))
    .leftJoin(colors, eq(productImages.colorId, colors.id))
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(genders, eq(products.genderId, genders.id))
    .where(and(eq(productImages.isPrimary, true), isNotNull(colors.id)));
  return rows;
};

export const productListingDetailsById = async (id: string) => {
  const rows = await db
    .select({
      productId: products.id,
      name: products.name,
      description: products.description,
      brandName: brands.name,
      categoryName: categories.name,
      genderLabel: genders.label,
      imageUrl: productImages.url,
    })
    .from(products)
    .leftJoin(brands, eq(products.brandId, brands.id))
    .leftJoin(categories, eq(products.categoryId, categories.id))
    .leftJoin(genders, eq(products.genderId, genders.id))
    .leftJoin(productImages, eq(products.id, productImages.productId))
    .where(eq(products.id, id))
    .limit(1);

  if (rows.length === 0) {
    return null;
  }

  return rows[0];
};
