import axios from "axios";

interface UploadResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

/**
 * Uploads a file to S3 using presigned URL
 * @param file - The file to upload
 * @returns The public URL of the uploaded file
 */
export async function uploadFileToS3(file: File): Promise<string> {
  try {
    // 1. Get presigned URL from API
    const { data } = await axios.post<UploadResponse>("/api/upload", {
      fileName: file.name,
      fileType: file.type,
    });

    const { uploadUrl, publicUrl } = data;

    // 2. Upload directly to S3 using presigned URL
    await axios.put(uploadUrl, file, {
      headers: {
        "Content-Type": file.type,
      },
    });

    return publicUrl;
  } catch (error) {
    console.error("Upload error:", error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || "Failed to upload file");
    }
    throw error;
  }
}

/**
 * Deletes a file from S3
 * @param url - The S3 URL of the file to delete
 * @returns Success status
 */
export async function deleteFileFromS3(url: string): Promise<boolean> {
  try {
    // Extract the key from the S3 URL
    const key = extractS3Key(url);
    if (!key) {
      console.warn("Invalid S3 URL, cannot extract key:", url);
      return false;
    }

    await axios.delete("/api/upload", {
      data: { key },
    });

    return true;
  } catch (error) {
    console.error("Delete error:", error);
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.error || "Failed to delete file");
    }
    throw error;
  }
}

/**
 * Extracts the S3 key from a public URL
 * @param url - The S3 public URL
 * @returns The S3 key or null if invalid
 */
export function extractS3Key(url: string): string | null {
  if (!url || !url.includes(".amazonaws.com/")) {
    return null;
  }

  try {
    const parts = url.split(".amazonaws.com/");
    return parts[1] || null;
  } catch {
    return null;
  }
}

/**
 * Replaces an old S3 file with a new one
 * Deletes the old file and uploads the new one
 * @param oldUrl - The URL of the old file to replace (can be null)
 * @param newFile - The new file to upload
 * @returns The public URL of the newly uploaded file
 */
export async function replaceFileInS3(
  oldUrl: string | null | undefined,
  newFile: File,
): Promise<string> {
  // Upload new file first
  const newUrl = await uploadFileToS3(newFile);

  // Delete old file if it exists (don't fail if delete fails)
  if (oldUrl) {
    try {
      await deleteFileFromS3(oldUrl);
    } catch (error) {
      console.error("Failed to delete old file:", error);
      // Continue even if delete fails
    }
  }

  return newUrl;
}
