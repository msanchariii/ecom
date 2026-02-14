/**
 * Diagnostic script to check database data
 * Run with: npx tsx check-data.ts
 */

import { db } from "./src/lib/db";
import { products, productVariants, productImages } from "./src/lib/db/schema";
import { count, eq } from "drizzle-orm";

async function checkData() {
  console.log("🔍 Checking database data...\n");

  // Check products
  const productsCount = await db.select({ count: count() }).from(products);
  console.log(`📦 Total products: ${productsCount[0].count}`);

  const publishedCount = await db
    .select({ count: count() })
    .from(products)
    .where(eq(products.isPublished, true));
  console.log(`✅ Published products: ${publishedCount[0].count}`);

  // Check variants
  const variantsCount = await db
    .select({ count: count() })
    .from(productVariants);
  console.log(`\n🎨 Total variants: ${variantsCount[0].count}`);

  // Check images
  const imagesCount = await db.select({ count: count() }).from(productImages);
  console.log(`\n🖼️  Total images: ${imagesCount[0].count}`);

  // Get sample products
  const sampleProducts = await db
    .select({
      id: products.id,
      name: products.name,
      isPublished: products.isPublished,
      defaultVariantId: products.defaultVariantId,
    })
    .from(products)
    .limit(5);

  console.log("\n📋 Sample products:");
  sampleProducts.forEach((p) => {
    console.log(
      `  - ${p.name} | Published: ${p.isPublished} | Has default variant: ${!!p.defaultVariantId}`,
    );
  });

  // Get sample variants
  const sampleVariants = await db
    .select({
      id: productVariants.id,
      sku: productVariants.sku,
      productId: productVariants.productId,
      colorId: productVariants.colorId,
      sizeId: productVariants.sizeId,
    })
    .from(productVariants)
    .limit(5);

  console.log("\n🎯 Sample variants:");
  sampleVariants.forEach((v) => {
    console.log(
      `  - SKU: ${v.sku} | Product: ${v.productId.slice(0, 8)}... | Color: ${v.colorId ? "✅" : "❌"} | Size: ${v.sizeId ? "✅" : "❌"}`,
    );
  });

  console.log("\n✅ Check complete!");
  process.exit(0);
}

checkData().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
