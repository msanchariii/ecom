"use client";

import { ShoppingBag, Heart } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useVariantStore } from "@/store/variant";
import { useState } from "react";

type Variant = {
  id: string;
  price: string;
  salePrice: string | null | undefined;
  color: { name: string; hex: string } | null;
  size: { name: string; slug: string; sortOrder?: number } | null;
  inStock: number;
};

type ProductActionsProps = {
  productId: string;
  productName: string;
  variants: Variant[];
  defaultVariantId?: string | null;
  primaryImage?: string;
};

export default function ProductActions({
  productId,
  productName,
  variants,
  defaultVariantId,
  primaryImage,
}: ProductActionsProps) {
  const { addItem } = useCartStore();
  const { getSelected } = useVariantStore();
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showMessage, setShowMessage] = useState(false);

  const selectedVariantIndex = getSelected(productId, 0);
  const selectedVariant = variants[selectedVariantIndex] || variants[0];

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    if (!selectedSize) {
      setShowMessage(true);
      setTimeout(() => setShowMessage(false), 3000);
      return;
    }

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

  const uniqueSizes = Array.from(
    new Set(variants.filter((v) => v.inStock > 0).map((v) => v.size?.name)),
  ).filter(Boolean);

  return (
    <div className="flex flex-col gap-3">
      {/* Size Selection */}
      {uniqueSizes.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-body-medium text-dark-900">Select Size</p>
            {selectedSize && (
              <p className="text-caption text-dark-600">Size {selectedSize}</p>
            )}
          </div>
          <div className="grid grid-cols-5 gap-2">
            {uniqueSizes.map((size) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size!)}
                className={`rounded-lg border px-3 py-2 text-body transition-colors ${
                  selectedSize === size
                    ? "border-dark-900 bg-dark-900 text-light-100"
                    : "border-light-300 bg-light-100 text-dark-900 hover:border-dark-500"
                }`}
              >
                {size}
              </button>
            ))}
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
