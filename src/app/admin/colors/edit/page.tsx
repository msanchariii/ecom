import React from "react";
import { getColorById } from "../../_actions/filters";
import ColorForm from "../../_forms/Color";

const EditColorPage = async ({
  searchParams,
}: {
  searchParams: { id: string };
}) => {
  const colorId = (await searchParams).id;
  if (!colorId) {
    return <div>No Color ID provided</div>;
  }

  const colorData = await getColorById(colorId);

  if (!colorData) {
    return <div>Color not found</div>;
  }

  return (
    <div>
      <ColorForm color={colorData} />
    </div>
  );
};

export default EditColorPage;
