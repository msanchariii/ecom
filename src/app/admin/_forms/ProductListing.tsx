"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { uploadFileToS3 } from "@/lib/upload/client";
import {
  getProducts,
  getProductImages,
  addProductImages,
  deleteProductImages,
} from "../_actions/products";
import { getColors } from "../_actions/filters";

type Product = {
  id: string;
  name: string;
};

type Color = {
  id: string;
  name: string;
  hexCode: string;
};

type ImageSlot = {
  id?: string;
  file: File | null;
  url: string | null;
  isPrimary: boolean;
};

const productListingSchema = z.object({
  productId: z.string().min(1, "Product is required"),
  colorId: z.string().min(1, "Color is required"),
});

type ProductListingFormValues = z.infer<typeof productListingSchema>;

export const ProductListingForm = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [colors, setColors] = useState<Color[]>([]);
  const [images, setImages] = useState<ImageSlot[]>([
    { file: null, url: null, isPrimary: true },
    { file: null, url: null, isPrimary: false },
    { file: null, url: null, isPrimary: false },
    { file: null, url: null, isPrimary: false },
  ]);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ProductListingFormValues>({
    resolver: zodResolver(productListingSchema),
    defaultValues: {
      productId: "",
      colorId: "",
    },
  });

  const selectedProductId = watch("productId");
  const selectedColorId = watch("colorId");

  // Fetch products and colors
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsData, colorsData] = await Promise.all([
          getProducts(),
          getColors(),
        ]);
        setProducts(productsData.map((p: any) => ({ id: p.id, name: p.name })));
        setColors(colorsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load form data");
      }
    };
    fetchData();
  }, []);

  // Load existing images when product and color are selected
  useEffect(() => {
    const loadExistingImages = async () => {
      if (selectedProductId && selectedColorId) {
        try {
          const existingImages = await getProductImages(
            selectedProductId,
            selectedColorId,
          );

          if (existingImages.length > 0) {
            const loadedImages: ImageSlot[] = [
              { file: null, url: null, isPrimary: true },
              { file: null, url: null, isPrimary: false },
              { file: null, url: null, isPrimary: false },
              { file: null, url: null, isPrimary: false },
            ];

            existingImages.forEach((img, idx) => {
              if (idx < 4) {
                loadedImages[idx] = {
                  id: img.id,
                  file: null,
                  url: img.url,
                  isPrimary: img.isPrimary,
                };
              }
            });

            setImages(loadedImages);
          } else {
            // Reset to empty slots
            setImages([
              { file: null, url: null, isPrimary: true },
              { file: null, url: null, isPrimary: false },
              { file: null, url: null, isPrimary: false },
              { file: null, url: null, isPrimary: false },
            ]);
          }
        } catch (error) {
          console.error("Failed to load images:", error);
        }
      }
    };
    loadExistingImages();
  }, [selectedProductId, selectedColorId]);

  const handleImageChange = (index: number, file: File | null) => {
    const newImages = [...images];
    if (file) {
      const url = URL.createObjectURL(file);
      newImages[index] = {
        ...newImages[index],
        file,
        url,
      };
    } else {
      newImages[index] = {
        file: null,
        url: null,
        isPrimary: index === 0,
      };
    }
    setImages(newImages);
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...images];
    newImages[index] = {
      file: null,
      url: null,
      isPrimary: index === 0,
    };
    setImages(newImages);
  };

  const onSubmit = async (data: ProductListingFormValues) => {
    const hasFirstImage = images[0]?.file !== null || images[0]?.url !== null;
    if (!hasFirstImage) {
      toast.error("First image is required (Primary image)");
      return;
    }

    try {
      const loadingToast = toast.loading("Uploading images...");

      // Filter images that have files to upload
      const imagesToUpload = images.filter((img) => img.file !== null);

      if (imagesToUpload.length > 0) {
        // Upload to S3
        const uploadPromises = imagesToUpload.map(async (img, idx) => {
          if (!img.file) return null;
          const publicUrl = await uploadFileToS3(img.file);
          return {
            url: publicUrl,
            isPrimary: img.isPrimary,
            sortOrder: images.indexOf(img),
          };
        });

        const uploadedImages = await Promise.all(uploadPromises);
        const validImages = uploadedImages.filter(
          (img) => img !== null,
        ) as Array<{ url: string; isPrimary: boolean; sortOrder: number }>;

        // Delete old images for this product+color
        await deleteProductImages(data.productId, data.colorId);

        // Save new images to database
        await addProductImages(data.productId, data.colorId, validImages);

        toast.success("Images uploaded successfully", { id: loadingToast });

        // Redirect back to products
        setTimeout(() => {
          window.location.href = "/admin/products";
        }, 500);
      } else {
        toast.error("No images to upload");
      }
    } catch (error) {
      console.error("Failed to upload images:", error);
      toast.error("Failed to upload images");
    }
  };

  const selectedProduct = products.find((p) => p.id === selectedProductId);
  const selectedColor = colors.find((c) => c.id === selectedColorId);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Product Selection */}
      <div className="bg-white rounded-lg border p-6 space-y-4">
        <h3 className="text-lg font-semibold">Select Product & Color</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {selectedColorId && (
                <div
                  className="w-10 h-10 rounded-md border border-gray-300"
                  style={{
                    backgroundColor:
                      colors.find((c) => c.id === selectedColorId)?.hexCode ||
                      "#fff",
                  }}
                />
              )}
            </div>
            {errors.colorId && (
              <p className="text-sm text-red-500">{errors.colorId.message}</p>
            )}
          </div>
        </div>

        {selectedProductId && selectedColorId && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              📸 Adding images for: <strong>{selectedProduct?.name}</strong> -{" "}
              <strong>{selectedColor?.name}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Images Upload Section */}
      {selectedProductId && selectedColorId && (
        <div className="bg-white rounded-lg border p-6 space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Product Images</h3>
            <p className="text-sm text-gray-500 mt-1">
              Upload up to 4 images. First image is required and will be the
              primary image.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {images.map((image, idx) => (
              <div key={idx} className="space-y-2">
                <div className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors">
                  {image.url ? (
                    <>
                      <img
                        src={image.url}
                        alt={`Image ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                      >
                        <X size={16} />
                      </button>
                      {image.isPrimary && (
                        <div className="absolute top-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs font-medium rounded">
                          Primary
                        </div>
                      )}
                    </>
                  ) : (
                    <label className="flex flex-col items-center justify-center h-full cursor-pointer">
                      <Upload size={24} className="text-gray-400 mb-2" />
                      <span className="text-xs text-gray-500 text-center px-2">
                        {idx === 0 ? "Required *" : "Optional"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handleImageChange(idx, e.target.files?.[0] || null)
                        }
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
                <p className="text-xs text-center text-gray-500">
                  Image {idx + 1}
                  {idx === 0 && " (Primary)"}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submit Button */}
      <div className="flex gap-4">
        <Button
          type="submit"
          disabled={isSubmitting || !selectedProductId || !selectedColorId}
          className="flex-1"
        >
          {isSubmitting ? "Uploading..." : "Save Images"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/admin/products")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
};

export default ProductListingForm;
