"use client";

import { InsertVariant, insertVariantSchema } from "@/lib/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  getProducts,
  getProductImages,
  checkImagesExistForColor,
} from "../_actions/products";
import { getColors, getSizes } from "../_actions/filters";
import { addVariant, updateVariant } from "../_actions/variants";

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
  const [imagesExistForColor, setImagesExistForColor] =
    useState<boolean>(false);
  const [selectedProductName, setSelectedProductName] = useState<string>("");
  const [selectedColorName, setSelectedColorName] = useState<string>("");

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

  // Check if images exist for selected product + color
  useEffect(() => {
    const checkImages = async () => {
      const productId = watch("productId");
      const colorId = watch("colorId");

      // Update selected product name
      const selectedProduct = products.find((p) => p.id === productId);
      setSelectedProductName(selectedProduct?.name || "");

      // Update selected color name
      const selectedColor = colors.find((c) => c.id === colorId);
      setSelectedColorName(selectedColor?.name || "");

      if (productId && colorId) {
        try {
          const exists = await checkImagesExistForColor(productId, colorId);
          setImagesExistForColor(exists);
        } catch (error) {
          console.error("Failed to check product images:", error);
          setImagesExistForColor(false);
        }
      } else {
        setImagesExistForColor(false);
      }
    };
    checkImages();
  }, [watch("productId"), watch("colorId"), products, colors]);

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

  const onSubmit = async (data: InsertVariant) => {
    try {
      // Validate that images exist for this product+color combination
      if (!imagesExistForColor) {
        toast.error(
          `Please add images for ${selectedColorName || "this"} color in Product Listing first.`,
          { duration: 5000 }
        );
        return;
      }

      // Show loading toast
      const loadingToast = toast.loading(
        variant ? "Updating variant..." : "Creating variant..."
      );

      // Prepare variant data
      const variantData: InsertVariant = {
        ...data,
        salePrice: data.salePrice || null,
        weight: data.weight || null,
        dimensions: data.dimensions || null,
      };

      // Create or update variant
      if (variant) {
        await updateVariant(variant.id, variantData);
      } else {
        await addVariant(variantData);
      }

      toast.success(
        variant
          ? "Variant updated successfully"
          : "Variant created successfully",
        { id: loadingToast }
      );

      // Redirect to variants page
      setTimeout(() => {
        window.location.href = "/admin/variants";
      }, 500);
    } catch (error) {
      console.error("Failed to save variant:", error);
      toast.error(
        variant ? "Failed to update variant" : "Failed to create variant"
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

      {/* Image Validation Status */}
      {watch("productId") && watch("colorId") && (
        <div className="space-y-2">
          {imagesExistForColor ? (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-green-800">
                    Images Available
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Images exist for {selectedProductName} -{" "}
                    {selectedColorName}. You can create this variant.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-medium text-red-800">
                    Images Required
                  </p>
                  <p className="text-sm text-red-700 mt-1">
                    No images found for {selectedProductName} -{" "}
                    {selectedColorName}. Please add images in the Product
                    Listing form before creating this variant.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      (window.location.href = "/admin/products/listing/new")
                    }
                    className="mt-2 text-sm font-medium text-red-800 underline hover:text-red-900"
                  >
                    Go to Product Listing Form
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting || !imagesExistForColor}
          className="flex-1"
        >
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
