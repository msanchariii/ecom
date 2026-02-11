import ProductVariantForm from "@/app/admin/_forms/ProductVariant";

/**
 * Admin Page: Create New Product Variant
 * Route: /admin/variants/new
 */
export default function NewVariantPage() {
  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Create Product Variant</h1>
        <p className="text-muted-foreground mt-2">
          Add a new variant with images, pricing, and stock information
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <ProductVariantForm />
      </div>
    </div>
  );
}
