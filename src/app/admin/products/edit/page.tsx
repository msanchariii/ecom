import React from "react";
import { getProductById } from "../../_actions/products";
import ProductForm from "../../_forms/Product";

const EditPage = async ({ searchParams }: { searchParams: { id: string } }) => {
  const productId = (await searchParams).id;

  if (!productId) {
    return <div>No product ID provided</div>;
  }

  const productData = await getProductById(productId);
  if (!productData) {
    return <div>Product not found</div>;
  }

  return (
    <div>
      <ProductForm product={productData} />
    </div>
  );
};

export default EditPage;
