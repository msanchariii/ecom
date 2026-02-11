"use server";

import {
  and,
  asc,
  count,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
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
  productVariantImages,
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

export async function getAllProducts(
  filters: NormalizedProductFilters,
): Promise<GetAllProductsResult> {
  const conds: SQL[] = [eq(products.isPublished, true)];

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conds.push(
      or(ilike(products.name, pattern), ilike(products.description, pattern))!,
    );
  }

  if (filters.genderSlugs.length) {
    conds.push(inArray(genders.slug, filters.genderSlugs));
  }

  if (filters.brandSlugs.length) {
    conds.push(inArray(brands.slug, filters.brandSlugs));
  }

  if (filters.categorySlugs.length) {
    conds.push(inArray(categories.slug, filters.categorySlugs));
  }

  const hasSize = filters.sizeSlugs.length > 0;
  const hasColor = filters.colorSlugs.length > 0;
  const hasPrice = !!(
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined ||
    filters.priceRanges.length
  );

  const variantConds: SQL[] = [];
  if (hasSize) {
    variantConds.push(
      inArray(
        productVariants.sizeId,
        db
          .select({ id: sizes.id })
          .from(sizes)
          .where(inArray(sizes.slug, filters.sizeSlugs)),
      ),
    );
  }
  if (hasColor) {
    variantConds.push(
      inArray(
        productVariants.colorId,
        db
          .select({ id: colors.id })
          .from(colors)
          .where(inArray(colors.slug, filters.colorSlugs)),
      ),
    );
  }
  if (hasPrice) {
    const priceBounds: SQL[] = [];
    if (filters.priceRanges.length) {
      for (const [min, max] of filters.priceRanges) {
        const subConds: SQL[] = [];
        if (min !== undefined) {
          subConds.push(sql`(${productVariants.price})::numeric >= ${min}`);
        }
        if (max !== undefined) {
          subConds.push(sql`(${productVariants.price})::numeric <= ${max}`);
        }
        if (subConds.length) priceBounds.push(and(...subConds)!);
      }
    }
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const subConds: SQL[] = [];
      if (filters.priceMin !== undefined)
        subConds.push(
          sql`(${productVariants.price})::numeric >= ${filters.priceMin}`,
        );
      if (filters.priceMax !== undefined)
        subConds.push(
          sql`(${productVariants.price})::numeric <= ${filters.priceMax}`,
        );
      if (subConds.length) priceBounds.push(and(...subConds)!);
    }
    if (priceBounds.length) {
      variantConds.push(or(...priceBounds)!);
    }
  }

  const variantJoin = db
    .select({
      variantId: productVariants.id,
      productId: productVariants.productId,
      price: sql<number>`${productVariants.price}::numeric`.as("price"),
      colorId: productVariants.colorId,
      sizeId: productVariants.sizeId,
    })
    .from(productVariants)
    .where(variantConds.length ? and(...variantConds) : undefined)
    .as("v");
  const imagesJoin = hasColor
    ? db
        .select({
          productId: productImages.productId,
          url: productImages.url,
          rn: sql<number>`row_number() over (partition by ${productImages.productId} order by ${productImages.isPrimary} desc, ${productImages.sortOrder} asc)`.as(
            "rn",
          ),
        })
        .from(productImages)
        .innerJoin(
          productVariants,
          eq(productVariants.id, productImages.variantId),
        )
        .where(
          inArray(
            productVariants.colorId,
            db
              .select({ id: colors.id })
              .from(colors)
              .where(inArray(colors.slug, filters.colorSlugs)),
          ),
        )
        .as("pi")
    : db
        .select({
          productId: productImages.productId,
          url: productImages.url,
          rn: sql<number>`row_number() over (partition by ${productImages.productId} order by ${productImages.isPrimary} desc, ${productImages.sortOrder} asc)`.as(
            "rn",
          ),
        })
        .from(productImages)
        .where(isNull(productImages.variantId))
        .as("pi");

  const baseWhere = conds.length ? and(...conds) : undefined;

  const priceAgg = {
    minPrice: sql<number | null>`min(${variantJoin.price})`,
    maxPrice: sql<number | null>`max(${variantJoin.price})`,
  };

  const imageAgg = sql<
    string | null
  >`max(case when ${imagesJoin.rn} = 1 then ${imagesJoin.url} else null end)`;

  const primaryOrder =
    filters.sort === "price_asc"
      ? asc(sql`min(${variantJoin.price})`)
      : filters.sort === "price_desc"
        ? desc(sql`max(${variantJoin.price})`)
        : desc(products.createdAt);

  const page = Math.max(1, filters.page);
  const limit = Math.max(1, Math.min(filters.limit, 60));
  const offset = (page - 1) * limit;

  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      createdAt: products.createdAt,
      subtitle: genders.label,
      minPrice: priceAgg.minPrice,
      maxPrice: priceAgg.maxPrice,
      imageUrl: imageAgg,
    })
    .from(products)
    .leftJoin(variantJoin, eq(variantJoin.productId, products.id))
    .leftJoin(imagesJoin, eq(imagesJoin.productId, products.id))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(baseWhere)
    .groupBy(products.id, products.name, products.createdAt, genders.label)
    .orderBy(primaryOrder, desc(products.createdAt), asc(products.id))
    .limit(limit)
    .offset(offset);
  const countRows = await db
    .select({
      cnt: count(sql<number>`distinct ${products.id}`),
    })
    .from(products)
    .leftJoin(variantJoin, eq(variantJoin.productId, products.id))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .where(baseWhere);

  const productsOut: ProductListItem[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    imageUrl: r.imageUrl,
    minPrice: r.minPrice === null ? null : Number(r.minPrice),
    maxPrice: r.maxPrice === null ? null : Number(r.maxPrice),
    createdAt: r.createdAt,
    subtitle: r.subtitle ? `${r.subtitle} Shoes` : null,
  }));

  const totalCount = countRows[0]?.cnt ?? 0;

  return { products: productsOut, totalCount };
}

