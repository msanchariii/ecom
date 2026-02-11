import {
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  numeric,
  jsonb,
  real,
  boolean,
} from "drizzle-orm/pg-core";
import { is, relations } from "drizzle-orm";
import { z } from "zod";
import { products } from "./products";
import { colors } from "./filters/colors";
import { sizes } from "./filters/sizes";
import { productImages } from "./images";
import { orderItems } from "./orders";
import { cartItems } from "./carts";

export const productVariants = pgTable("product_variants", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  sku: text("sku").notNull().unique(),
  price: numeric("price", { precision: 10, scale: 2 }).notNull(),
  salePrice: numeric("sale_price", { precision: 10, scale: 2 }),
  costPrice: numeric("cost_price", { precision: 10, scale: 2 }),
  colorId: uuid("color_id")
    .references(() => colors.id, { onDelete: "restrict" })
    .notNull(),
  sizeId: uuid("size_id")
    .references(() => sizes.id, { onDelete: "restrict" })
    .notNull(),
  inStock: integer("in_stock").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").notNull().default(10), // only x left in stock, show low stock warning
  maxQuantityPerOrder: integer("max_quantity_per_order").notNull().default(10), // max quantity allowed per order
  isActive: boolean("is_active").default(true), // 1 = active, 0 = inactive (soft delete)
  weight: real("weight"),
  dimensions: jsonb("dimensions"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isDeleted: boolean("is_deleted").default(false), // soft delete flag
});

export const productVariantImages = pgTable("product_variant_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  variantId: uuid("variant_id").references(() => productVariants.id, {
    onDelete: "cascade",
  }), // !should not be null, but for existing records we can set default value
  imageUrl: text("image_url").notNull(),
  isPrimary: boolean("is_primary").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productVariantsRelations = relations(
  productVariants,
  ({ one, many }) => ({
    product: one(products, {
      fields: [productVariants.productId],
      references: [products.id],
    }),
    color: one(colors, {
      fields: [productVariants.colorId],
      references: [colors.id],
    }),
    size: one(sizes, {
      fields: [productVariants.sizeId],
      references: [sizes.id],
    }),
    images: many(productImages),
    orderItems: many(orderItems),
    cartItems: many(cartItems),
  }),
);

export const insertVariantSchema = z.object({
  productId: z.uuid(),
  sku: z.string().min(1),
  price: z.string(),
  salePrice: z.string().optional().nullable(),
  costPrice: z.string().optional().nullable(),
  colorId: z.uuid(),
  sizeId: z.uuid(),
  inStock: z.number().int().nonnegative().optional(),
  lowStockThreshold: z.number().int().nonnegative().optional(),
  maxQuantityPerOrder: z.number().int().positive().optional(),
  weight: z.number().optional().nullable(),
  dimensions: z
    .object({
      length: z.number(),
      width: z.number(),
      height: z.number(),
    })
    .partial()
    .optional()
    .nullable(),
  createdAt: z.date().optional(),
});
export const selectVariantSchema = insertVariantSchema.extend({
  id: z.uuid(),
});
export type InsertVariant = z.infer<typeof insertVariantSchema>;
export type SelectVariant = z.infer<typeof selectVariantSchema>;
