# Product Variant Form - Implementation Guide

## 📋 Overview

A comprehensive product variant form for the admin panel with:

- ✅ React Hook Form integration
- ✅ Multi-image upload (4 images: 1 required, 3 optional)
- ✅ AWS S3 image storage
- ✅ Full validation with Zod
- ✅ Color and size selection
- ✅ Stock management
- ✅ Pricing (regular, sale, cost)
- ✅ Product dimensions and weight

## 📁 Files Created

### 1. Server Actions

- **`src/app/admin/_actions/variants.ts`** - Variant CRUD operations
- **`src/app/admin/_actions/filters.ts`** - Color and size fetching

### 2. Components

- **`src/app/admin/_forms/ProductVariant.tsx`** - Main form component
- **`src/components/VariantImageUpload.tsx`** - Multi-image upload component

### 3. Schema Updates

- **`src/lib/db/schema/variants.ts`** - Updated validation schema

## 🚀 Usage

### Creating a New Variant

```tsx
import ProductVariantForm from "@/app/admin/_forms/ProductVariant";

export default function NewVariantPage() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Create Product Variant</h1>
      <ProductVariantForm />
    </div>
  );
}
```

### Editing an Existing Variant

```tsx
import ProductVariantForm from "@/app/admin/_forms/ProductVariant";
import { getVariantById } from "@/app/admin/_actions/variants";

export default async function EditVariantPage({
  params,
}: {
  params: { id: string };
}) {
  const variant = await getVariantById(params.id);

  if (!variant) {
    return <div>Variant not found</div>;
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-2xl font-bold mb-6">Edit Product Variant</h1>
      <ProductVariantForm variant={variant} />
    </div>
  );
}
```

## 🎨 Features

### 1. Image Upload

- **4 image slots** total
- **First image required** (marked as primary by default)
- **3 additional optional images**
- **Star button** to change primary image
- **Drag & drop** support (via file input)
- **Preview** before upload
- **Auto-upload to S3** on form submission

### 2. Form Fields

#### Required Fields

- Product selection
- SKU (unique identifier)
- Price
- Color
- Size
- Stock quantity

#### Optional Fields

- Sale Price
- Cost Price
- Low Stock Threshold (default: 10)
- Max Quantity Per Order (default: 10)
- Weight (in kg)
- Dimensions (length, width, height in cm)

### 3. Validation

All fields are validated using Zod schema:

```typescript
{
  productId: UUID
  sku: string (min 1 char, unique)
  price: string (numeric)
  salePrice: string | null (optional)
  costPrice: string | null (optional)
  colorId: UUID
  sizeId: UUID
  inStock: number (non-negative)
  lowStockThreshold: number (non-negative)
  maxQuantityPerOrder: number (positive)
  weight: number | null
  dimensions: {
    length?: number
    width?: number
    height?: number
  } | null
}
```

### 4. Image Upload Flow

1. **User selects images** (up to 4)
2. **Preview shown** immediately
3. **On form submit:**
   - Form data validated
   - Images uploaded to S3
   - Variant created/updated in database
   - Image URLs saved to `product_variant_images` table
4. **Primary image** automatically set (marked with yellow star)

## 💾 Database Schema

### product_variants Table

```sql
{
  id: UUID (PK)
  productId: UUID (FK -> products)
  sku: TEXT (UNIQUE)
  price: NUMERIC(10,2)
  salePrice: NUMERIC(10,2) | NULL
  costPrice: NUMERIC(10,2) | NULL
  colorId: UUID (FK -> colors)
  sizeId: UUID (FK -> sizes)
  inStock: INTEGER (default: 0)
  lowStockThreshold: INTEGER (default: 10)
  maxQuantityPerOrder: INTEGER (default: 10)
  isActive: BOOLEAN (default: true)
  weight: REAL | NULL
  dimensions: JSONB | NULL
  createdAt: TIMESTAMP
}
```

### product_variant_images Table

```sql
{
  id: UUID (PK)
  variantId: UUID (FK -> product_variants, CASCADE)
  imageUrl: TEXT
  isPrimary: BOOLEAN (default: false)
  createdAt: TIMESTAMP
}
```

## 🔧 Server Actions API

### Variants

```typescript
// Get all variants
const variants = await getVariants();

// Get variant by ID
const variant = await getVariantById(id);

// Create variant
const newVariant = await addVariant(data);

// Update variant
const updated = await updateVariant(id, data);

// Soft delete variant
const deleted = await deleteVariant(id);
```