export async function getAllProductVariantsForListing(
  filters: NormalizedProductFilters,
): Promise<GetAllVariantsResult> {
  const conds: SQL[] = [eq(products.isPublished, true)];

  if (filters.search) {
    const pattern = `%${filters.search}%`;
    conds.push(
      or(ilike(products.name, pattern), ilike(products.description, pattern))!,
    );
  }

  if (filters.genderSlugs.length) {
    conds.push(inArray(genders.slug, filters.genderSlugs));
  }

  if (filters.brandSlugs.length) {
    conds.push(inArray(brands.slug, filters.brandSlugs));
  }

  if (filters.categorySlugs.length) {
    conds.push(inArray(categories.slug, filters.categorySlugs));
  }

  const variantConds: SQL[] = [];
  if (filters.sizeSlugs.length > 0) {
    variantConds.push(
      inArray(
        productVariants.sizeId,
        db
          .select({ id: sizes.id })
          .from(sizes)
          .where(inArray(sizes.slug, filters.sizeSlugs)),
      ),
    );
  }
  if (filters.colorSlugs.length > 0) {
    variantConds.push(
      inArray(
        productVariants.colorId,
        db
          .select({ id: colors.id })
          .from(colors)
          .where(inArray(colors.slug, filters.colorSlugs)),
      ),
    );
  }

  const hasPrice = !!(
    filters.priceMin !== undefined ||
    filters.priceMax !== undefined ||
    filters.priceRanges.length
  );

  if (hasPrice) {
    const priceBounds: SQL[] = [];
    if (filters.priceRanges.length) {
      for (const [min, max] of filters.priceRanges) {
        const subConds: SQL[] = [];
        if (min !== undefined) {
          subConds.push(sql`(${productVariants.price})::numeric >= ${min}`);
        }
        if (max !== undefined) {
          subConds.push(sql`(${productVariants.price})::numeric <= ${max}`);
        }
        if (subConds.length) priceBounds.push(and(...subConds)!);
      }
    }
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      const subConds: SQL[] = [];
      if (filters.priceMin !== undefined)
        subConds.push(
          sql`(${productVariants.price})::numeric >= ${filters.priceMin}`,
        );
      if (filters.priceMax !== undefined)
        subConds.push(
          sql`(${productVariants.price})::numeric <= ${filters.priceMax}`,
        );
      if (subConds.length) priceBounds.push(and(...subConds)!);
    }
    if (priceBounds.length) {
      variantConds.push(or(...priceBounds)!);
    }
  }

  const baseWhere = conds.length ? and(...conds) : undefined;
  const variantWhere = variantConds.length ? and(...variantConds) : undefined;

  const page = Math.max(1, filters.page);
  const limit = Math.max(1, Math.min(filters.limit, 60));
  const offset = (page - 1) * limit;

  // Get primary image for each variant from productVariantImages table
  const imagesSubquery = db
    .select({
      variantId: productVariantImages.variantId,
      url: productVariantImages.imageUrl,
      rn: sql<number>`row_number() over (partition by ${productVariantImages.variantId} order by ${productVariantImages.isPrimary} desc)`.as(
        "rn",
      ),
    })
    .from(productVariantImages)
    .as("img");

  let orderByClause;
  if (filters.sort === "price_asc") {
    orderByClause = [
      asc(
        sql`COALESCE(${productVariants.salePrice}, ${productVariants.price})`,
      ),
      desc(products.createdAt),
      asc(productVariants.id),
    ];
  } else if (filters.sort === "price_desc") {
    orderByClause = [
      desc(
        sql`COALESCE(${productVariants.salePrice}, ${productVariants.price})`,
      ),
      desc(products.createdAt),
      asc(productVariants.id),
    ];
  } else {
    orderByClause = [desc(products.createdAt), asc(productVariants.id)];
  }

  const rows = await db
    .select({
      variantId: productVariants.id,
      productId: products.id,
      productName: products.name,
      sku: productVariants.sku,
      price: sql<number>`${productVariants.price}::numeric`,
      salePrice: sql<number | null>`${productVariants.salePrice}::numeric`,
      colorName: colors.name,
      sizeName: sizes.name,
      genderLabel: genders.label,
      createdAt: products.createdAt,
      imageUrl: sql<
        string | null
      >`MAX(CASE WHEN ${imagesSubquery.rn} = 1 THEN ${imagesSubquery.url} END)`,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(colors, eq(colors.id, productVariants.colorId))
    .leftJoin(sizes, eq(sizes.id, productVariants.sizeId))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(imagesSubquery, eq(imagesSubquery.variantId, productVariants.id))
    .where(and(baseWhere, variantWhere))
    .groupBy(
      productVariants.id,
      products.id,
      products.name,
      productVariants.sku,
      productVariants.price,
      productVariants.salePrice,
      colors.name,
      sizes.name,
      genders.label,
      products.createdAt,
    )
    .orderBy(...orderByClause)
    .limit(limit)
    .offset(offset);

  const countRows = await db
    .select({
      cnt: count(productVariants.id),
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(colors, eq(colors.id, productVariants.colorId))
    .leftJoin(sizes, eq(sizes.id, productVariants.sizeId))
    .where(and(baseWhere, variantWhere));

  const variantsOut: VariantListItem[] = rows.map((r) => ({
    id: r.variantId,
    productId: r.productId,
    productName: r.productName,
    sku: r.sku,
    imageUrl: r.imageUrl,
    price: Number(r.price),
    salePrice: r.salePrice !== null ? Number(r.salePrice) : null,
    colorName: r.colorName,
    sizeName: r.sizeName,
    createdAt: r.createdAt,
    subtitle: r.genderLabel ? `${r.genderLabel} Shoes` : null,
  }));

  const totalCount = countRows[0]?.cnt ?? 0;

  return { variants: variantsOut, totalCount };
}

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

export async function getProductsForAdmin(): Promise<ProductListItem[]> {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      createdAt: products.createdAt,
      subtitle: genders.label,
      minPrice: sql<number | null>`min(${productVariants.price})`,
      maxPrice: sql<number | null>`max(${productVariants.price})`,
    })
    .from(products)
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .groupBy(products.id, products.name, products.createdAt, genders.label)
    .orderBy(desc(products.createdAt), asc(products.id));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    imageUrl: null,
    minPrice: r.minPrice === null ? null : Number(r.minPrice),
    maxPrice: r.maxPrice === null ? null : Number(r.maxPrice),
    createdAt: r.createdAt,
    subtitle: r.subtitle ? `${r.subtitle} Shoes` : null,
  }));
}

