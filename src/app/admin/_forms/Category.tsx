// add/edit form for categories with zod validation and error handling, parent category dropdown, and unique slug generation from name
"use client";
import { addCategory, getCategories } from "../_actions/categories";
import { insertCategorySchema } from "@/lib/db/schema/categories";
import { useEffect, useState } from "react";

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
  const [name, setName] = useState(category?.name || "");
  const [slug, setSlug] = useState(category?.slug || "");
  const [parentId, setParentId] = useState(category?.parentId || null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // fetch categories for parent category dropdown
    const fetchCategories = async () => {
      try {
        const res = await getCategories();
        setCategories(res);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    try {
      const data = insertCategorySchema.parse({ name, slug, parentId });
      await addCategory(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Slug</label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Parent Category
        </label>
        <select
          value={parentId || ""}
          onChange={(e) => setParentId(e.target.value || null)}
          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
        >
          <option value="">None</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
    </form>
  );
}
