import ProductListingForm from "@/app/admin/_forms/ProductListing";

export default function NewProductListingPage() {
  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Add Product Images</h1>
        <p className="text-gray-600 mt-2">
          Upload images for different colors of a product
        </p>
      </div>
      <ProductListingForm />
    </div>
  );
}