export async function getLatestProducts(
  limit: number,
): Promise<ProductListItem[]> {
  const rows = await db
    .select({
      id: products.id,
      name: products.name,
      createdAt: products.createdAt,
      minPrice: sql<number | null>`min(${productVariants.price}::numeric)`,
      imageUrl: sql<
        string | null
      >`max(case when ${productImages.isPrimary} = true then ${productImages.url} else null end)`,
    })
    .from(products)
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .leftJoin(productImages, eq(productImages.productId, products.id))
    .where(eq(products.isPublished, true))
    .groupBy(products.id, products.name, products.createdAt)
    .orderBy(desc(products.createdAt), asc(products.id))
    .limit(limit);

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    imageUrl: r.imageUrl,
    minPrice: r.minPrice === null ? null : Number(r.minPrice),
    maxPrice: r.minPrice === null ? null : Number(r.minPrice),
    createdAt: r.createdAt,
  }));
}

export async function getLatestVariants(
  limit: number,
): Promise<VariantListItem[]> {
  const imagesSubquery = db
    .select({
      variantId: productVariantImages.variantId,
      url: productVariantImages.imageUrl,
      rn: sql<number>`row_number() over (partition by ${productVariantImages.variantId} order by ${productVariantImages.isPrimary} desc)`.as(
        "rn",
      ),
    })
    .from(productVariantImages)
    .as("img");

  const rows = await db
    .select({
      variantId: productVariants.id,
      productId: products.id,
      productName: products.name,
      sku: productVariants.sku,
      price: sql<number>`${productVariants.price}::numeric`,
      salePrice: sql<number | null>`${productVariants.salePrice}::numeric`,
      colorName: colors.name,
      sizeName: sizes.name,
      genderLabel: genders.label,
      createdAt: products.createdAt,
      imageUrl: sql<
        string | null
      >`MAX(CASE WHEN ${imagesSubquery.rn} = 1 THEN ${imagesSubquery.url} END)`,
    })
    .from(productVariants)
    .innerJoin(products, eq(products.id, productVariants.productId))
    .leftJoin(colors, eq(colors.id, productVariants.colorId))
    .leftJoin(sizes, eq(sizes.id, productVariants.sizeId))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .leftJoin(imagesSubquery, eq(imagesSubquery.variantId, productVariants.id))
    .where(eq(products.isPublished, true))
    .groupBy(
      productVariants.id,
      products.id,
      products.name,
      productVariants.sku,
      productVariants.price,
      productVariants.salePrice,
      colors.name,
      sizes.name,
      genders.label,
      products.createdAt,
    )
    .orderBy(desc(products.createdAt), asc(productVariants.id))
    .limit(limit);

  return rows.map((r) => ({
    id: r.variantId,
    productId: r.productId,
    productName: r.productName,
    sku: r.sku,
    imageUrl: r.imageUrl,
    price: Number(r.price),
    salePrice: r.salePrice !== null ? Number(r.salePrice) : null,
    colorName: r.colorName,
    sizeName: r.sizeName,
    createdAt: r.createdAt,
    subtitle: r.genderLabel ? `${r.genderLabel} Shoes` : null,
  }));
}

