import { getBrandById } from "../../_actions/brands";
import BrandForm from "../../_forms/Brand";

const EditPage = async ({ searchParams }: { searchParams: { id: string } }) => {
  // if no search param id, return null
  const brandId = (await searchParams).id;
  if (!brandId) {
    return <div>No Brand ID provided</div>;
  }

  const brandData = await getBrandById(brandId);
  if (!brandData) {
    return <div>Brand not found</div>;
  }

  return (
    <div>
      <BrandForm brand={brandData} />
    </div>
  );
};

export default EditPage;
