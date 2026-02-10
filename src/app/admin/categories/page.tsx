import { Button } from "@/components/ui/button";
import { getCategories } from "../_actions/categories";
import Link from "next/link";

export default async function CategoriesPage() {
  const categories = await getCategories();

  return (
    <div className="space-y-6">
      <div className="w-full flex justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Categories</h1>
        <Button asChild> 
          <Link href="/admin/categories/add">Add Category</Link>
        </Button>
      </div>
      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        {categories.map((category) => (
          <div
            key={category.id}
            className="flex items-center gap-4 py-2 border-b border-gray-200"
          >
            <div className="w-4" />
            <div className="text-sm font-medium text-gray-900">
              {category.name}
            </div>
          </div>
        ))}
      </div>
      <div>
        {/* render a compact table with indentation for parent-child relationships */}
      </div>
    </div>
  );
}
