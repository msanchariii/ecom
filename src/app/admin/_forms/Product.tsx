"use client";
import { InsertProduct, insertProductSchema } from "@/lib/db/schema";
import { zodResolver } from "@hookform/resolvers/zod";
import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { addProduct, updateProduct } from "../_actions/products";
import { getCategories } from "../_actions/categories";
import { getGenders } from "../_actions/filters";
import { getBrands } from "../_actions/brands";
import {
  getCollections,
  getCollectionsForProduct,
  updateProductCollections,
} from "../_actions/collection";

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
        const [categoriesData, gendersData, brandsData, collectionsData] =
          await Promise.all([
            getCategories(),
            getGenders(),
            getBrands(),
            getCollections(),
          ]);
        setCategories(categoriesData);
        setGenders(gendersData);
        setBrands(brandsData);
        setCollections(collectionsData);
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
          <select
            id="categoryId"
            {...register("categoryId")}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select a category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
          {errors.categoryId && (
            <p className="text-sm text-red-500">{errors.categoryId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="genderId" className="block text-sm font-medium">
            Gender
          </label>
          <select
            id="genderId"
            {...register("genderId")}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select a gender</option>
            {genders.map((gender) => (
              <option key={gender.id} value={gender.id}>
                {gender.label}
              </option>
            ))}
          </select>
          {errors.genderId && (
            <p className="text-sm text-red-500">{errors.genderId.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <label htmlFor="brandId" className="block text-sm font-medium">
            Brand
          </label>
          <select
            id="brandId"
            {...register("brandId")}
            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
          >
            <option value="">Select a brand</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
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
