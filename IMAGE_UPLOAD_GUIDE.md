# Image Upload System - Usage Guide

This guide explains how to use the modular image upload system for forms.

## Components & Utilities Created

### 1. **ImageUpload Component** (`src/components/ImageUpload.tsx`)

Reusable component for image upload with drag-and-drop support.

### 2. **S3 Client Utilities** (`src/lib/upload/client.ts`)

Modular functions for S3 operations:

- `uploadFileToS3(file)` - Upload a file and get the public URL
- `deleteFileFromS3(url)` - Delete a file from S3
- `replaceFileInS3(oldUrl, newFile)` - Replace old file with new one (uploads new, deletes old)
- `extractS3Key(url)` - Extract S3 key from public URL

### 3. **S3 API Route** (`src/app/api/upload/route.ts`)

- `POST` - Get presigned URL for upload
- `DELETE` - Delete file from S3

## How to Use in Forms

### Example: Brand Form

```tsx
"use client";
import { useState } from "react";
import ImageUpload from "@/components/ImageUpload";
import { replaceFileInS3, deleteFileFromS3 } from "@/lib/upload/client";

export default function BrandForm({ brand }: { brand?: SelectBrand }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imageRemoved, setImageRemoved] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    // Track if user explicitly removed the image
    if (file === null && brand?.logoUrl) {
      setImageRemoved(true);
    } else {
      setImageRemoved(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      let imageUrl = brand?.logoUrl || null;

      // Handle image removal - delete from S3
      if (imageRemoved && brand?.logoUrl) {
        await deleteFileFromS3(brand.logoUrl);
        imageUrl = null;
      }
      // Upload new file and replace old one
      else if (selectedFile) {
        imageUrl = await replaceFileInS3(brand?.logoUrl, selectedFile);
      }

      // Save to database with the S3 URL (or null if removed)
      await saveBrand({ ...formData, logoUrl: imageUrl });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* Other form fields */}

      <ImageUpload
        currentImageUrl={brand?.logoUrl}
        onFileSelect={handleFileSelect}
        label="Brand Logo"
        helperText="Upload a logo image for this brand"
      />

      <button type="submit" disabled={isSubmitting}>
        {isSubmitting && selectedFile ? "Uploading & Saving..." : "Save"}
      </button>
    </form>
  );
}
```

## Key Features

✅ **Deferred Upload** - Images only upload to S3 when form is submitted  
✅ **Auto Cleanup on Replace** - Old images are automatically deleted when replaced with new ones  
✅ **Auto Cleanup on Remove** - Images are deleted from S3 when removed (X button)  
✅ **Modular** - Components can be reused across all forms  
✅ **Drag & Drop** - Built-in drag-and-drop support  
✅ **Preview** - Shows local preview before upload  
✅ **Error Handling** - Graceful error handling with user feedback

## S3 Deletion Behavior

The system intelligently handles S3 file cleanup:

1. **Replace Image**: When editing and uploading a new image
   - ✅ New image uploaded to S3
   - ✅ Old image deleted from S3
   - ✅ Database updated with new URL

2. **Remove Image**: When clicking X to remove the image
   - ✅ Old image deleted from S3
   - ✅ Database updated with `null`

3. **No Change**: When submitting without touching the image
   - ✅ No S3 operations
   - ✅ Existing URL preserved in database

## Usage for Other Forms

Simply copy the pattern from the Brand form:

1. Import `ImageUpload` component and both `replaceFileInS3` and `deleteFileFromS3` utilities
2. Add state for `selectedFile` and `imageRemoved`
3. Use `ImageUpload` component in JSX
4. Track removal in `handleFileSelect` callback
5. Handle both replacement and removal in form submit handler

**Important**: Always track `imageRemoved` separately to distinguish between:

- User didn't touch the image (keep existing)
- User clicked X to remove (delete from S3)
- User uploaded new file (replace in S3)

The same pattern works for:

- Product images
- Category images
- User avatars
- Any other image upload needs