### Variant Images

```typescript
// Add images to variant
await addVariantImages(variantId, [
  { imageUrl: "https://...", isPrimary: true },
  { imageUrl: "https://...", isPrimary: false },
]);

// Get variant images
const images = await getVariantImages(variantId);

// Delete all variant images
await deleteVariantImages(variantId);
```

### Filters

```typescript
// Get all colors
const colors = await getColors();
// Returns: [{ id, name, slug, hexCode }]

// Get all sizes
const sizes = await getSizes();
// Returns: [{ id, name, slug, sortOrder }]
```

## 🎯 Example: Complete Form Submission

```typescript
const formData = {
  productId: "123e4567-e89b-12d3-a456-426614174000",
  sku: "NIKE-AIR-BLK-42",
  price: "129.99",
  salePrice: "99.99",
  costPrice: "60.00",
  colorId: "223e4567-e89b-12d3-a456-426614174111",
  sizeId: "323e4567-e89b-12d3-a456-426614174222",
  inStock: 50,
  lowStockThreshold: 10,
  maxQuantityPerOrder: 5,
  weight: 0.8,
  dimensions: {
    length: 30,
    width: 20,
    height: 12,
  },
};

// Images are handled automatically by the form
const images = [
  { file: File, isPrimary: true }, // Required
  { file: File, isPrimary: false }, // Optional
  { file: File, isPrimary: false }, // Optional
  { file: null, isPrimary: false }, // Empty slot
];
```

## 🎨 UI Features

### Color Selection

- Dropdown with color names
- **Live preview** showing selected color's hex code
- Color swatch displayed next to dropdown

### Image Upload

- **Grid layout** (2 columns on mobile, 4 on desktop)
- **Visual feedback** for each slot
- **Primary indicator** (yellow star and badge)
- **Remove button** on hover
- **Upload hints** for each slot

### Form Layout

- Responsive grid layout
- **Grouped related fields** (pricing, stock, dimensions)
- Clear validation messages
- Loading states during submission

## 🔒 Security Best Practices

1. **Server-side validation** - All data validated on server
2. **Unique SKU enforcement** - Database constraint prevents duplicates
3. **File type validation** - Only images allowed
4. **S3 presigned URLs** - Secure upload without exposing credentials
5. **SQL injection protection** - Drizzle ORM parameterized queries

## 🚨 Error Handling

The form handles various error scenarios:

```typescript
// Image validation
if (!hasAtLeastOneImage) {
  setImageError("At least one image is required");
  toast.error("Please upload at least one image");
  return;
}

// Upload failures
try {
  await uploadFileToS3(file);
} catch (error) {
  toast.error("Failed to upload image");
  // User can retry
}

// Database errors
try {
  await addVariant(data);
} catch (error) {
  toast.error("Failed to create variant");
  console.error(error);
}
```

## 📱 Responsive Design

- **Mobile**: Single column layout, 2 image columns
- **Tablet**: Mixed layout, 3-4 image columns
- **Desktop**: Full grid layout, 4 image columns

## 🔄 Workflow

1. **Admin navigates** to create/edit variant page
2. **Form loads** with dropdowns populated from database
3. **Admin fills** required fields
4. **Admin uploads** at least 1 image (up to 4)
5. **Admin clicks** submit
6. **Form validates** all fields
7. **Images upload** to S3
8. **Variant saved** to database
9. **Image URLs saved** to database
10. **Success toast** shown
11. **Redirect** to variants list

## 📊 Toast Notifications

- `toast.loading()` - While uploading/saving
- `toast.success()` - On successful save
- `toast.error()` - On validation/upload/save errors
- `toast.info()` - For informational messages

## 🎓 Tips

1. **SKU Format**: Use consistent format like `BRAND-PRODUCT-COLOR-SIZE`
2. **Primary Image**: Choose the best product angle
3. **Price Validation**: Ensure sale price < regular price
4. **Stock Alerts**: Set low stock threshold based on sales velocity
5. **Dimensions**: Useful for shipping calculations

## 🐛 Troubleshooting

### Images not uploading?

- Check AWS credentials in `.env`
- Verify S3 bucket permissions
- Check network console for errors

### Form not submitting?

- Check browser console for validation errors
- Ensure all required fields are filled
- Verify at least 1 image is uploaded

### Dropdown empty?

- Check database has colors/sizes/products
- Verify server actions are working
- Check console for fetch errors

---

**Note**: Make sure you have colors, sizes, and products in your database before creating variants!
