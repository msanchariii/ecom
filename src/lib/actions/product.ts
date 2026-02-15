"use server";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  lte,
  or,
  sql,
  type SQL,
} from "drizzle-orm";
import { db } from "@/lib/db";
import {
  brands,
  categories,
  genders,
  productImages,
  productVariants,
  products,
  sizes,
  colors,
  users,
  reviews,
  type SelectProduct,
  type SelectVariant,
  type SelectProductImage,
  type SelectBrand,
  type SelectCategory,
  type SelectGender,
  type SelectColor,
  type SelectSize,
} from "@/lib/db/schema";

import { NormalizedProductFilters } from "@/lib/utils/query";

type ProductListItem = {
  id: string;
  name: string;
  imageUrl: string | null;
  minPrice: number | null;
  maxPrice: number | null;
  createdAt: Date;
  subtitle?: string | null;
  defaultVariantId?: string | null;
};

type VariantListItem = {
  id: string; // variant ID
  productId: string;
  productName: string;
  sku: string;
  imageUrl: string | null;
  price: number | null;
  salePrice: number | null;
  colorName: string | null;
  sizeName: string | null;
  createdAt: Date;
  subtitle?: string | null;
};

export type GetAllProductsResult = {
  products: ProductListItem[];
  totalCount: number;
};

export type GetAllVariantsResult = {
  variants: VariantListItem[];
  totalCount: number;
};

// export async function getAllProducts(filters: NormalizedProductFilters) {
//   const page = Math.max(1, filters.page);
//   const limit = Math.max(1, Math.min(filters.limit, 60));
//   const offset = (page - 1) * limit;

//   const productConds: SQL[] = [eq(products.isPublished, true)];

//   if (filters.genderSlugs.length) {
//     productConds.push(inArray(genders.slug, filters.genderSlugs));
//   }

//   if (filters.brandSlugs.length) {
//     productConds.push(inArray(brands.slug, filters.brandSlugs));
//   }

//   if (filters.categorySlugs.length) {
//     productConds.push(inArray(categories.slug, filters.categorySlugs));
//   }

//   const variantConds: SQL[] = [];

//   if (filters.sizeSlugs.length) {
//     variantConds.push(
//       inArray(
//         productVariants.sizeId,
//         db
//           .select({ id: sizes.id })
//           .from(sizes)
//           .where(inArray(sizes.slug, filters.sizeSlugs)),
//       ),
//     );
//   }

//   if (filters.colorSlugs.length) {
//     variantConds.push(
//       inArray(
//         productVariants.colorId,
//         db
//           .select({ id: colors.id })
//           .from(colors)
//           .where(inArray(colors.slug, filters.colorSlugs)),
//       ),
//     );
//   }

//   // Price filtering
//   if (filters.priceRanges.length) {
//     const priceConds = filters.priceRanges.map(([min, max]) => {
//       const c: SQL[] = [];
//       if (min !== undefined)
//         c.push(sql`${productVariants.price}::numeric >= ${min}`);
//       if (max !== undefined)
//         c.push(sql`${productVariants.price}::numeric <= ${max}`);
//       return and(...c)!;
//     });

//     variantConds.push(or(...priceConds)!);
//   }

//   // STEP 1: Collapse variants first
//   const filteredVariantGroups = db
//     .select({
//       productId: productVariants.productId,
//       colorId: productVariants.colorId,
//       minPrice: sql<number>`min(${productVariants.price}::numeric)`.as(
//         "min_price",
//       ),
//       maxPrice: sql<number>`max(${productVariants.price}::numeric)`.as(
//         "max_price",
//       ),
//     })
//     .from(productVariants)
//     .where(variantConds.length ? and(...variantConds) : undefined)
//     .groupBy(productVariants.productId, productVariants.colorId)
//     .as("fv");

//   // STEP 2: Main query
//   const rows = await db
//     .select({
//       productId: products.id,
//       name: products.name,
//       colorId: filteredVariantGroups.colorId,
//       minPrice: filteredVariantGroups.minPrice,
//       maxPrice: filteredVariantGroups.maxPrice,
//     })
//     .from(filteredVariantGroups)
//     .innerJoin(products, eq(products.id, filteredVariantGroups.productId))
//     .leftJoin(genders, eq(genders.id, products.genderId))
//     .leftJoin(brands, eq(brands.id, products.brandId))
//     .leftJoin(categories, eq(categories.id, products.categoryId))
//     .where(productConds.length ? and(...productConds) : undefined)
//     .orderBy(desc(products.createdAt))
//     .limit(limit)
//     .offset(offset);

