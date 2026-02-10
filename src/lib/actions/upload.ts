// upload function of one or more files to S3
// returns as an array of objects with the following properties:
// - uploadUrl: the signed URL to upload the file to S3
// - publicUrl: the public URL of the uploaded file (without query parameters)
// - key: the S3 key of the uploaded file
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  s3Client,
  sanitizeFileName,
  getS3PublicUrl,
  isValidFileType,
} from "@/lib/upload/s3";
import { PutObjectCommand } from "@aws-sdk/client-s3";

export type UploadResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
};

export async function generateUploadUrl(
  fileName: string,
  fileType: string,
): Promise<UploadResponse> {
  // Validate environment variables
  if (
    !process.env.AWS_REGION ||
    !process.env.AWS_ACCESS_KEY ||
    !process.env.AWS_SECRET_KEY ||
    !process.env.AWS_BUCKET_NAME
  ) {
    throw new Error("Missing AWS configuration");
  }

  // Validate file type (optional: add allowed types)
  if (!isValidFileType(fileType)) {
    throw new Error("Invalid file type. Only IMAGES are allowed.");
  }

  const sanitizedFileName = sanitizeFileName(fileName);
  const key = `uploads/${Date.now()}-${sanitizedFileName}`;

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_BUCKET_NAME!,
    Key: key,
    ContentType: fileType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 }); // 5 minutes
  // Construct the public URL (without query parameters)
  const publicUrl = getS3PublicUrl(key);

  return {
    uploadUrl,
    publicUrl,
    key,
  };
}
