"use client";
import { useState, useEffect } from "react";
import { Upload, X, ImageIcon } from "lucide-react";

export interface ImageUploadProps {
  /** Current image URL (for edit mode) */
  currentImageUrl?: string | null;
  /** Callback when file is selected */
  onFileSelect: (file: File | null) => void;
  /** Optional label for the upload area */
  label?: string;
  /** Optional helper text */
  helperText?: string;
  /** Whether the field is required */
  required?: boolean;
  /** Optional error message to display */
  error?: string | null;
  /** Custom accepted file types */
  accept?: string;
}

/**
 * Reusable Image Upload Component
 * Handles drag-and-drop, file selection, preview, and removal
 * Does NOT upload automatically - upload is triggered by parent component
 */
export default function ImageUpload({
  currentImageUrl,
  onFileSelect,
  label = "Image",
  helperText = "Upload an image (PNG, JPG, GIF, WebP or AVIF)",
  required = false,
  error = null,
  accept = "image/*",
}: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    currentImageUrl || null,
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  // Cleanup preview URL on unmount
  useEffect(() => {
    return () => {
      if (previewUrl && !previewUrl.startsWith("http")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Update preview when currentImageUrl changes (for edit mode)
  useEffect(() => {
    if (currentImageUrl && !selectedFile) {
      setPreviewUrl(currentImageUrl);
    }
  }, [currentImageUrl, selectedFile]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file);
  };

  const handleFile = (file: File | undefined) => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Cleanup old preview URL if it exists
    if (previewUrl && !previewUrl.startsWith("http")) {
      URL.revokeObjectURL(previewUrl);
    }

    // Create new preview URL
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
    setSelectedFile(file);
    setFileName(file.name);

    // Notify parent
    onFileSelect(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    handleFile(file);
  };

  const handleRemove = () => {
    // Cleanup preview URL
    if (previewUrl && !previewUrl.startsWith("http")) {
      URL.revokeObjectURL(previewUrl);
    }

    setPreviewUrl(null);
    setSelectedFile(null);
    setFileName(null);

    // Notify parent
    onFileSelect(null);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>

      {!previewUrl ? (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : error
                ? "border-red-300 hover:border-red-400"
                : "border-gray-300 hover:border-gray-400"
          }`}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-12 h-12 text-gray-400" />
            <p className="text-sm text-gray-600">
              <span className="font-medium text-blue-600">Click to upload</span>{" "}
              or drag and drop
            </p>
            <p className="text-xs text-gray-500">{helperText}</p>
          </div>
        </div>
      ) : (
        <div
          className={`relative border-2 rounded-lg p-4 ${
            error ? "border-red-300" : "border-gray-200"
          }`}
        >
          <div className="flex items-center gap-4">
            <div className="shrink-0 h-24 w-24 bg-gray-50 rounded-lg overflow-hidden flex items-center justify-center">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-full max-w-full object-contain"
                />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate text-wrap">
                {fileName || "Current image"}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedFile
                  ? "Ready to upload when you save"
                  : currentImageUrl && (
                      <span className="truncate text-wrap block">
                        {currentImageUrl}
                      </span>
                    )}
              </p>
            </div>
            <button
              type="button"
              onClick={handleRemove}
              className="shrink-0 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}

      {!error && helperText && !previewUrl && (
        <p className="mt-1 text-xs text-gray-500">{helperText}</p>
      )}
    </div>
  );
}
