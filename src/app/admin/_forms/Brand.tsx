"use client";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertBrandSchema, SelectBrand } from "@/lib/db/schema";
import { addBrand, updateBrand } from "../_actions/brands";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import { replaceFileInS3, deleteFileFromS3 } from "@/lib/upload/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { z } from "zod";

type BrandFormValues = z.infer<typeof insertBrandSchema>;

export default function BrandForm({ brand }: { brand?: SelectBrand }) {
  const router = useRouter();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<BrandFormValues>({
    resolver: zodResolver(insertBrandSchema),
    defaultValues: {
      name: brand?.name || "",
      slug: brand?.slug || "",
      logoUrl: brand?.logoUrl || null,
    },
  });

  const name = watch("name");

  // Auto-generate slug from name
  useEffect(() => {
    if (!brand && name) {
      const generatedSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setValue("slug", generatedSlug);
    }
  }, [name, brand, setValue]);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    // Track if user explicitly removed the image
    if (file === null && brand?.logoUrl) {
      setImageRemoved(true);
    } else {
      setImageRemoved(false);
    }
  };

  const onSubmit = async (data: BrandFormValues) => {
    try {
      let finalLogoUrl = brand?.logoUrl || null;

      // Handle image removal - delete from S3
      if (imageRemoved && brand?.logoUrl) {
        await deleteFileFromS3(brand.logoUrl);
        finalLogoUrl = null;
      }
      // Upload new file and delete old file if a new file was selected
      else if (selectedFile) {
        finalLogoUrl = await replaceFileInS3(brand?.logoUrl, selectedFile);
      }

      const formattedData = {
        ...data,
        name: data.name.trim(),
        slug: data.slug.trim(),
        logoUrl: finalLogoUrl,
      };

      if (brand) {
        await updateBrand(brand.id, formattedData);
        toast.success("Brand updated successfully");
      } else {
        await addBrand(formattedData);
        toast.success("Brand added successfully");
      }

      router.push("/admin/brands");
      router.refresh();
    } catch (err) {
      console.error("Failed to save brand:", err);
      if (err instanceof Error) {
        toast.error(err.message);
      } else {
        toast.error(brand ? "Failed to update brand" : "Failed to add brand");
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {brand ? "Edit Brand" : "Add Brand"}
        </h2>

        <div className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Brand Name <span className="text-red-500">*</span>
            </label>
            <Input
              id="name"
              type="text"
              placeholder="e.g., Nike, Adidas, Puma"
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
            <p className="text-xs text-gray-500">
              The official name of the brand
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="slug" className="block text-sm font-medium">
              Slug <span className="text-red-500">*</span>
            </label>
            <Input
              id="slug"
              type="text"
              placeholder="e.g., nike, adidas, puma"
              {...register("slug")}
              className={errors.slug ? "border-red-500" : ""}
            />
            {errors.slug && (
              <p className="text-sm text-red-500">{errors.slug.message}</p>
            )}
            <p className="text-xs text-gray-500">
              URL-friendly identifier (auto-generated from name)
            </p>
          </div>

          <ImageUpload
            currentImageUrl={brand?.logoUrl}
            onFileSelect={handleFileSelect}
            label="Brand Logo"
            helperText="Upload a logo image for this brand"
            required={false}
          />
        </div>

        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting
              ? selectedFile
                ? "Uploading & Saving..."
                : "Saving..."
              : brand
                ? "Update Brand"
                : "Add Brand"}
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
