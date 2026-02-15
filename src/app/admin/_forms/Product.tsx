"use client";
import { InsertProduct, insertProductSchema } from "@/lib/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { toast } from "sonner";
import { Upload, X, Plus, Edit2 } from "lucide-react";
import { uploadFileToS3 } from "@/lib/upload/client";
import {
  addProduct,
  updateProduct,
  getProductImages,
  addProductImages,
  deleteProductImages,
} from "../_actions/products";
import { getCategories } from "../_actions/categories";
import { getGenders, getColors } from "../_actions/filters";
import { getBrands } from "../_actions/brands";
import {
  getCollections,
  getCollectionsForProduct,
  updateProductCollections,
} from "../_actions/collection";
import Image from "next/image";

type ImageSlot = {
  id?: string;
  file: File | null;
  url: string | null;
  isPrimary: boolean;
};

type ColorImages = {
  [colorId: string]: ImageSlot[];
};

interface ProductFormProps {
  product?: {
    id: string;
    name: string;
    description: string;
    categoryId: string | null;
    genderId: string | null;
    brandId: string | null;
    isPublished: boolean;
    defaultVariantId: string | null;
  };
}

const ProductForm = ({ product }: ProductFormProps) => {
  const editSectionRef = useRef<HTMLDivElement>(null);
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [genders, setGenders] = useState<Array<{ id: string; label: string }>>(
    [],
  );
  const [brands, setBrands] = useState<Array<{ id: string; name: string }>>([]);
  const [collections, setCollections] = useState<
    Array<{ id: string; name: string }>
  >([]);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [colors, setColors] = useState<
    Array<{ id: string; name: string; hexCode: string }>
  >([]);
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [colorImages, setColorImages] = useState<ColorImages>({});

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<InsertProduct>({
    resolver: zodResolver(insertProductSchema),
    defaultValues: {
      name: product?.name || "",
      description: product?.description || "",
      categoryId: product?.categoryId || null,
      genderId: product?.genderId || null,
      brandId: product?.brandId || null,
      isPublished: product?.isPublished || false,
    },
  });

  // Fetch dropdown data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          categoriesData,
          gendersData,
          brandsData,
          collectionsData,
          colorsData,
        ] = await Promise.all([
          getCategories(),
          getGenders(),
          getBrands(),
          getCollections(),
          getColors(),
        ]);
        setCategories(categoriesData);
        setGenders(gendersData);
        setBrands(brandsData);
        setCollections(collectionsData);
        setColors(colorsData);
      } catch (error) {
        console.error("Failed to fetch data:", error);
        toast.error("Failed to load form data");
      }
    };
    fetchData();
  }, []);

  // Load collections for product if editing
  useEffect(() => {
    const loadProductCollections = async () => {
      if (product?.id) {
        try {
          const productCollections = await getCollectionsForProduct(product.id);
          setSelectedCollections(productCollections.map((c) => c.id));
        } catch (error) {
          console.error("Failed to load product collections:", error);
        }
      }
    };
    loadProductCollections();
  }, [product?.id]);

  // Initialize empty image slots for selected color
  useEffect(() => {
    if (selectedColor && !colorImages[selectedColor]) {
      setColorImages((prev) => ({
        ...prev,
        [selectedColor]: [
          { file: null, url: null, isPrimary: true },
          { file: null, url: null, isPrimary: false },
          { file: null, url: null, isPrimary: false },
          { file: null, url: null, isPrimary: false },
        ],
      }));
    }
  }, [selectedColor]);

  // Load existing images for all colors when editing
  useEffect(() => {
    const loadAllColorImages = async () => {
      if (product?.id && colors.length > 0) {
        try {
          const allImages: ColorImages = {};
          for (const color of colors) {
            const existingImages = await getProductImages(product.id, color.id);
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

              allImages[color.id] = loadedImages;
            }
          }
          if (Object.keys(allImages).length > 0) {
            setColorImages(allImages);
          }
        } catch (error) {
          console.error("Failed to load product images:", error);
        }
      }
    };
    loadAllColorImages();
  }, [product?.id, colors]);

  const handleImageChange = (
    colorId: string,
    index: number,
    file: File | null,
  ) => {
    const colorImagesArray = colorImages[colorId] || [
      { file: null, url: null, isPrimary: true },
      { file: null, url: null, isPrimary: false },
      { file: null, url: null, isPrimary: false },
      { file: null, url: null, isPrimary: false },
    ];

    const newImages = [...colorImagesArray];
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

    setColorImages((prev) => ({
      ...prev,
      [colorId]: newImages,
    }));
  };

  const handleRemoveImage = (colorId: string, index: number) => {
    const colorImagesArray = colorImages[colorId] || [];
    const newImages = [...colorImagesArray];
    newImages[index] = {
      file: null,
      url: null,
      isPrimary: index === 0,
    };

    setColorImages((prev) => ({
      ...prev,
      [colorId]: newImages,
    }));
  };

  const onSubmit = async (data: InsertProduct) => {
    try {
      // Convert empty strings to null for optional fields
      const payload = {
        ...data,
        categoryId: data.categoryId || null,
        genderId: data.genderId || null,
        brandId: data.brandId || null,
      };

      let productId: string;
      if (product) {
        const result = await updateProduct(product.id, payload);
        productId = result.id;
        toast.success("Product updated successfully");
      } else {
        const result = await addProduct(payload);
        productId = result.id;
        toast.success("Product added successfully");
      }

      // Update product collections
      await updateProductCollections(productId, selectedCollections);

      // Upload and save images for each color
      const colorIds = Object.keys(colorImages);
      if (colorIds.length > 0) {
        const loadingToast = toast.loading("Uploading images...");

        for (const colorId of colorIds) {
          const images = colorImages[colorId];
          const imagesToUpload = images.filter(
            (img) => img.file !== null || img.url !== null,
          );

          if (imagesToUpload.length > 0) {
            // Upload new images to S3
            const uploadPromises = imagesToUpload.map(async (img, idx) => {
              if (img.file) {
                const publicUrl = await uploadFileToS3(img.file);
                return {
                  url: publicUrl,
                  isPrimary: img.isPrimary,
                  sortOrder: images.indexOf(img),
                };
              } else if (img.url) {
                // Keep existing image
                return {
                  url: img.url,
                  isPrimary: img.isPrimary,
                  sortOrder: images.indexOf(img),
                };
              }
              return null;
            });

            const uploadedImages = await Promise.all(uploadPromises);
            const validImages = uploadedImages.filter(
              (img) => img !== null,
            ) as Array<{ url: string; isPrimary: boolean; sortOrder: number }>;

            if (validImages.length > 0) {
              // Delete old images for this product+color
              await deleteProductImages(productId, colorId);

              // Save new images to database
              await addProductImages(productId, colorId, validImages);
            }
          }
        }

        toast.success("Images uploaded successfully", { id: loadingToast });
      }

      window.location.href = "/admin/products";
    } catch (error) {
      console.error("Failed to save product:", error);
      toast.error(
        product ? "Failed to update product" : "Failed to add product",
      );
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">
          Product Name <span className="text-red-500">*</span>
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Enter product name"
          {...register("name")}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="description" className="block text-sm font-medium">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          id="description"
          placeholder="Enter product description"
          {...register("description")}
          rows={4}
          className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary ${
            errors.description ? "border-red-500" : "border-gray-300"
          }`}
        />
        {errors.description && (
          <p className="text-sm text-red-500">{errors.description.message}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <label htmlFor="categoryId" className="block text-sm font-medium">
            Category
          </label>
          <NativeSelect id="categoryId" {...register("categoryId")}>
            <NativeSelectOption value="">Select a category</NativeSelectOption>
            {categories.map((cat) => (
              <NativeSelectOption key={cat.id} value={cat.id}>
                {cat.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {errors.categoryId && (
            <p className="text-sm text-red-500">{errors.categoryId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="genderId" className="block text-sm font-medium">
            Gender
          </label>
          <NativeSelect id="genderId" {...register("genderId")}>
            <NativeSelectOption value="">Select a gender</NativeSelectOption>
            {genders.map((gender) => (
              <NativeSelectOption key={gender.id} value={gender.id}>
                {gender.label}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {errors.genderId && (
            <p className="text-sm text-red-500">{errors.genderId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="brandId" className="block text-sm font-medium">
            Brand
          </label>
          <NativeSelect id="brandId" {...register("brandId")}>
            <NativeSelectOption value="">Select a brand</NativeSelectOption>
            {brands.map((brand) => (
              <NativeSelectOption key={brand.id} value={brand.id}>
                {brand.name}
              </NativeSelectOption>
            ))}
          </NativeSelect>
          {errors.brandId && (
            <p className="text-sm text-red-500">{errors.brandId.message}</p>
          )}
        </div>
      </div>

      {/* Collections */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">Collections</label>
        <p className="text-xs text-gray-500 mb-2">
          Select collections for this product
        </p>
        <div className="border border-gray-300 rounded-md p-4 max-h-60 overflow-y-auto space-y-2">
          {collections.length === 0 ? (
            <p className="text-sm text-gray-500">No collections available</p>
          ) : (
            collections.map((collection) => (
              <label
                key={collection.id}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedCollections.includes(collection.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedCollections([
                        ...selectedCollections,
                        collection.id,
                      ]);
                    } else {
                      setSelectedCollections(
                        selectedCollections.filter(
                          (id) => id !== collection.id,
                        ),
                      );
                    }
                  }}
                  className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary"
                />
                <span className="text-sm">{collection.name}</span>
              </label>
            ))
          )}
        </div>
        {selectedCollections.length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {selectedCollections.length} collection(s) selected
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            {...register("isPublished")}
            className="rounded border-gray-300 text-primary focus:ring-primary"
          />
          <span className="text-sm font-medium">Publish this product</span>
        </label>
        <p className="text-xs text-gray-500">
          Published products will be visible to customers
        </p>
      </div>

      {/* Product Images Section */}
      <div className="space-y-4 border-t pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Product Images by Color</h3>
            <p className="text-sm text-gray-500">
              Upload images for different color variants. You can add images now
              or later.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              // Just focus on the color dropdown
              document.getElementById("imageColor")?.focus();
            }}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add Color Images
          </Button>
        </div>

        {/* Current Images Preview */}
        {Object.keys(colorImages).length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">
              Current Images:
            </h4>
            <div className="space-y-4">
              {Object.entries(colorImages).map(([colorId, images]) => {
                const color = colors.find((c) => c.id === colorId);
                const imageCount = images.filter(
                  (img) => img.file || img.url,
                ).length;
                if (imageCount === 0) return null;

                return (
                  <div
                    key={colorId}
                    className="border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
                    style={{
                      backgroundColor: color ? `${color.hexCode}10` : "#fff",
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded-md border border-gray-300"
                          style={{
                            backgroundColor: color?.hexCode || "#fff",
                          }}
                        />
                        <div>
                          <p className="font-medium text-sm">{color?.name}</p>
                          <p className="text-xs text-gray-500">
                            {imageCount} image{imageCount !== 1 ? "s" : ""}
                          </p>
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedColor(colorId);
                          editSectionRef.current?.scrollIntoView({
                            behavior: "smooth",
                            block: "start",
                          });
                        }}
                        className="flex items-center gap-1 text-xs"
                      >
                        <Edit2 size={12} />
                        Edit
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      {images.map((image, idx) => {
                        if (!image.url) return null;
                        return (
                          <div
                            key={idx}
                            className="relative aspect-square rounded-md  bg-gray-100 border border-gray-200"
                          >
                            <Image
                              src={image.url}
                              height={128}
                              width={128}
                              alt={`${color?.name} ${idx + 1}`}
                              className="w-16 h-16 object-cover  rounded-md "
                            />
                            {image.isPrimary && (
                              <div className="absolute -top-1 -left-1 flex items-center justify-center bg-red-500 text-white text-[10px] font-medium rounded-full animate-ping size-3"></div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Color Selection */}
        <div className="space-y-2" ref={editSectionRef}>
          <label htmlFor="imageColor" className="block text-sm font-medium">
            Select Color to Add/Edit Images
          </label>
          <div className="flex gap-2">
            <NativeSelect
              id="imageColor"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="flex-1 md:flex-none md:w-80"
            >
              <NativeSelectOption value="">Choose a color</NativeSelectOption>
              {colors.map((color) => (
                <NativeSelectOption key={color.id} value={color.id}>
                  {color.name}
                </NativeSelectOption>
              ))}
            </NativeSelect>
            {selectedColor && (
              <div
                className="w-10 h-10 rounded-md border border-gray-300 shrink-0"
                style={{
                  backgroundColor:
                    colors.find((c) => c.id === selectedColor)?.hexCode ||
                    "#fff",
                }}
              />
            )}
          </div>
        </div>

        {/* Image Upload Grid */}
        {selectedColor && (
          <div className="bg-gray-50 rounded-lg border p-6 space-y-4">
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded-md border border-gray-300"
                style={{
                  backgroundColor:
                    colors.find((c) => c.id === selectedColor)?.hexCode ||
                    "#fff",
                }}
              />
              <h4 className="font-medium">
                {colors.find((c) => c.id === selectedColor)?.name} Images
              </h4>
            </div>
            <p className="text-sm text-gray-500">
              Upload up to 4 images. First image will be the primary image.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {(
                colorImages[selectedColor] || [
                  { file: null, url: null, isPrimary: true },
                  { file: null, url: null, isPrimary: false },
                  { file: null, url: null, isPrimary: false },
                  { file: null, url: null, isPrimary: false },
                ]
              ).map((image, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="relative aspect-square border-2 border-dashed border-gray-300 rounded-lg overflow-hidden bg-white hover:bg-gray-50 transition-colors">
                    {image.url ? (
                      <>
                        <img
                          src={image.url}
                          alt={`Image ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(selectedColor, idx)}
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
                          {idx === 0 ? "Primary" : "Optional"}
                        </span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) =>
                            handleImageChange(
                              selectedColor,
                              idx,
                              e.target.files?.[0] || null,
                            )
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

        {/* Summary of images added */}
        {Object.keys(colorImages).length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <p className="text-sm font-medium text-blue-800 mb-2">
              Images Added for Colors:
            </p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(colorImages).map(([colorId, images]) => {
                const color = colors.find((c) => c.id === colorId);
                const imageCount = images.filter(
                  (img) => img.file || img.url,
                ).length;
                if (imageCount === 0) return null;
                return (
                  <div
                    key={colorId}
                    className="flex items-center gap-2 bg-white px-3 py-1 rounded-md border border-blue-300"
                  >
                    <div
                      className="w-4 h-4 rounded-sm border border-gray-300"
                      style={{ backgroundColor: color?.hexCode || "#fff" }}
                    />
                    <span className="text-sm text-blue-900">
                      {color?.name} ({imageCount})
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? product
              ? "Updating..."
              : "Adding..."
            : product
              ? "Update Product"
              : "Add Product"}
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

export default ProductForm;
