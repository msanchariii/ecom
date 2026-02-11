"use client";
import { useState, useEffect } from "react";
import { insertGenderSchema, SelectGender } from "@/lib/db/schema";
import { addGender, updateGender } from "../_actions/filters";
import { useRouter } from "next/navigation";

export default function GenderForm({ gender }: { gender?: SelectGender }) {
  const router = useRouter();
  const [label, setLabel] = useState(gender?.label || "");
  const [slug, setSlug] = useState(gender?.slug || "");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!gender && label) {
      const generatedSlug = label
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      setSlug(generatedSlug);
    }
  }, [label, gender]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const data = insertGenderSchema.parse({ label, slug });

      if (gender) {
        await updateGender(gender.id, data);
      } else {
        await addGender(data);
      }

      router.push("/admin/gender");
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
          {gender ? "Edit Gender" : "Add Gender"}
        </h2>

        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label
              htmlFor="label"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Label <span className="text-red-500">*</span>
            </label>
            <input
              id="label"
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g., Men, Women, Unisex"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              The display name for this gender category
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
              placeholder="e.g., men, women, unisex"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              required
            />
            <p className="mt-1 text-xs text-gray-500">
              URL-friendly identifier (auto-generated from label)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-6 pt-6 border-t border-gray-200">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isSubmitting
              ? "Saving..."
              : gender
                ? "Update Gender"
                : "Add Gender"}
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
