import ProductVariantForm from "@/app/admin/_forms/ProductVariant";
import { getVariantById } from "@/app/admin/_actions/variants";

/**
 * Admin Page: Edit Product Variant
 * Route: /admin/variants/[id]/edit
 */
export default async function EditVariantPage({
  params,
}: {
  params: { id: string };
}) {
  const variant = await getVariantById(params.id);

  if (!variant) {
    return (
      <div className="container mx-auto max-w-4xl p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <h2 className="text-xl font-semibold text-red-800">
            Variant Not Found
          </h2>
          <p className="text-red-600 mt-2">
            The variant you're looking for doesn't exist.
          </p>
          <a
            href="/admin/variants"
            className="mt-4 inline-block text-blue-600 hover:underline"
          >
            ← Back to Variants
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Edit Product Variant</h1>
        <p className="text-muted-foreground mt-2">
          Update variant details, images, and stock information
        </p>
        <p className="text-sm text-gray-500 mt-1">SKU: {variant.sku}</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <ProductVariantForm variant={variant} />
      </div>
    </div>
  );
}
