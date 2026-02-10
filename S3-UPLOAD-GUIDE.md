# S3 Upload with Presigned URLs - Setup Guide

## Overview

This application uses AWS S3 with presigned URLs for secure, direct-to-S3 file uploads. This approach keeps your AWS credentials secure on the server while allowing clients to upload files directly to S3.

## How It Works

1. **Client requests upload URL** → `/api/upload`
2. **Server generates presigned URL** → Returns temporary upload URL
3. **Client uploads directly to S3** → Using the presigned URL
4. **Server returns public URL** → For accessing the uploaded file

## Architecture

```
Client (Upload.tsx)
    ↓ POST /api/upload {fileName, fileType}
API Route (route.ts)
    ↓ Generate presigned URL
AWS S3
    ↓ Upload file
Public URL → https://bucket.s3.region.amazonaws.com/uploads/...
```

## Setup Instructions

### 1. AWS S3 Configuration

Create an S3 bucket with the following settings:

**Bucket Policy** (replace `YOUR_BUCKET_NAME`):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadGetObject",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

**CORS Configuration**:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedOrigins": ["*"],
    "ExposeHeaders": ["ETag"]
  }
]
```

### 2. IAM User Permissions

Create an IAM user with these permissions:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/*"
    }
  ]
}
```

### 3. Environment Variables

Copy `.env.example` to `.env.local` and fill in your AWS credentials:

```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY=your_access_key_here
AWS_SECRET_KEY=your_secret_key_here
AWS_BUCKET_NAME=your_bucket_name_here
```

### 4. Install Dependencies

```bash
npm install @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

## Usage Example

```tsx
import Upload from "@/lib/upload/Upload";

export default function MyPage() {
  return (
    <div>
      <h1>Upload Image</h1>
      <Upload />
    </div>
  );
}
```

## File Structure

```
src/
├── app/api/upload/
│   └── route.ts          # API endpoint for generating presigned URLs
├── lib/upload/
│   ├── Upload.tsx        # React component for file uploads
│   └── s3.ts            # S3 client and utility functions
```

## Security Features

✅ **File type validation** - Only allows specified image formats
✅ **File name sanitization** - Prevents path traversal attacks
✅ **Presigned URL expiration** - URLs expire after 5 minutes
✅ **Environment variable validation** - Checks AWS config on startup
✅ **Error handling** - Comprehensive try-catch blocks

## API Reference

### POST `/api/upload`

**Request Body:**

```json
{
  "fileName": "image.jpg",
  "fileType": "image/jpeg"
}
```

**Response:**

```json
{
  "uploadUrl": "https://bucket.s3.amazonaws.com/uploads/...?X-Amz-...",
  "publicUrl": "https://bucket.s3.amazonaws.com/uploads/1234567890-image.jpg",
  "key": "uploads/1234567890-image.jpg"
}
```

**Error Responses:**

- `400` - Missing or invalid parameters
- `500` - Server error or missing AWS configuration

## Allowed File Types

- `image/jpeg`
- `image/png`
- `image/webp`
- `image/avif`
- `image/gif`

To modify, edit the `isValidFileType` function in `s3.ts`.

## Troubleshooting

### Upload fails with CORS error

- Check your S3 bucket CORS configuration
- Ensure allowed origins include your domain

### "Missing AWS configuration" error

- Verify all environment variables are set in `.env.local`
- Restart your Next.js development server

### Files upload but return 403 when accessing

- Check your bucket policy allows public read access
- Ensure the public URL is constructed correctly

### Presigned URL expired

- Default expiration is 5 minutes
- Adjust `expiresIn` parameter in `route.ts` if needed

## Best Practices

1. **Use environment-specific buckets** - Different buckets for dev/staging/prod
2. **Enable S3 versioning** - Protect against accidental deletions
3. **Set up lifecycle policies** - Auto-delete old/incomplete uploads
4. **Monitor costs** - Set up AWS billing alerts
5. **Use CloudFront** - Add CDN for better performance (optional)

## Future Improvements

- [ ] Add file size validation
- [ ] Support multiple file uploads
- [ ] Add progress indicators
- [ ] Implement image optimization/resizing
- [ ] Add upload retry logic
- [ ] Support for video files
- [ ] Implement file deletion endpoint

# S3 Bucket Setup Guide for Next.js Image Uploads

This guide explains how to configure an AWS S3 bucket to work with a Next.js (serverless) application using presigned URLs for secure and scalable image uploads.

---

## 1. Create the S3 Bucket

1. Open AWS Console → S3
2. Click **Create bucket**
3. Configure:
   - **Bucket name:** choose a globally unique name (e.g. `your-project-uploads`)
   - **Region:** select the closest region (e.g. `ap-south-1` for India)

4. Keep default settings and create the bucket.

---

## 2. Create an IAM User (Do NOT use root keys)

1. Go to **IAM → Users → Create user**
2. Name: `nextjs-s3-user`
3. Attach permissions:
   - Either **AmazonS3FullAccess** (quick start)
   - Or a safer custom policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject"],
      "Resource": "arn:aws:s3:::your-bucket-name/uploads/*"
    }
  ]
}
```

4. Create **Access Key** → choose _Application outside AWS_
5. Copy:
   - Access Key ID
   - Secret Access Key

---

## 3. Configure Environment Variables

Create `.env.local` in Next.js:

```env
AWS_REGION=ap-south-1
AWS_ACCESS_KEY=YOUR_KEY
AWS_SECRET_KEY=YOUR_SECRET
AWS_BUCKET_NAME=your-bucket-name
```

---

## 4. Configure CORS for Direct Browser Upload

S3 → Bucket → Permissions → CORS:

```json
[
  {
    "AllowedHeaders": ["*"],
    "AllowedMethods": ["PUT", "POST", "GET"],
    "AllowedOrigins": ["http://localhost:3000"],
    "ExposeHeaders": ["ETag"]
  }
]
```

Add production domain later.

---

## 5. Allow Public READ Only for /uploads

### Disable restrictive block settings

Bucket → Permissions → Block Public Access

Uncheck ONLY:

- Block public access granted through new public bucket policies
- Block public and cross-account access through any public policies

### Add Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadOnlyUploads",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::your-bucket-name/uploads/*"
    }
  ]
}
```

---

## 6. Recommended Folder Structure

```
/uploads/products/   → public images
/uploads/banners/    → public
/private/invoices/   → signed URLs only
/private/users/      → signed only
```

---

## 7. Next.js Upload Flow Summary

1. Client requests presigned URL from API
2. API generates signed PUT URL
3. Browser uploads directly to S3
4. Store final public URL in DB

---

## Notes

- Use fetch instead of Axios for S3 PUT
- Re-uploading with same key overwrites file
- Add CloudFront later for caching
- Never expose root credentials

---

You are now ready for production-grade image upl
