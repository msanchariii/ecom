import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import {
  s3Client,
  sanitizeFileName,
  getS3PublicUrl,
  isValidFileType,
} from "@/lib/upload/s3";

export async function POST(req: Request) {
  try {
    // Validate environment variables
    if (
      !process.env.AWS_REGION ||
      !process.env.AWS_ACCESS_KEY ||
      !process.env.AWS_SECRET_KEY ||
      !process.env.AWS_BUCKET_NAME
    ) {
      return Response.json(
        { error: "Missing AWS configuration" },
        { status: 500 },
      );
    }

    const { fileName, fileType } = await req.json();

    // Validate input
    if (!fileName || !fileType) {
      return Response.json(
        { error: "fileName and fileType are required" },
        { status: 400 },
      );
    }

    // Validate file type (optional: add allowed types)
    if (!isValidFileType(fileType)) {
      return Response.json(
        { error: "Invalid file type. Only IMAGES are allowed." },
        { status: 400 },
      );
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

    return Response.json({
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error("Error generating presigned URL:", error);
    return Response.json(
      { error: "Failed to generate upload URL" },
      { status: 500 },
    );
  }
}
