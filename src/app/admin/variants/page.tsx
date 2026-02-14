import { Button } from "@/components/ui/button";
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
import Link from "next/link";
import { getVariants } from "../_actions/variants";

export default async function VariantsPage() {
  const variants = await getVariants();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-semibold text-gray-900">
          SKU (Product Variants)
        </h1>
        <Button asChild>
          <Link href={"/admin/variants/add"}>Add SKU</Link>
        </Button>
      </div>
      <div className="bg-white rounded-lg shadow border border-gray-200 p-8">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Product Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Size</TableHead>

              <TableHead>Stock</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {variants.map((variant) => (
              <TableRow key={variant.id}>
                <TableCell>{variant.sku}</TableCell>
                <TableCell>{variant.productName}</TableCell>
                <TableCell>₹{variant.price}</TableCell>
                <TableCell>{variant.size}</TableCell>
                <TableCell>{variant.inStock}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/admin/variants/${variant.id}/edit`}>
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
  );
}