//   // Count distinct product+color
//   const countRows = await db
//     .select({
//       cnt: count(),
//     })
//     .from(filteredVariantGroups);

//   return {
//     products: rows,
//     totalCount: countRows[0]?.cnt ?? 0,
//   };
// }

export const getAllProducts = async ({
  genderSlugs = [],
  sizeSlugs = [],
  colorSlugs = [],
  priceRanges = [],
  page = 1,
  limit = 12,
}: {
  genderSlugs?: string[];
  sizeSlugs?: string[];
  colorSlugs?: string[];
  priceRanges?: Array<[number | undefined, number | undefined]>;
  page?: number;
  limit?: number;
}) => {
  const offset = (page - 1) * limit;

  const conditions: SQL[] = [
    eq(products.isPublished, true),
    eq(productVariants.isActive, true),
    eq(productVariants.isDeleted, false),
  ];

  // Gender filter
  if (genderSlugs.length) {
    conditions.push(inArray(genders.slug, genderSlugs));
  }

  // Size filter
  if (sizeSlugs.length) {
    conditions.push(
      inArray(
        productVariants.sizeId,
        db
          .select({ id: sizes.id })
          .from(sizes)
          .where(inArray(sizes.slug, sizeSlugs)),
      ),
    );
  }

  // Color filter
  if (colorSlugs.length) {
    conditions.push(inArray(colors.slug, colorSlugs));
  }

  // Price filter
  if (priceRanges.length) {
    const priceConds = priceRanges.map(([min, max]) => {
      const sub: SQL[] = [];
      if (min !== undefined)
        sub.push(sql`${productVariants.price}::numeric >= ${min}`);
      if (max !== undefined)
        sub.push(sql`${productVariants.price}::numeric <= ${max}`);
      return and(...sub)!;
    });

    conditions.push(or(...priceConds)!);
  }

  const rows = await db
    .select({
      productId: products.id,
      productName: products.name,
      colorId: colors.id,
      colorName: colors.name,
      colorSlug: colors.slug,
      colorHex: colors.hexCode,
      price: sql<number>`MIN(${productVariants.price}::numeric)`.as(
        "min_price",
      ),
      salePrice: sql<
        number | null
      >`MIN(${productVariants.salePrice}::numeric)`.as("min_sale_price"),
      image: sql<string>`(
        SELECT ${productImages.url}
        FROM ${productImages}
        WHERE ${productImages.productId} = ${products.id}
          AND ${productImages.colorId} = ${colors.id}
        ORDER BY ${productImages.sortOrder}
        LIMIT 1
      )`.as("primary_image"),
    })
    .from(products)
    .innerJoin(productVariants, eq(products.id, productVariants.productId))
    .innerJoin(colors, eq(productVariants.colorId, colors.id))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .where(and(...conditions))
    .groupBy(
      products.id,
      products.name,
      colors.id,
      colors.name,
      colors.slug,
      colors.hexCode,
    )
    .orderBy(products.name)
    .limit(limit)
    .offset(offset);

  // Count for pagination
  const countResult = await db
    .select({
      total: sql<number>`COUNT(DISTINCT ${products.id} || '-' || ${colors.id})`,
    })
    .from(products)
    .innerJoin(productVariants, eq(products.id, productVariants.productId))
    .innerJoin(colors, eq(productVariants.colorId, colors.id))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .where(and(...conditions));

  return {
    data: rows,
    total: countResult[0]?.total ?? 0,
    page,
    limit,
  };
};

export async function getAllProductVariants(productId: string) {
  const rows = await db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      price: sql<number | null>`${productVariants.price}::numeric`,
      salePrice: sql<number | null>`${productVariants.salePrice}::numeric`,
      colorId: productVariants.colorId,
      sizeId: productVariants.sizeId,
      inStock: productVariants.inStock,
    })
    .from(productVariants)
    .where(eq(productVariants.productId, productId));

  return rows.map((r) => ({
    id: r.id,
    productId,
    sku: r.sku,
    price: r.price !== null ? String(r.price) : "0",
    salePrice: r.salePrice !== null ? String(r.salePrice) : null,
    colorId: r.colorId!,
    sizeId: r.sizeId!,
    inStock: r.inStock!,
    weight: null,
    dimensions: null,
    createdAt: new Date(),
  }));
}

