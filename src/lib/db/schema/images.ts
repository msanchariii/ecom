import {
  pgTable,
  text,
  uuid,
  integer,
  boolean,
  timestamp,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { z } from "zod";
import { products } from "./products";
import { colors } from "./filters/colors";

export const productImages = pgTable("product_images", {
  id: uuid("id").primaryKey().defaultRandom(),
  productId: uuid("product_id")
    .references(() => products.id, { onDelete: "cascade" })
    .notNull(),
  colorId: uuid("color_id").references(() => colors.id, {
    onDelete: "cascade",
  }), // default colorId for products without color variants
  url: text("url").notNull(),
  sortOrder: integer("sort_order").notNull().default(0),
  isPrimary: boolean("is_primary").notNull().default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const productImagesRelations = relations(productImages, ({ one }) => ({
  product: one(products, {
    fields: [productImages.productId],
    references: [products.id],
  }),
  color: one(colors, {
    fields: [productImages.colorId],
    references: [colors.id],
  }),
}));

export const insertProductImageSchema = z.object({
  productId: z.uuid(),
  colorId: z.uuid(),
  url: z.string().min(1),
  sortOrder: z.number().int().optional(),
  isPrimary: z.boolean().optional(),
});
export const selectProductImageSchema = insertProductImageSchema.extend({
  id: z.uuid(),
  createdAt: z.date(),
});
export type InsertProductImage = z.infer<typeof insertProductImageSchema>;
export type SelectProductImage = z.infer<typeof selectProductImageSchema>;
