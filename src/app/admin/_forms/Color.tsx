"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertColorSchema, SelectColor } from "@/lib/db/schema/filters/colors";
import { addColor, updateColor } from "../_actions/filters";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";

interface ColorFormProps {
  color?: SelectColor;
}

type ColorFormValues = z.infer<typeof insertColorSchema>;

/**
 * Color Add/Edit Form Component
 * Allows creating new colors or editing existing ones
 * Features:
 * - Auto-generates slug from name
 * - Color picker for hex code
 * - Live preview of selected color
 * - Validation with Zod schema
 */
export default function ColorForm({ color }: ColorFormProps) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<ColorFormValues>({
    resolver: zodResolver(insertColorSchema),
    defaultValues: {
      name: color?.name || "",
      slug: color?.slug || "",
      hexCode: color?.hexCode || "#000000",
    },
  });

  const name = watch("name");
  const slug = watch("slug");
  const hexCode = watch("hexCode");

  // Auto-generate slug from name
  useEffect(() => {
    if (!color && name) {
      const generatedSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", generatedSlug);
    }
  }, [name, color, setValue]);

  const onSubmit = async (data: ColorFormValues) => {
    try {
      const formattedData = {
        ...data,
        name: data.name.trim(),
        slug: data.slug.trim(),
        hexCode: data.hexCode.toUpperCase(),
      };

      if (color) {
        await updateColor(color.id, formattedData);
        toast.success("Color updated successfully");
      } else {
        await addColor(formattedData);
        toast.success("Color added successfully");
      }

      router.push("/admin/colors");
      router.refresh();
    } catch (err) {
      console.error("Failed to save color:", err);
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(color ? "Failed to update color" : "Failed to add color");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-2xl font-bold mb-6">
          {color ? "Edit Color" : "Add Color"}
        </h2>

        <div className="space-y-4">
          {/* Color Name */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Color Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              type="text"
              {...register("name")}
              placeholder="e.g., Red, Navy Blue, Forest Green"
            />
            {errors.name && (
              <p className="text-xs text-red-500">{errors.name.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              The display name for this color
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
              {...register("slug")}
              placeholder="e.g., red, navy-blue, forest-green"
            />
            {errors.slug && (
              <p className="text-xs text-red-500">{errors.slug.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              URL-friendly identifier (auto-generated from name)
            </p>
          </div>

          {/* Hex Code with Color Picker */}
          <div className="space-y-2">
            <label htmlFor="hexCode" className="block text-sm font-medium">
              Hex Code <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <Input
                  id="hexCode"
                  type="text"
                  {...register("hexCode")}
                  placeholder="#000000"
                  pattern="^#[0-9A-Fa-f]{6}$"
                  maxLength={7}
                />
                {errors.hexCode && (
                  <p className="text-xs text-red-500 mt-1">
                    {errors.hexCode.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  6-digit hex color code (e.g., #FF5733)
                </p>
              </div>

              {/* Color Picker */}
              <div className="flex flex-col items-center gap-2">
                <input
                  type="color"
                  value={hexCode}
                  onChange={(e) => setValue("hexCode", e.target.value)}
                  className="w-16 h-10 rounded border border-gray-300 cursor-pointer"
                  title="Pick a color"
                />
                <span className="text-xs text-gray-500">Pick</span>
              </div>

              {/* Color Preview */}
              <div className="flex flex-col items-center gap-2">
                <div
                  className="w-16 h-10 rounded border-2 border-gray-300"
                  style={{ backgroundColor: hexCode }}
                  title="Color preview"
                />
                <span className="text-xs text-gray-500">Preview</span>
              </div>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Live Preview:
            </p>
            <div className="flex items-center gap-3 p-3 bg-white rounded border">
              <div
                className="w-12 h-12 rounded-md border-2 border-gray-300 shadow-sm"
                style={{ backgroundColor: hexCode }}
              />
              <div>
                <p className="font-medium text-gray-900">
                  {name || "Color Name"}
                </p>
                <p className="text-sm text-gray-500">{slug || "color-slug"}</p>
                <p className="text-xs text-gray-400 font-mono mt-1">
                  {hexCode.toUpperCase()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
          <Button type="submit" disabled={isSubmitting} className="flex-1">
            {isSubmitting
              ? color
                ? "Updating..."
                : "Adding..."
              : color
                ? "Update Color"
                : "Add Color"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/admin/colors")}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
