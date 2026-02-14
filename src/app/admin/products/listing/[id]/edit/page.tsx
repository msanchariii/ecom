import ProductListingForm from "@/app/admin/_forms/ProductListing";

interface EditProductListingPageProps {
  params: {
    id: string;
  };
}

export default function EditProductListingPage({
  params,
}: EditProductListingPageProps) {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Update Product Images</h1>
        <p className="text-gray-600 mt-2">
          Update images for a product color combination
        </p>
      </div>
      <ProductListingForm />
    </div>
  );
}
