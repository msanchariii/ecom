import { Button } from "@/components/ui/button";
import { getColors } from "../_actions/filters";
import Link from "next/link";
import { Edit, Edit2 } from "lucide-react";

const ColorsPage = async () => {
  const colours = await getColors();

  return (
    <div>
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold mb-4">Colors</h1>
        <Button>
          <Link href="/admin/colors/add">Add Color</Link>
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {colours.map((color) => (
          <div
            key={color.id}
            className="p-4 border border-gray-200 shadow rounded"
          >
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                {/* Display the color swatch */}
                <span
                  className="inline-block w-4 h-4 rounded-full mr-2"
                  style={{ backgroundColor: color.hexCode }}
                ></span>

                {color.name}
              </h2>
              <Link href={`/admin/colors/edit?id=${color.id}`}>
                {/* edit icon from lucide */}
                <Edit
                  className="hover:text-blue-500 text-gray-600 hover:bg-gray-200 rounded p-1 transition-colors"
                  size={24}
                />
              </Link>
            </div>
            <p className="text-sm text-gray-500">Value: {color.hexCode}</p>
            <div className="mt-2"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ColorsPage;