export type FullProduct = {
  product: SelectProduct & {
    brand?: SelectBrand | null;
    category?: SelectCategory | null;
    gender?: SelectGender | null;
  };
  variants: Array<
    SelectVariant & {
      color?: SelectColor | null;
      size?: SelectSize | null;
    }
  >;
  images: SelectProductImage[];
};

export async function getProduct(
  productId: string,
): Promise<FullProduct | null> {
  const rows = await db
    .select({
      productId: products.id,
      productName: products.name,
      productDescription: products.description,
      productBrandId: products.brandId,
      productCategoryId: products.categoryId,
      productGenderId: products.genderId,
      isPublished: products.isPublished,
      defaultVariantId: products.defaultVariantId,
      productCreatedAt: products.createdAt,
      productUpdatedAt: products.updatedAt,

      brandId: brands.id,
      brandName: brands.name,
      brandSlug: brands.slug,
      brandLogoUrl: brands.logoUrl,

      categoryId: categories.id,
      categoryName: categories.name,
      categorySlug: categories.slug,

      genderId: genders.id,
      genderLabel: genders.label,
      genderSlug: genders.slug,

      variantId: productVariants.id,
      variantSku: productVariants.sku,
      variantPrice: sql<number | null>`${productVariants.price}::numeric`,
      variantSalePrice: sql<
        number | null
      >`${productVariants.salePrice}::numeric`,
      variantColorId: productVariants.colorId,
      variantSizeId: productVariants.sizeId,
      variantInStock: productVariants.inStock,

      colorId: colors.id,
      colorName: colors.name,
      colorSlug: colors.slug,
      colorHex: colors.hexCode,

      sizeId: sizes.id,
      sizeName: sizes.name,
      sizeSlug: sizes.slug,
      sizeSortOrder: sizes.sortOrder,

      imageId: productVariantImages.id,
      imageUrl: productVariantImages.imageUrl,
      imageIsPrimary: productVariantImages.isPrimary,
      imageVariantId: productVariantImages.variantId,
    })
    .from(products)
    .leftJoin(brands, eq(brands.id, products.brandId))
    .leftJoin(categories, eq(categories.id, products.categoryId))
    .leftJoin(genders, eq(genders.id, products.genderId))
    .leftJoin(productVariants, eq(productVariants.productId, products.id))
    .leftJoin(colors, eq(colors.id, productVariants.colorId))
    .leftJoin(sizes, eq(sizes.id, productVariants.sizeId))
    .leftJoin(
      productVariantImages,
      eq(productVariantImages.variantId, productVariants.id),
    )
    .where(eq(products.id, productId));

  if (!rows.length) return null;

  const head = rows[0];

  const product: SelectProduct & {
    brand?: SelectBrand | null;
    category?: SelectCategory | null;
    gender?: SelectGender | null;
  } = {
    id: head.productId,
    name: head.productName,
    description: head.productDescription,
    brandId: head.productBrandId ?? null,
    categoryId: head.productCategoryId ?? null,
    genderId: head.productGenderId ?? null,
    isPublished: head.isPublished,
    defaultVariantId: head.defaultVariantId ?? null,
    createdAt: head.productCreatedAt,
    updatedAt: head.productUpdatedAt,
    brand: head.brandId
      ? {
          id: head.brandId,
          name: head.brandName!,
          slug: head.brandSlug!,
          logoUrl: head.brandLogoUrl ?? null,
        }
      : null,
    category: head.categoryId
      ? {
          id: head.categoryId,
          name: head.categoryName!,
          slug: head.categorySlug!,
          parentId: null,
        }
      : null,
    gender: head.genderId
      ? {
          id: head.genderId,
          label: head.genderLabel!,
          slug: head.genderSlug!,
        }
      : null,
  };

  const variantsMap = new Map<string, FullProduct["variants"][number]>();
  const imagesMap = new Map<string, SelectProductImage>();

  for (const r of rows) {
    if (r.variantId && !variantsMap.has(r.variantId)) {
      variantsMap.set(r.variantId, {
        id: r.variantId,
        productId: head.productId,
        sku: r.variantSku!,
        price: r.variantPrice !== null ? String(r.variantPrice) : "0",
        salePrice:
          r.variantSalePrice !== null ? String(r.variantSalePrice) : null,
        colorId: r.variantColorId!,
        sizeId: r.variantSizeId!,
        inStock: r.variantInStock!,
        weight: null,
        dimensions: null,
        createdAt: head.productCreatedAt,
        color: r.colorId
          ? {
              id: r.colorId,
              name: r.colorName!,
              slug: r.colorSlug!,
              hexCode: r.colorHex!,
            }
          : null,
        size: r.sizeId
          ? {
              id: r.sizeId,
              name: r.sizeName!,
              slug: r.sizeSlug!,
              sortOrder: r.sizeSortOrder!,
            }
          : null,
      });
    }
    if (r.imageId && !imagesMap.has(r.imageId)) {
      imagesMap.set(r.imageId, {
        id: r.imageId,
        productId: head.productId,
        variantId: r.imageVariantId ?? null,
        url: r.imageUrl!,
        sortOrder: 0,
        isPrimary: r.imageIsPrimary ?? false,
      });
    }
  }

  return {
    product,
    variants: Array.from(variantsMap.values()),
    images: Array.from(imagesMap.values()),
  };
}

