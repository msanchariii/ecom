"use client";

import { useState, useEffect } from "react";
import axios from "axios";

interface UploadResponse {
  uploadUrl: string;
  publicUrl: string;
  key: string;
}

async function uploadFile(file: File): Promise<string> {
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

export default function Upload() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset copied state after showing notification
  useEffect(() => {
    if (copied) {
      const timer = setTimeout(() => setCopied(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [copied]);

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Just set the file for preview, don't upload yet
    setSelectedFile(file);
    setError(null);
    setUploadedUrl(null);

    // Create preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  }

  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        setSelectedFile(file);
        setError(null);
        setUploadedUrl(null);

        // Create preview URL
        const objectUrl = URL.createObjectURL(file);
        setPreviewUrl(objectUrl);
      } else {
        setError("Please upload an image file");
      }
    }
  }

  async function handleUploadClick() {
    if (!selectedFile) return;

    setUploading(true);
    setError(null);

    try {
      const url = await uploadFile(selectedFile);
      setUploadedUrl(url);
      console.log("Uploaded at:", url);

      // Clear the selected file after successful upload
      setSelectedFile(null);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  }

  function handleRemoveFile() {
    setSelectedFile(null);
    setError(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="bg-linear-to-r from-blue-500 to-purple-600 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Upload Image</h2>
          <p className="text-blue-100 text-sm mt-1">
            Supports: JPG, PNG, WebP, AVIF, GIF
          </p>
        </div>

        <div className="p-6">
          {/* Upload Area - Show when no file selected */}
          {!selectedFile && !uploadedUrl && (
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 transition-all duration-200 ${
                dragActive
                  ? "border-blue-500 bg-blue-50"
                  : "border-gray-300 bg-gray-50 hover:border-gray-400"
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <input
                type="file"
                onChange={handleChange}
                accept="image/*"
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                id="file-upload"
              />

              <div className="text-center">
                <div className="flex flex-col items-center gap-3">
                  <svg
                    className="w-16 h-16 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                    />
                  </svg>
                  <div>
                    <label
                      htmlFor="file-upload"
                      className="cursor-pointer text-blue-600 hover:text-blue-700 font-semibold"
                    >
                      Click to upload
                    </label>
                    <span className="text-gray-600"> or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">
                    Maximum file size: 10MB
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* File Preview - Show when file selected but not uploaded */}
          {selectedFile && previewUrl && !uploadedUrl && (
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-700">
                    Selected Image:
                  </h4>
                  <button
                    onClick={handleRemoveFile}
                    className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                    title="Remove file"
                  >
                    <svg
                      className="w-5 h-5 text-gray-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                <div className="relative rounded-lg overflow-hidden bg-white border border-gray-200 mb-3">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>

                <div className="flex items-center justify-between text-xs text-gray-600 mb-4">
                  <span className="font-medium">{selectedFile.name}</span>
                  <span>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>

                <button
                  onClick={handleUploadClick}
                  disabled={uploading}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                      </svg>
                      <span>Upload to S3</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-red-800">
                  Upload Failed
                </h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Success Message with Preview */}
          {uploadedUrl && (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
                <svg
                  className="w-5 h-5 text-green-500 shrink-0"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-800">
                    Upload Successful!
                  </h3>
                  <p className="text-sm text-green-700 mt-1">
                    Your image has been uploaded to S3
                  </p>
                </div>
              </div>

              {/* Image Preview */}
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h4 className="text-sm font-semibold text-gray-700 mb-3">
                  Uploaded Image:
                </h4>
                <div className="relative rounded-lg overflow-hidden bg-white border border-gray-200">
                  <img
                    src={uploadedUrl}
                    alt="Uploaded"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="text"
                    value={uploadedUrl}
                    readOnly
                    className="flex-1 px-3 py-2 text-xs bg-white border border-gray-300 rounded-md text-gray-600 select-all"
                  />
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(uploadedUrl);
                      setCopied(true);
                    }}
                    className={`px-4 py-2 text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                      copied
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-blue-600 hover:bg-blue-700"
                    }`}
                  >
                    {copied ? "✓ Copied!" : "Copy URL"}
                  </button>
                </div>

                <button
                  onClick={() => setUploadedUrl(null)}
                  className="w-full mt-3 py-2.5 bg-gray-600 hover:bg-gray-700 text-white font-medium rounded-lg transition-colors"
                >
                  Upload Another Image
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
