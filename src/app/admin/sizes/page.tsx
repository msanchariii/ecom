import { Button } from "@/components/ui/button";
import { getSizes } from "../_actions/filters";
import Link from "next/link";

const SizesPage = async () => {
  const sizes = await getSizes();
  return (
    <div>
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold ">Sizes</h1>
        <Button asChild>
          <Link href="/admin/sizes/add">Add Size</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sizes.map((size) => (
          <div
            key={size.id}
            className="p-4 border border-gray-200 shadow rounded"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">{size.name}</h2>
            </div>
            <p className="text-sm text-gray-500">Value: {size.sortOrder}</p>
            <div className="mt-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SizesPage;
