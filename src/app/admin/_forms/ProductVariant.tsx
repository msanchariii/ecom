"use client";

import { InsertVariant, insertVariantSchema } from "@/lib/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getProducts } from "../_actions/products";
import { getColors, getSizes } from "../_actions/filters";
import {
  addVariant,
  updateVariant,
  addVariantImages,
  getVariantImages,
  deleteVariantImages,
} from "../_actions/variants";
import VariantImageUpload from "@/components/VariantImageUpload";
import { uploadFileToS3 } from "@/lib/upload/client";

interface ProductVariantFormProps {
  variant?: {
    id: string;
    productId: string;
    sku: string;
    price: string;
    salePrice: string | null;
    costPrice: string | null;
    colorId: string;
    sizeId: string;
    inStock: number;
    lowStockThreshold: number;
    maxQuantityPerOrder: number;
    weight: number | null;
    dimensions: {
      length?: number;
      width?: number;
      height?: number;
    } | null;
  };
}

const ProductVariantForm = ({ variant }: ProductVariantFormProps) => {
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>(
    [],
  );
  const [colors, setColors] = useState<
    Array<{ id: string; name: string; hexCode: string }>
  >([]);
  const [sizes, setSizes] = useState<Array<{ id: string; name: string }>>([]);
  const [variantImages, setVariantImages] = useState<
    Array<{ file: File | null; url: string | null; isPrimary: boolean }>
  >([]);
  const [currentImages, setCurrentImages] = useState<
    Array<{ imageUrl: string; isPrimary: boolean }>
  >([]);
  const [imageError, setImageError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<InsertVariant>({
    resolver: zodResolver(insertVariantSchema),
    defaultValues: {
      productId: variant?.productId || "",
      sku: variant?.sku || "",
      price: variant?.price || "",
      salePrice: variant?.salePrice || null,
      colorId: variant?.colorId || "",
      sizeId: variant?.sizeId || "",
      inStock: variant?.inStock || 0,
      weight: variant?.weight || null,
      dimensions: variant?.dimensions || null,
    },
  });

  // Load existing images if editing
  useEffect(() => {
    const loadImages = async () => {
      if (variant?.id) {
        try {
          const images = await getVariantImages(variant.id);
          setCurrentImages(
            images.map((img) => ({
              imageUrl: img.imageUrl,
              isPrimary: img.isPrimary || false,
            })),
          );
        } catch (error) {
          console.error("Failed to load variant images:", error);
        }
      }
    };
    loadImages();
  }, [variant?.id]);

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, colorsData, sizesData] = await Promise.all([
          getProducts(),
          getColors(),
          getSizes(),
        ]);
        setProducts(productsData.map((p) => ({ id: p.id, name: p.name })));
        setColors(colorsData);
        setSizes(sizesData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load form data");
      }
    };
    fetchData();
  }, []);

  const handleImagesChange = (
    images: Array<{
      file: File | null;
      url: string | null;
      isPrimary: boolean;
    }>,
  ) => {
    setVariantImages(images);
    setImageError(null);
  };

  const onSubmit = async (data: InsertVariant) => {
    try {
      // Validate at least one image
      const hasAtLeastOneImage = variantImages.some(
        (img) => img.file !== null || img.url !== null,
      );

      if (!hasAtLeastOneImage) {
        setImageError("At least one image is required");
        toast.error("Please upload at least one image");
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading(
        variant ? "Updating variant..." : "Creating variant...",
      );

      // Prepare variant data
      const variantData: InsertVariant = {
        ...data,
        salePrice: data.salePrice || null,
        weight: data.weight || null,
        dimensions: data.dimensions || null,
      };

      let variantId: string;

      // Create or update variant
      if (variant) {
        const result = await updateVariant(variant.id, variantData);
        variantId = result.id;
      } else {
        const result = await addVariant(variantData);
        variantId = result.id;
      }

      // Upload new images if any
      const imagesToUpload = variantImages.filter((img) => img.file !== null);

      if (imagesToUpload.length > 0) {
        toast.loading("Uploading images...", { id: loadingToast });

        // Upload all images to S3
        const uploadPromises = imagesToUpload.map(async (img) => {
          if (!img.file) return null;
          const publicUrl = await uploadFileToS3(img.file);
          return {
            imageUrl: publicUrl,
            isPrimary: img.isPrimary,
          };
        });

        const uploadedImages = await Promise.all(uploadPromises);
        const validImages = uploadedImages.filter(
          (img) => img !== null,
        ) as Array<{ imageUrl: string; isPrimary: boolean }>;

        // Delete old images if updating
        if (variant) {
          await deleteVariantImages(variantId);
        }

        // Save image references to database
        await addVariantImages(variantId, validImages);
      } else if (variant && currentImages.length > 0) {
        // If editing and no new images, keep the existing images
        // (already in database, no action needed)
      }

      toast.success(
        variant
          ? "Variant updated successfully"
          : "Variant created successfully",
        { id: loadingToast },
      );

      // Redirect to variants page
      setTimeout(() => {
        window.location.href = "/admin/variants";
      }, 500);
    } catch (error) {
      console.error("Failed to save variant:", error);
      toast.error(
        variant ? "Failed to update variant" : "Failed to create variant",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Product Selection */}
      <div className="space-y-2">
        <label htmlFor="productId" className="block text-sm font-medium">
          Product <span className="text-red-500">*</span>
        </label>
        <select
          id="productId"
          {...register("productId")}
          className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
        >
          <option value="">Select a product</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>
              {product.name}
            </option>
          ))}
        </select>
        {errors.productId && (
          <p className="text-sm text-red-500">{errors.productId.message}</p>
        )}
      </div>

      {/* SKU and Price Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="sku" className="block text-sm font-medium">
            SKU <span className="text-red-500">*</span>
          </label>
          <Input
            id="sku"
            type="text"
            placeholder="e.g., SHOE-BLK-42"
            {...register("sku")}
            className={errors.sku ? "border-red-500" : ""}
          />
          {errors.sku && (
            <p className="text-sm text-red-500">{errors.sku.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="price" className="block text-sm font-medium">
            Price <span className="text-red-500">*</span>
          </label>
          <Input
            id="price"
            type="text"
            placeholder="99.99"
            {...register("price")}
            className={errors.price ? "border-red-500" : ""}
          />
          {errors.price && (
            <p className="text-sm text-red-500">{errors.price.message}</p>
          )}
        </div>
      </div>

      {/* Sale Price and Cost Price */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="salePrice" className="block text-sm font-medium">
            Sale Price (Optional)
          </label>
          <Input
            id="salePrice"
            type="text"
            placeholder="79.99"
            {...register("salePrice")}
          />
          {errors.salePrice && (
            <p className="text-sm text-red-500">{errors.salePrice.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="costPrice" className="block text-sm font-medium">
            Cost Price (Optional)
          </label>
          <Input
            id="costPrice"
            type="text"
            placeholder="50.00"
            {...register("costPrice")}
          />
        </div>
      </div>

      {/* Color and Size */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="colorId" className="block text-sm font-medium">
            Color <span className="text-red-500">*</span>
          </label>
          <div className="flex gap-2">
            <select
              id="colorId"
              {...register("colorId")}
              className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
            >
              <option value="">Select a color</option>
              {colors.map((color) => (
                <option key={color.id} value={color.id}>
                  {color.name}
                </option>
              ))}
            </select>
            {watch("colorId") && (
              <div
                className="w-10 h-10 rounded-md border border-gray-300"
                style={{
                  backgroundColor:
                    colors.find((c) => c.id === watch("colorId"))?.hexCode ||
                    "#fff",
                }}
              />
            )}
          </div>
          {errors.colorId && (
            <p className="text-sm text-red-500">{errors.colorId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="sizeId" className="block text-sm font-medium">
            Size <span className="text-red-500">*</span>
          </label>
          <select
            id="sizeId"
            {...register("sizeId")}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select a size</option>
            {sizes.map((size) => (
              <option key={size.id} value={size.id}>
                {size.name}
              </option>
            ))}
          </select>
          {errors.sizeId && (
            <p className="text-sm text-red-500">{errors.sizeId.message}</p>
          )}
        </div>
      </div>

      {/* Stock Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="inStock" className="block text-sm font-medium">
            In Stock <span className="text-red-500">*</span>
          </label>
          <Input
            id="inStock"
            type="number"
            placeholder="0"
            {...register("inStock", { valueAsNumber: true })}
            className={errors.inStock ? "border-red-500" : ""}
          />
          {errors.inStock && (
            <p className="text-sm text-red-500">{errors.inStock.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label
            htmlFor="lowStockThreshold"
            className="block text-sm font-medium"
          >
            Low Stock Threshold
          </label>
          <Input
            id="lowStockThreshold"
            type="number"
            placeholder="10"
            defaultValue={10}
            {...register("lowStockThreshold", { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="maxQuantityPerOrder"
            className="block text-sm font-medium"
          >
            Max Per Order
          </label>
          <Input
            id="maxQuantityPerOrder"
            type="number"
            placeholder="10"
            defaultValue={10}
            {...register("maxQuantityPerOrder", { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Weight */}
      <div className="space-y-2">
        <label htmlFor="weight" className="block text-sm font-medium">
          Weight (kg) - Optional
        </label>
        <Input
          id="weight"
          type="number"
          step="0.01"
          placeholder="0.5"
          {...register("weight", { valueAsNumber: true })}
        />
        {errors.weight && (
          <p className="text-sm text-red-500">{errors.weight.message}</p>
        )}
      </div>

      {/* Dimensions */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          Dimensions (cm) - Optional
        </label>
        <div className="grid grid-cols-3 gap-4">
          <Input
            type="number"
            step="0.1"
            placeholder="Length"
            {...register("dimensions.length", { valueAsNumber: true })}
          />
          <Input
            type="number"
            step="0.1"
            placeholder="Width"
            {...register("dimensions.width", { valueAsNumber: true })}
          />
          <Input
            type="number"
            step="0.1"
            placeholder="Height"
            {...register("dimensions.height", { valueAsNumber: true })}
          />
        </div>
      </div>

      {/* Image Upload */}
      <VariantImageUpload
        currentImages={currentImages}
        onImagesChange={handleImagesChange}
        error={imageError}
      />

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting
            ? variant
              ? "Updating..."
              : "Creating..."
            : variant
              ? "Update Variant"
              : "Create Variant"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/admin/variants")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ProductVariantForm;
