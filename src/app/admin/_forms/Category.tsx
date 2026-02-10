// add/edit form for categories with zod validation and error handling, parent category dropdown, and unique slug generation from name
"use client";
import { addCategory, getCategories } from "../_actions/categories";
import { insertCategorySchema } from "@/lib/db/schema/categories";
import { useEffect, useState } from "react";

export default function CategoryForm({
    category,
}: {
    category?: {
        id: string;
        name: string;
        slug: string;
        parentId: string | null;
    };
}) {
    return (
        <form>
            <div>
                <label>Name</label>
            </div>
        </form>
    );
}
