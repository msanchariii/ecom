"use client";

import { useState, useEffect } from "react";
import { Upload, X, ImageIcon, Star } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface VariantImageUploadProps {
  /** Current images (for edit mode) */
  currentImages?: Array<{ imageUrl: string; isPrimary: boolean }>;
  /** Callback when images change */
  onImagesChange: (
    files: Array<{ file: File | null; url: string | null; isPrimary: boolean }>,
  ) => void;
  /** Error message to display */
  error?: string | null;
}

/**
 * Multi-Image Upload Component for Product Variants
 * Supports 4 images: 1 required (primary), 3 optional
 */
export default function VariantImageUpload({
  currentImages = [],
  onImagesChange,
  error = null,
}: VariantImageUploadProps) {
  const MAX_IMAGES = 4;

  // Initialize with 4 slots
  const [imageSlots, setImageSlots] = useState<
    Array<{
      id: number;
      file: File | null;
      previewUrl: string | null;
      isPrimary: boolean;
    }>
  >([
    { id: 0, file: null, previewUrl: null, isPrimary: true },
    { id: 1, file: null, previewUrl: null, isPrimary: false },
    { id: 2, file: null, previewUrl: null, isPrimary: false },
    { id: 3, file: null, previewUrl: null, isPrimary: false },
  ]);

  // Load current images on mount
  useEffect(() => {
    if (currentImages.length > 0) {
      setImageSlots((prev) =>
        prev.map((slot, index) => {
          if (index < currentImages.length) {
            return {
              ...slot,
              previewUrl: currentImages[index].imageUrl,
              isPrimary: currentImages[index].isPrimary,
            };
          }
          return slot;
        }),
      );
    }
  }, []); // Only run on mount

  // Cleanup preview URLs on unmount
  useEffect(() => {
    return () => {
      imageSlots.forEach((slot) => {
        if (slot.previewUrl && !slot.previewUrl.startsWith("http")) {
          URL.revokeObjectURL(slot.previewUrl);
        }
      });
    };
  }, []);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    slotId: number,
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Cleanup old preview URL if it exists
    const oldSlot = imageSlots.find((s) => s.id === slotId);
    if (oldSlot?.previewUrl && !oldSlot.previewUrl.startsWith("http")) {
      URL.revokeObjectURL(oldSlot.previewUrl);
    }

    // Create new preview URL
    const objectUrl = URL.createObjectURL(file);

    // Update the specific slot
    const updatedSlots = imageSlots.map((slot) =>
      slot.id === slotId ? { ...slot, file, previewUrl: objectUrl } : slot,
    );

    setImageSlots(updatedSlots);
    notifyParent(updatedSlots);
  };

  const handleRemoveImage = (slotId: number) => {
    const slot = imageSlots.find((s) => s.id === slotId);

    // Cleanup preview URL
    if (slot?.previewUrl && !slot.previewUrl.startsWith("http")) {
      URL.revokeObjectURL(slot.previewUrl);
    }

    // Reset the slot but keep isPrimary status for slot 0
    const updatedSlots = imageSlots.map((s) =>
      s.id === slotId ? { ...s, file: null, previewUrl: null } : s,
    );

    setImageSlots(updatedSlots);
    notifyParent(updatedSlots);
  };

  const handleSetPrimary = (slotId: number) => {
    const updatedSlots = imageSlots.map((slot) => ({
      ...slot,
      isPrimary: slot.id === slotId,
    }));

    setImageSlots(updatedSlots);
    notifyParent(updatedSlots);
  };

  const notifyParent = (slots: typeof imageSlots) => {
    const images = slots.map((slot) => ({
      file: slot.file,
      url: slot.previewUrl,
      isPrimary: slot.isPrimary,
    }));
    onImagesChange(images);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <label className="block text-sm font-medium">
            Product Variant Images{" "}
            <span className="text-red-500">* (at least 1 required)</span>
          </label>
          <p className="text-xs text-muted-foreground mt-1">
            Upload up to 4 images. Click the star to set primary image.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {imageSlots.map((slot, index) => (
          <div key={slot.id} className="space-y-2">
            <div
              className={`relative aspect-square border-2 border-dashed rounded-lg overflow-hidden ${
                slot.previewUrl
                  ? "border-primary"
                  : "border-gray-300 hover:border-gray-400"
              } ${slot.isPrimary ? "ring-2 ring-yellow-400" : ""}`}
            >
              {slot.previewUrl ? (
                <>
                  <img
                    src={slot.previewUrl}
                    alt={`Variant image ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => handleSetPrimary(slot.id)}
                      className={`p-1.5 rounded-full shadow-lg transition-colors ${
                        slot.isPrimary
                          ? "bg-yellow-400 text-white"
                          : "bg-white text-gray-600 hover:bg-yellow-100"
                      }`}
                      title="Set as primary image"
                    >
                      <Star
                        className="w-4 h-4"
                        fill={slot.isPrimary ? "currentColor" : "none"}
                      />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(slot.id)}
                      className="p-1.5 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg transition-colors"
                      title="Remove image"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  {slot.isPrimary && (
                    <div className="absolute bottom-2 left-2 bg-yellow-400 text-white text-xs px-2 py-1 rounded-md font-medium">
                      Primary
                    </div>
                  )}
                </>
              ) : (
                <label
                  htmlFor={`image-upload-${slot.id}`}
                  className="flex flex-col items-center justify-center w-full h-full cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  <ImageIcon className="w-8 h-8 text-gray-400 mb-2" />
                  <span className="text-xs text-gray-500 text-center px-2">
                    {index === 0 ? "Primary Image*" : `Image ${index + 1}`}
                  </span>
                  <input
                    id={`image-upload-${slot.id}`}
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, slot.id)}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            <p className="text-xs text-center text-gray-500">
              {index === 0 ? "Required" : "Optional"}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
        <p className="text-xs text-blue-800">
          💡 <strong>Tip:</strong> First image is set as primary by default. You
          can change it by clicking the star icon on any image.
        </p>
      </div>
    </div>
  );
}
