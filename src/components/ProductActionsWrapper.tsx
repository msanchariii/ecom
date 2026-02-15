"use client";

import { ShoppingBag, Heart } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useState } from "react";

type Variant = {
  id: string;
  price: string;
  salePrice?: string | null | undefined;
  color?:
    | { name: string; slug: string; hexCode: string; id: string }
    | null
    | undefined;
  size?:
    | { name: string; slug: string; sortOrder?: number; id: string }
    | null
    | undefined;
  inStock?: number | undefined;
  sku?: string | undefined;
};

type ProductActionsWrapperProps = {
  productId: string;
  productName: string;
  variants: Variant[];
  primaryImage?: string;
};

export default function ProductActionsWrapper({
  productId,
  productName,
  variants,
  primaryImage,
}: ProductActionsWrapperProps) {
  const { addItem } = useCartStore();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState(false);

  const handleAddToCart = () => {
    if (!selectedSize) {
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

    // Find the variant matching the selected size
    const selectedVariant = variants.find((v) => v.size?.name === selectedSize);
    if (!selectedVariant) return;

    const price = selectedVariant.salePrice
      ? Number(selectedVariant.salePrice)
      : Number(selectedVariant.price);

    addItem({
      id: selectedVariant.id,
      productId,
      name: productName,
      price,
      image: primaryImage,
      color: selectedVariant.color?.name,
      size: selectedSize,
    });

    setShowMessage(true);
    setTimeout(() => setShowMessage(false), 3000);
  };

  // Get unique sizes that are in stock
  const availableSizes = variants
    .filter((v) => (v.inStock ?? 0) > 0)
    .map((v) => v.size?.name)
    .filter((name, index, self) => name && self.indexOf(name) === index);

  return (
    <div className="flex flex-col gap-4">
      {/* Size Selection */}
      {availableSizes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-body-medium text-dark-900">Select Size</p>
            {selectedSize && (
              <p className="text-caption text-dark-600">Size {selectedSize}</p>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {availableSizes.map((size) => {
              const variant = variants.find((v) => v.size?.name === size);
              const isLowStock =
                variant &&
                variant.inStock &&
                variant.inStock > 0 &&
                variant.inStock <= 5;

              return (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size!)}
                  className={`relative rounded-lg border px-3 py-2 text-body transition-colors ${
                    selectedSize === size
                      ? "border-dark-900 bg-dark-900 text-light-100"
                      : "border-light-300 bg-light-100 text-dark-900 hover:border-dark-500"
                  }`}
                >
                  {size}
                  {isLowStock && (
                    <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-orange-500" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {showMessage && (
        <div
          className={`rounded-lg border px-4 py-2 text-body ${
            selectedSize
              ? "border-green-300 bg-green-50 text-green-800"
              : "border-red-300 bg-red-50 text-red-800"
          }`}
        >
          {selectedSize ? "✓ Added to cart!" : "⚠ Please select a size"}
        </div>
      )}

      <button
        onClick={handleAddToCart}
        className="flex items-center justify-center gap-2 rounded-full bg-dark-900 px-6 py-4 text-body-medium text-light-100 transition hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]"
      >
        <ShoppingBag className="h-5 w-5" />
        Add to Bag
      </button>
      <button className="flex items-center justify-center gap-2 rounded-full border border-light-300 px-6 py-4 text-body-medium text-dark-900 transition hover:border-dark-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500]">
        <Heart className="h-5 w-5" />
        Favorite
      </button>
    </div>
  );
}
