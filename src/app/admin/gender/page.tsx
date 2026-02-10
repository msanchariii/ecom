import React from "react";
import { getGenders } from "../_actions/gender";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableCell,
  TableFooter,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from "next/link";

const GenderPage = async () => {
  const genders = await getGenders();
  return (
    <div>
      <div className="flex justify-between w-full">
        <h1 className="text-2xl">Gender</h1>
        <Button asChild>
          <Link href="/admin/gender/add">Add Gender</Link>
        </Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead className="max-w-6">Label</TableHead>
            <TableHead className="max-w-6">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {genders.map((gender) => (
            <TableRow key={gender.id}>
              <TableCell className="font-medium bg-gray-100 max-w-8">
                {gender.id}
              </TableCell>
              <TableCell className="max-w-6">{gender.label}</TableCell>
              <TableCell className="max-w-6">
                <Button asChild>
                  <Link href={`/admin/gender/edit?id=${gender.id}`}>Edit</Link>
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default GenderPage;
