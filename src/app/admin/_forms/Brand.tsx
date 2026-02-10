"use client";
import { useState, useEffect } from "react";
import { insertBrandSchema, SelectBrand } from "@/lib/db/schema";
import { addBrand, updateBrand } from "../_actions/brands";
import { useRouter } from "next/navigation";
import ImageUpload from "@/components/ImageUpload";
import { replaceFileInS3 } from "@/lib/upload/client";

export default function BrandForm({ brand }: { brand?: SelectBrand }) {
  const router = useRouter();
  const [name, setName] = useState(brand?.name || "");
  const [slug, setSlug] = useState(brand?.slug || "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Auto-generate slug from name
  useEffect(() => {
    if (!brand && name) {
      const generatedSlug = name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generatedSlug);
    }
  }, [name, brand]);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      let finalLogoUrl = brand?.logoUrl || null;

      // Upload file to S3 and delete old file if a new file was selected
      if (selectedFile) {
        finalLogoUrl = await replaceFileInS3(brand?.logoUrl, selectedFile);
      }

      const data = insertBrandSchema.parse({
        name,
        slug,
        logoUrl: finalLogoUrl,
      });

      if (brand) {
        await updateBrand(brand.id, data);
      } else {
        await addBrand(data);
      }

      router.push("/admin/brands");
      router.refresh();
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">
          {brand ? "Edit Brand" : "Add Brand"}
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Brand Name <span className="text-red-500">*</span>
            </label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Nike, Adidas, Puma"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              The official name of the brand
            </p>
          </div>

          <div>
            <label
              htmlFor="slug"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              id="slug"
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              placeholder="e.g., nike, adidas, puma"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
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
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? selectedFile
                ? "Uploading & Saving..."
                : "Saving..."
              : brand
                ? "Update Brand"
                : "Add Brand"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium rounded-lg transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </form>
  );
}
