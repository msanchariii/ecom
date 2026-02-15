"use client";

import { useRouter } from "next/navigation";
import { Check } from "lucide-react";

type ColorVariant = {
  id: string;
  color: string;
  slug: string;
  hexCode: string;
  images: string[];
};

interface ColorSwatchesWrapperProps {
  productId: string;
  availableColors: ColorVariant[];
  initialColorIndex: number;
}

export default function ColorSwatchesWrapper({
  productId,
  availableColors,
  initialColorIndex,
}: ColorSwatchesWrapperProps) {
  const router = useRouter();

  const handleColorClick = (slug: string) => {
    router.push(`/products/${productId}?color=${slug}`);
  };

  return (
    <div
      className="flex flex-wrap gap-3"
      role="listbox"
      aria-label="Choose color"
    >
      {availableColors.map((variant, index) => {
        const isActive = index === initialColorIndex;
        return (
          <button
            key={variant.id}
            onClick={() => handleColorClick(variant.slug)}
            aria-label={`Color ${variant.color}`}
            aria-selected={isActive}
            role="option"
            className={`relative h-12 w-12 overflow-hidden rounded-full ring-2 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-[--color-dark-500] ${
              isActive
                ? "ring-[--color-dark-900]"
                : "ring-light-300 hover:ring-dark-500"
            }`}
            style={{ backgroundColor: variant.hexCode }}
          >
            {isActive && (
              <span className="absolute inset-0 flex items-center justify-center">
                <Check className="h-5 w-5 text-white drop-shadow-md" />
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
