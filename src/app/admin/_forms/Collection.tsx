"use client";
import { addCollection, updateCollection } from "../_actions/collection";
import {
  InsertCollection,
  insertCollectionSchema,
} from "@/lib/db/schema/collections";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export default function CollectionForm({
  collection,
}: {
  collection?: {
    id: string;
    name: string;
    slug: string;
  };
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<InsertCollection>({
    resolver: zodResolver(insertCollectionSchema),
    defaultValues: {
      name: collection?.name || "",
      slug: collection?.slug || "",
    },
  });

  // Auto-generate slug from name
  const name = watch("name");
  useEffect(() => {
    if (name && !collection) {
      // Only auto-generate for new collections
      const slug = name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, "") // Remove special characters
        .replace(/\s+/g, "-") // Replace spaces with hyphens
        .replace(/-+/g, "-"); // Replace multiple hyphens with single hyphen
      setValue("slug", slug);
    }
  }, [name, setValue, collection]);

  const onSubmit = async (data: InsertCollection) => {
    setIsSubmitting(true);
    try {
      if (collection) {
        // Update existing collection
        await updateCollection(collection.id, data);
        toast.success("Collection updated successfully");
      } else {
        // Add new collection
        await addCollection(data);
        toast.success("Collection added successfully");
      }
      // Redirect to collections page
      window.location.href = "/admin/collections";
    } catch (error) {
      console.error("Failed to save collection:", error);
      toast.error(
        collection ? "Failed to update collection" : "Failed to add collection",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <label htmlFor="name" className="block text-sm font-medium">
          Name <span className="text-red-500">*</span>
        </label>
        <Input
          id="name"
          type="text"
          placeholder="Enter collection name"
          {...register("name")}
          className={errors.name ? "border-red-500" : ""}
        />
        {errors.name && (
          <p className="text-sm text-red-500">{errors.name.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <label htmlFor="slug" className="block text-sm font-medium">
          Slug <span className="text-red-500">*</span>
        </label>
        <Input
          id="slug"
          type="text"
          placeholder="collection-slug"
          {...register("slug")}
          className={errors.slug ? "border-red-500" : ""}
        />
        {errors.slug && (
          <p className="text-sm text-red-500">{errors.slug.message}</p>
        )}
        <p className="text-xs text-gray-500">
          Auto-generated from name, but you can edit it
        </p>
      </div>

      <div className="flex gap-4">
        <Button type="submit" disabled={isSubmitting} className="flex-1">
          {isSubmitting
            ? collection
              ? "Updating..."
              : "Adding..."
            : collection
              ? "Update Collection"
              : "Add Collection"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => (window.location.href = "/admin/collections")}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