export async function getProductByVariantId(
  variantId: string,
): Promise<FullProduct | null> {
  // First, get the product ID from the variant
  const variantRow = await db
    .select({ productId: productVariants.productId })
    .from(productVariants)
    .where(eq(productVariants.id, variantId))
    .limit(1);

  if (!variantRow.length) return null;

  // Then get the full product data using the product ID
  return getProduct(variantRow[0].productId);
}

export type Review = {
  id: string;
  author: string;
  rating: number;
  title?: string;
  content: string;
  createdAt: string;
};

export type RecommendedProduct = {
  id: string; // This will be the variant ID (defaultVariantId)
  productId: string;
  title: string;
  price: number | null;
  imageUrl: string;
};

export async function getProductReviews(productId: string): Promise<Review[]> {
  const rows = await db
    .select({
      id: reviews.id,
      rating: reviews.rating,
      comment: reviews.comment,
      createdAt: reviews.createdAt,
      authorName: users.name,
      authorEmail: users.email,
    })
    .from(reviews)
    .innerJoin(users, eq(users.id, reviews.userId))
    .where(eq(reviews.productId, productId))
    .orderBy(desc(reviews.createdAt))
    .limit(10);

  return rows.map((r) => ({
    id: r.id,
    author: r.authorName?.trim() || r.authorEmail || "Anonymous",
    rating: r.rating,
    title: undefined,
    content: r.comment || "",
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function getRecommendedProducts(
  productId: string,
): Promise<RecommendedProduct[]> {
  const base = await db
    .select({
      id: products.id,
      categoryId: products.categoryId,
      brandId: products.brandId,
      genderId: products.genderId,
    })
    .from(products)
    .where(eq(products.id, productId))
    .limit(1);

  if (!base.length) return [];
  const b = base[0];

  const v = db
    .select({
      productId: productVariants.productId,
      price: sql<number>`${productVariants.price}::numeric`.as("price"),
    })
    .from(productVariants)
    .as("v");

  const pi = db
    .select({
      variantId: productVariantImages.variantId,
      url: productVariantImages.imageUrl,
      rn: sql<number>`row_number() over (partition by ${productVariantImages.variantId} order by ${productVariantImages.isPrimary} desc)`.as(
        "rn",
      ),
    })
    .from(productVariantImages)
    .as("pi");

  const priority = sql<number>`
    (case when ${products.categoryId} is not null and ${products.categoryId} = ${b.categoryId} then 1 else 0 end) * 3 +
    (case when ${products.brandId} is not null and ${products.brandId} = ${b.brandId} then 1 else 0 end) * 2 +
    (case when ${products.genderId} is not null and ${products.genderId} = ${b.genderId} then 1 else 0 end) * 1
  `;

  const rows = await db
    .select({
      productId: products.id,
      defaultVariantId: products.defaultVariantId,
      title: products.name,
      minPrice: sql<number | null>`min(${v.price})`,
      imageUrl: sql<
        string | null
      >`max(case when ${pi.rn} = 1 and ${pi.variantId} = ${products.defaultVariantId} then ${pi.url} else null end)`,
      createdAt: products.createdAt,
    })
    .from(products)
    .leftJoin(v, eq(v.productId, products.id))
    .leftJoin(pi, eq(pi.variantId, products.defaultVariantId))
    .where(
      and(eq(products.isPublished, true), sql`${products.id} <> ${productId}`),
    )
    .groupBy(
      products.id,
      products.defaultVariantId,
      products.name,
      products.createdAt,
    )
    .orderBy(desc(priority), desc(products.createdAt), asc(products.id))
    .limit(8);

  const out: RecommendedProduct[] = [];
  for (const r of rows) {
    const img = r.imageUrl?.trim();
    if (!img || !r.defaultVariantId) continue;
    out.push({
      id: r.defaultVariantId,
      productId: r.productId,
      title: r.title,
      price: r.minPrice === null ? null : Number(r.minPrice),
      imageUrl: img,
    });
    if (out.length >= 6) break;
  }
  return out;
}
