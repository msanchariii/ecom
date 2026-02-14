/**
 * Product Detail Page
 *
 * Route: /products/[id]
 * The [id] parameter represents a VARIANT ID (not a product ID)
 *
 * This page displays the full product details including:
 * - All available variants (different color/size combinations)
 * - Variant-specific images from product_variant_images table
 * - Product gallery with color-based image switching
 *
 * When a user clicks on a product from the listing page, they navigate
 * to this page with a specific variant ID, which loads the product and
 * shows all its available SKUs/variants.
 */

import { notFound, redirect } from "next/navigation";
import { getProductDetails } from "@/lib/actions/product";
import Link from "next/link";
import Image from "next/image";
import CollapsibleSection from "@/components/CollapsibleSection";
import ProductGalleryWrapper from "./ProductGalleryWrapper";
import ColorSwatchesWrapper from "./ColorSwatchesWrapper";
import ProductActionsWrapper from "./ProductActionsWrapper";

function formatPrice(price: number | string | null | undefined) {
  if (price === null || price === undefined) return undefined;
  const numPrice = typeof price === "string" ? parseFloat(price) : price;
  return `$${numPrice.toFixed(2)}`;
}

const ProductDetailsPage = async ({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { color?: string };
}) => {
  const { id } = await params;
  const { color } = await searchParams;

  const data = await getProductDetails(id, color);
  console.log("Product details data:", data);
  if (!data || !data.product) {
    notFound();
  }

  // If no color was specified, redirect to the first available color
  if (!color && data.selectedColor) {
    redirect(`/products/${id}?color=${data.selectedColor.slug}`);
  }

  const { product, availableColors, selectedColor, sizes, images } = data;

  // Transform colors into gallery variants format for ColorSwatches
  const galleryVariants = availableColors.map((c) => ({
    id: c.id,
    color: c.name,
    images: c.id === selectedColor?.id ? images.map((img) => img.url) : [],
    slug: c.slug,
    hexCode: c.hexCode,
  }));

  // Find the selected color index
  const selectedColorIndex = availableColors.findIndex(
    (c) => c.id === selectedColor?.id,
  );

  // Calculate pricing
  const defaultSize = sizes[0];
  const basePrice = defaultSize ? Number(defaultSize.price) : null;
  const salePrice = defaultSize?.salePrice
    ? Number(defaultSize.salePrice)
    : null;
  const displayPrice =
    salePrice !== null && !Number.isNaN(salePrice) ? salePrice : basePrice;
  const compareAt =
    salePrice !== null && !Number.isNaN(salePrice) ? basePrice : null;
  const discount =
    compareAt && displayPrice && compareAt > displayPrice
      ? Math.round(((compareAt - displayPrice) / compareAt) * 100)
      : null;

  const subtitle = product.gender?.label
    ? `${product.gender.label} Shoes`
    : undefined;

  // Transform sizes into variant format for ProductActions
  const variants = sizes.map((size) => ({
    id: size.variantId,
    price: size.price,
    salePrice: size.salePrice,
    color: selectedColor,
    size: {
      id: size.id,
      name: size.name,
      slug: size.slug,
      sortOrder: size.sortOrder,
    },
    inStock: size.inStock,
    sku: size.sku,
  }));

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="py-4 text-caption text-dark-700">
        <Link href="/" className="hover:underline">
          Home
        </Link>{" "}
        /{" "}
        <Link href="/products" className="hover:underline">
          Products
        </Link>{" "}
        / <span className="text-dark-900">{product.name}</span>
      </nav>

      <section className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_480px]">
        {/* Product Gallery */}
        {images.length > 0 && (
          <ProductGalleryWrapper
            productId={id}
            images={images.map((img) => img.url)}
            colorName={selectedColor?.name || "Default"}
          />
        )}

        {/* Product Info */}
        <div className="flex flex-col gap-6">
          <header className="flex flex-col gap-2">
            <h1 className="text-heading-2 text-dark-900">{product.name}</h1>
            {subtitle && <p className="text-body text-dark-700">{subtitle}</p>}
          </header>

          {/* Pricing */}
          <div className="flex items-center gap-3">
            <p className="text-lead text-dark-900">
              {formatPrice(displayPrice)}
            </p>
            {compareAt && (
              <>
                <span className="text-body text-dark-700 line-through">
                  {formatPrice(compareAt)}
                </span>
                {discount !== null && (
                  <span className="rounded-full border border-light-300 px-2 py-1 text-caption text-green">
                    {discount}% off
                  </span>
                )}
              </>
            )}
          </div>

          {/* Color Swatches */}
          <div>
            <p className="mb-3 text-body-medium text-dark-900">Select Color</p>
            <ColorSwatchesWrapper
              productId={id}
              availableColors={galleryVariants}
              initialColorIndex={
                selectedColorIndex >= 0 ? selectedColorIndex : 0
              }
            />
          </div>

          {/* Product Actions (Size Selection + Add to Cart) */}
          <ProductActionsWrapper
            productId={id}
            productName={product.name}
            variants={variants}
            primaryImage={images[0]?.url}
          />

          {/* Product Details */}
          <CollapsibleSection title="Product Details" defaultOpen>
            <p>{product.description}</p>
          </CollapsibleSection>

          <CollapsibleSection title="Shipping & Returns">
            <p>
              Free standard shipping and free 30-day returns for Nike Members.
            </p>
          </CollapsibleSection>
        </div>
      </section>
    </main>
  );
};

export default ProductDetailsPage;

function NotFoundBlock() {
  return (
    <section className="mx-auto max-w-3xl rounded-xl border border-light-300 bg-light-100 p-8 text-center">
      <h1 className="text-heading-3 text-dark-900">Product not found</h1>
      <p className="mt-2 text-body text-dark-700">
        The product you’re looking for doesn’t exist or may have been removed.
      </p>
      <div className="mt-6">
        <Link
          href="/products"
          className="inline-block rounded-full bg-dark-900 px-6 py-3 text-body-medium text-light-100 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-dark-500"
        >
          Browse Products
        </Link>
      </div>
    </section>
  );
}
