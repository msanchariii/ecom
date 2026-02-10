import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getBrands } from "../_actions/brands";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from "next/image";

export default async function BrandsPage() {
  const brands = await getBrands();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Brands</h1>
        <Button asChild className="mt-4 transition-colors">
          <Link href="/admin/brands/add">Add Brand</Link>
        </Button>
      </div>
      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {brands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell>
                    <Image
                      src={brand.logoUrl || "/placeholder.png"}
                      alt={brand.name}
                      width={64}
                      height={64}
                      className="inline-block mr-2 rounded border size-16 shadow object-contain"
                    />
                    {brand.name}
                  </TableCell>
                  <TableCell>
                    <Button asChild className=" transition-colors">
                      <Link href={`/admin/brands/edit?id=${brand.id}`}>
                        Edit
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
