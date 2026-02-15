// add/edit form for categories with zod validation and error handling, parent category dropdown, and unique slug generation from name
"use client";
import {
  addCategory,
  getCategories,
  updateCategory,
} from "../_actions/categories";
import {
  InsertCategory,
  insertCategorySchema,
} from "@/lib/db/schema/categories";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";
import { toast } from "sonner";

export default function CategoryForm({
  category,
}: {
  category?: {
    id: string;
    name: string;
    slug: string;
    parentId: string | null;
  };
}) {
  const [categories, setCategories] = useState<
    Array<{ id: string; name: string; parentId: string | null }>
  >([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InsertCategory>({
    resolver: zodResolver(insertCategorySchema),
    defaultValues: {
      name: category?.name || "",
      slug: category?.slug || "",
      parentId: category?.parentId || null,
    },
  });

  // Fetch all categories for parent dropdown
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await getCategories();
        // Filter out current category if editing to prevent self-parenting
        const filtered = category
          ? data.filter((cat) => cat.id !== category.id)
          : data;
        setCategories(filtered);
      } catch (error) {
        console.error("Failed to fetch categories:", error);
        toast.error("Failed to load categories");
      }
    };
    fetchCategories();
  }, [category]);

  // Auto-generate slug from name
  const name = watch("name");
  useEffect(() => {
    if (name && !category) {
      // Only auto-generate for new categories
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
      setValue("slug", slug);
    }
  }, [name, setValue, category]);

  const onSubmit = async (data: InsertCategory) => {
    setIsSubmitting(true);
    try {
      if (data.parentId === "") {
        data.parentId = null; // Handle empty string as null for parentId
      }
      if (category) {
        // Update existing category
        await updateCategory(category.id, data);
        toast.success("Category updated successfully");
      } else {
        // Add new category
        await addCategory(data);
        toast.success("Category added successfully");
      }
      // Optionally redirect or reset form
      window.location.href = "/admin/categories";
    } catch (error) {
      console.error("Failed to save category:", error);
      toast.error(
        category ? "Failed to update category" : "Failed to add category",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">
          Name <span className="text-red-500">*</span>
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Enter category name"
          {...register("name")}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="slug" className="block text-sm font-medium">
          Slug <span className="text-red-500">*</span>
        </label>
        <Input
          id="slug"
          type="text"
          placeholder="category-slug"
          {...register("slug")}
          className={errors.slug ? "border-red-500" : ""}
        />
        {errors.slug && (
          <p className="text-sm text-red-500">{errors.slug.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Auto-generated from name, but you can edit it
        </p>
      </div>

      <div className="space-y-2">
        <label htmlFor="parentId" className="block text-sm font-medium">
          Parent Category (Optional)
        </label>
        <NativeSelect id="parentId" {...register("parentId")}>
          <NativeSelectOption value="">
            None (Top-level category)
          </NativeSelectOption>
          {categories.map((cat) => (
            <NativeSelectOption key={cat.id} value={cat.id}>
              {cat.name}
            </NativeSelectOption>
          ))}
        </NativeSelect>
        {errors.parentId && (
          <p className="text-sm text-red-500">{errors.parentId.message}</p>
        )}
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting
            ? category
              ? "Updating..."
              : "Adding..."
            : category
              ? "Update Category"
              : "Add Category"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/admin/categories")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
