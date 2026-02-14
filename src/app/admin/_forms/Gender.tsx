"use client";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertGenderSchema, SelectGender } from "@/lib/db/schema";
import { addGender, updateGender } from "../_actions/filters";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";

type GenderFormValues = z.infer<typeof insertGenderSchema>;

export default function GenderForm({ gender }: { gender?: SelectGender }) {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<GenderFormValues>({
    resolver: zodResolver(insertGenderSchema),
    defaultValues: {
      label: gender?.label || "",
      slug: gender?.slug || "",
    },
  });

  const label = watch("label");

  // Auto-generate slug from label
  useEffect(() => {
    if (!gender && label) {
      const generatedSlug = label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", generatedSlug);
    }
  }, [label, gender, setValue]);

  const onSubmit = async (data: GenderFormValues) => {
    try {
      const formattedData = {
        ...data,
        label: data.label.trim(),
        slug: data.slug.trim(),
      };

      if (gender) {
        await updateGender(gender.id, formattedData);
        toast.success("Gender updated successfully");
      } else {
        await addGender(formattedData);
        toast.success("Gender added successfully");
      }

      router.push("/admin/gender");
      router.refresh();
    } catch (err) {
      console.error("Failed to save gender:", err);
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(
          gender ? "Failed to update gender" : "Failed to add gender",
        );
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {gender ? "Edit Gender" : "Add Gender"}
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="label" className="block text-sm font-medium">
              Label <span className="text-red-500">*</span>
            </label>
            <Input
              id="label"
              type="text"
              placeholder="e.g., Men, Women, Unisex"
              {...register("label")}
              className={errors.label ? "border-red-500" : ""}
            />
            {errors.label && (
              <p className="text-sm text-red-500">{errors.label.message}</p>
            )}
            <p className="text-xs text-gray-500">
              The display name for this gender category
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="block text-sm font-medium">
              Slug <span className="text-red-500">*</span>
            </label>
            <Input
              id="slug"
              type="text"
              placeholder="e.g., men, women, unisex"
              {...register("slug")}
              className={errors.slug ? "border-red-500" : ""}
            />
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug.message}</p>
            )}
            <p className="text-xs text-gray-500">
              URL-friendly identifier (auto-generated from label)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? "Saving..."
              : gender
                ? "Update Gender"
                : "Add Gender"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </div>
      </div>
    </form>
  );
}
