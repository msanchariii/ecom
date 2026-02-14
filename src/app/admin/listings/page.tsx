import React from "react";
import { getProductListings } from "../_actions/products";
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

const ListingPage = async () => {
  const listings = await getProductListings();

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Product Listings</h1>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Brand</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Gender</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map((listing) => (
            <TableRow key={listing.productId}>
              <TableCell className="flex items-center gap-4">
                {listing.imageUrl && (
                  <img
                    src={listing.imageUrl}
                    alt={listing.name}
                    className="w-16 h-16 object-cover rounded-2xl"
                  />
                )}
                <div className="flex flex-col">
                  <span className="font-medium">{listing.name}</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span
                      style={{
                        backgroundColor: listing.colorCode || "#000000",
                      }}
                      className="w-4 h-4 rounded-full inline-block border border-gray-300"
                    ></span>
                    <span className="text-sm text-gray-600">
                      {listing.colorName}
                    </span>
                  </div>
                </div>
              </TableCell>
              <TableCell>{listing.brandName}</TableCell>
              <TableCell>{listing.categoryName}</TableCell>
              <TableCell>{listing.genderLabel}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ListingPage;