export const getProductDetails = async (
  productId: string,
  colorSlug?: string,
) => {
  try {
    // Get full product details
    const productDetails = await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: {
        category: true,
        brand: true,
        gender: true,
      },
    });

    if (!productDetails) {
      return null;
    }

    // Get all available colors for this product
    const availableColors = await db
      .selectDistinct({
        id: colors.id,
        name: colors.name,
        slug: colors.slug,
        hexCode: colors.hexCode,
      })
      .from(productVariants)
      .innerJoin(colors, eq(productVariants.colorId, colors.id))
      .where(
        and(
          eq(productVariants.productId, productId),
          eq(productVariants.isActive, true),
          eq(productVariants.isDeleted, false),
        ),
      );

    // Determine which color to show
    let selectedColor;
    if (colorSlug) {
      selectedColor = availableColors.find((c) => c.slug === colorSlug);
    }
    // If no color specified or invalid color, use first available
    if (!selectedColor && availableColors.length > 0) {
      selectedColor = availableColors[0];
    }

    if (!selectedColor) {
      return {
        product: productDetails,
        availableColors: [],
        selectedColor: null,
        sizes: [],
        images: [],
      };
    }

    // Get sizes for the selected color
    const sizesData = await db
      .select({
        id: sizes.id,
        name: sizes.name,
        slug: sizes.slug,
        sortOrder: sizes.sortOrder,
        price: productVariants.price,
        salePrice: productVariants.salePrice,
        inStock: productVariants.inStock,
        variantId: productVariants.id,
        sku: productVariants.sku,
        maxQuantityPerOrder: productVariants.maxQuantityPerOrder,
        lowStockThreshold: productVariants.lowStockThreshold,
      })
      .from(productVariants)
      .innerJoin(sizes, eq(productVariants.sizeId, sizes.id))
      .where(
        and(
          eq(productVariants.productId, productId),
          eq(productVariants.colorId, selectedColor.id),
          eq(productVariants.isActive, true),
          eq(productVariants.isDeleted, false),
        ),
      )
      .orderBy(asc(sizes.sortOrder));

    // Get images for the selected color
    const images = await db.query.productImages.findMany({
      where: and(
        eq(productImages.productId, productId),
        eq(productImages.colorId, selectedColor.id),
      ),
      orderBy: [asc(productImages.sortOrder)],
    });

    return {
      product: productDetails,
      availableColors,
      selectedColor,
      sizes: sizesData,
      images,
    };
  } catch (error) {
    console.error("Error in getProductDetails:", error);
    throw error;
  }
};

export const getProductsForListing = async () => {
  // Get all products with their first two color variants
  const productsWithColors = await db
    .select({
      productId: products.id,
      productName: products.name,
      colorId: colors.id,
      colorName: colors.name,
      colorSlug: colors.slug,
      colorHex: colors.hexCode,
      price: sql<string>`MIN(${productVariants.price})`.as("min_price"),
      salePrice: sql<string | null>`MIN(${productVariants.salePrice})`.as(
        "min_sale_price",
      ),
      image: sql<string>`(
        SELECT ${productImages.url}
        FROM ${productImages}
        WHERE ${productImages.productId} = ${products.id}
          AND ${productImages.colorId} = ${colors.id}
        ORDER BY ${productImages.sortOrder}
        LIMIT 1
      )`.as("primary_image"),
    })
    .from(products)
    .innerJoin(productVariants, eq(products.id, productVariants.productId))
    .innerJoin(colors, eq(productVariants.colorId, colors.id))
    .where(
      and(
        eq(products.isPublished, true),
        eq(productVariants.isActive, true),
        eq(productVariants.isDeleted, false),
      ),
    )
    .groupBy(
      products.id,
      products.name,
      colors.id,
      colors.name,
      colors.slug,
      colors.hexCode,
    )
    .orderBy(products.name);

  return productsWithColors;
};
