import { getSizeById } from "../../_actions/filters";
import SizeForm from "../../_forms/Size";

const EditPage = async ({ searchParams }: { searchParams: { id: string } }) => {
  // if no search param id, return null
  const sizeId = (await searchParams).id;
  if (!sizeId) {
    return <div>No ID provided</div>;
  }

  const sizeData = await getSizeById(sizeId);
  if (!sizeData) {
    return <div>Size not found</div>;
  }

  return (
    <div>
      EditPage
      <SizeForm size={sizeData} />
    </div>
  );
};

export default EditPage;
