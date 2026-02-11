import { getGenderById } from "../../_actions/filters";
import GenderForm from "../../_forms/Gender";

const EditPage = async ({ searchParams }: { searchParams: { id: string } }) => {
  // if no search param id, return null
  const genderId = (await searchParams).id;
  if (!genderId) {
    return <div>No ID provided</div>;
  }

  const genderData = await getGenderById(genderId);
  if (!genderData) {
    return <div>Gender not found</div>;
  }

  return (
    <div>
      EditPage
      <GenderForm gender={genderData} />
    </div>
  );
};

export default EditPage;
