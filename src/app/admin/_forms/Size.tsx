"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertSizeSchema, SelectSize } from "@/lib/db/schema/filters/sizes";
import { addSize, updateSize } from "../_actions/filters";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";

interface SizeFormProps {
  size?: SelectSize;
}

type SizeFormValues = z.infer<typeof insertSizeSchema>;

/**
 * Size Add/Edit Form Component
 * Allows creating new sizes or editing existing ones
 * Features:
 * - Auto-generates slug from name
 * - Sort order for display sequence
 * - Validation with Zod schema
 * - Common size presets
 */
export default function SizeForm({ size }: SizeFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<SizeFormValues>({
    resolver: zodResolver(insertSizeSchema),
    defaultValues: {
      name: size?.name || "",
      slug: size?.slug || "",
      sortOrder: size?.sortOrder || 0,
    },
  });

  const name = watch("name");

  // Common size presets
  const sizePresets = [
    { name: "XS", sortOrder: 1 },
    { name: "S", sortOrder: 2 },
    { name: "M", sortOrder: 3 },
    { name: "L", sortOrder: 4 },
    { name: "XL", sortOrder: 5 },
    { name: "XXL", sortOrder: 6 },
    { name: "XXXL", sortOrder: 7 },
  ];

  const shoePresets = [
    { name: "6", sortOrder: 10 },
    { name: "7", sortOrder: 11 },
    { name: "8", sortOrder: 12 },
    { name: "9", sortOrder: 13 },
    { name: "10", sortOrder: 14 },
    { name: "11", sortOrder: 15 },
    { name: "12", sortOrder: 16 },
  ];

  // Auto-generate slug from name
  useEffect(() => {
    if (!size && name) {
      const generatedSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", generatedSlug);
    }
  }, [name, size, setValue]);

  const handlePresetClick = (preset: { name: string; sortOrder: number }) => {
    setValue("name", preset.name);
    setValue("sortOrder", preset.sortOrder);
  };

  const onSubmit = async (data: SizeFormValues) => {
    try {
      const formattedData = {
        ...data,
        name: data.name.trim(),
        slug: data.slug.trim(),
        sortOrder: Number(data.sortOrder),
      };

      if (size) {
        await updateSize(size.id, formattedData);
        toast.success("Size updated successfully");
      } else {
        await addSize(formattedData);
        toast.success("Size added successfully");
      }

      router.push("/admin/sizes");
      router.refresh();
    } catch (err) {
      console.error("Failed to save size:", err);
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(size ? "Failed to update size" : "Failed to add size");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold mb-6">
          {size ? "Edit Size" : "Add Size"}
        </h2>

        <div className="space-y-4">
          {/* Quick Presets */}
          {!size && (
            <div className="space-y-3">
              <label className="block text-sm font-medium">
                Quick Presets (Optional)
              </label>
              <div className="space-y-2">
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Clothing Sizes:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {sizePresets.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">
                    Shoe Sizes:
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {shoePresets.map((preset) => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handlePresetClick(preset)}
                        className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Click a preset to auto-fill the form, or enter custom values
                below
              </p>
            </div>
          )}

          {/* Size Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Size Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., M, L, XL, 42, 10"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The display name for this size
            </p>
          </div>

          {/* Slug */}
          <div className="space-y-2">
            <label htmlFor="slug" className="block text-sm font-medium">
              Slug <span className="text-red-500">*</span>
            </label>
            <Input
              id="slug"
              type="text"
              placeholder="e.g., m, l, xl, 42, 10"
              {...register("slug")}
              className={errors.slug ? "border-red-500" : ""}
            />
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              URL-friendly identifier (auto-generated from name)
            </p>
          </div>

          {/* Sort Order */}
          <div className="space-y-2">
            <label htmlFor="sortOrder" className="block text-sm font-medium">
              Sort Order <span className="text-red-500">*</span>
            </label>
            <Input
              id="sortOrder"
              type="number"
              placeholder="e.g., 1, 2, 3"
              {...register("sortOrder", { valueAsNumber: true })}
              className={errors.sortOrder ? "border-red-500" : ""}
            />
            {errors.sortOrder && (
              <p className="text-sm text-red-500">{errors.sortOrder.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Lower numbers appear first. Example: XS=1, S=2, M=3, L=4, XL=5
            </p>
          </div>

          {/* Live Preview Card */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Live Preview:
            </p>
            <div className="flex items-center gap-3 p-3 bg-white rounded border">
              <div className="w-12 h-12 rounded-md border-2 border-gray-300 bg-white flex items-center justify-center">
                <span className="font-bold text-gray-700">
                  {watch("name") || "?"}
                </span>
              </div>
              <div>
                <p className="font-medium text-gray-900">
                  Size: {watch("name") || "Size Name"}
                </p>
                <p className="text-sm text-gray-500">
                  Slug: {watch("slug") || "size-slug"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Display Order: #{watch("sortOrder") || 0}
                </p>
              </div>
            </div>
          </div>

          {/* Sorting Guidance */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-xs text-blue-800">
              <strong>💡 Tip:</strong> Use consistent sort orders:
              <br />• Clothing: XS=1, S=2, M=3, L=4, XL=5, XXL=6
              <br />• Shoes: Start from 10 (e.g., Size 6=10, Size 7=11)
              <br />• Kids: Start from 20 (e.g., 2T=20, 3T=21)
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting
              ? size
                ? "Updating..."
                : "Adding..."
              : size
                ? "Update Size"
                : "Add Size"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/sizes")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
