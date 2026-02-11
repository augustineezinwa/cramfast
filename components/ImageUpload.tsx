"use client";

import { useCallback, useState } from "react";
import { FileRejection, useDropzone } from "react-dropzone";
import { Loader2, Upload } from "lucide-react";
import Image from "next/image";
import { compressImageToKB } from "@/lib/compressImage";

interface ImageUploadProps {
  onUpload: (imageUrls: string[]) => void;
  existingImages: string[];
  maxImages: number;
}

const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024;
const MAX_COMPRESSED_SIZE_KB = 1024;

export function ImageUpload({ onUpload, existingImages, maxImages }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      setUploadError(null);
      if (existingImages.length + acceptedFiles.length > maxImages) {
        setUploadError(
          `Upload exceeds limit. You can only upload up to ${maxImages} images per session.`
        );
        return;
      }

      setUploading(true);
      setUploadingCount(acceptedFiles.length);
      const imageUrls: string[] = [];

      try {
        for (const file of acceptedFiles) {
          if (file.size > MAX_FILE_SIZE_BYTES) {
            throw new Error(
              `${file.name} is too large (${(file.size / (1024 * 1024)).toFixed(2)}MB). Max allowed size is 5MB per image.`
            );
          }

          let fileToUpload = file;
          if (fileToUpload.size > MAX_COMPRESSED_SIZE_KB * 1024) {
            fileToUpload = await compressImageToKB(fileToUpload, MAX_COMPRESSED_SIZE_KB * 2);
          }

          if (fileToUpload.size > MAX_COMPRESSED_SIZE_KB * 1024) {
            throw new Error(
              `${file.name} could not be compressed below 1MB. Please use a clearer or smaller image.`
            );
          }

          // Convert to base64 for MVP (in production, upload to storage)
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result);
            };
            reader.onerror = () => reject(new Error(`Failed to read file: ${fileToUpload.name}`));
            reader.readAsDataURL(fileToUpload);
          });
          imageUrls.push(base64);
        }

        await onUpload(imageUrls);
      } catch (error: any) {
        console.error("Upload error:", error);
        const message =
          error?.message ||
          "Image upload failed. Please ensure files are valid image types and can be compressed to 1MB.";
        setUploadError(message);
      } finally {
        setUploading(false);
        setUploadingCount(0);
      }
    },
    [onUpload, existingImages.length, maxImages]
  );

  const onDropRejected = useCallback(
    (fileRejections: FileRejection[]) => {
      if (!fileRejections.length) return;

      const firstRejection = fileRejections[0];
      const firstError = firstRejection.errors[0];

      if (firstError?.code === "file-too-large") {
        setUploadError(
          `${firstRejection.file.name} is too large. Maximum file size is 5MB per image.`
        );
        return;
      }

      if (firstError?.code === "file-invalid-type") {
        setUploadError(
          `${firstRejection.file.name} has an unsupported file type. Please upload a valid image file (PNG, JPG, JPEG, WEBP, GIF, BMP, TIFF, HEIC, HEIF, or AVIF).`
        );
        return;
      }

      if (firstError?.code === "too-many-files") {
        setUploadError(
          `Too many files selected. You can upload up to ${maxImages - existingImages.length} more image(s).`
        );
        return;
      }

      setUploadError(firstError?.message || "Upload failed. Please try again.");
    },
    [existingImages.length, maxImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: {
      "image/*": [],
    },
    maxFiles: maxImages - existingImages.length,
    maxSize: MAX_FILE_SIZE_BYTES,
    disabled: uploading || existingImages.length >= maxImages,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 min-h-[48vh] flex flex-col items-center justify-center text-center cursor-pointer transition-colors ${isDragActive
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600 dark:bg-gray-900"
          } ${existingImages.length >= maxImages ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <Loader2 className="w-12 h-12 mx-auto text-blue-600 dark:text-blue-400 mb-4 animate-spin" />
        ) : (
          <Upload className="w-12 h-12 mx-auto text-gray-400 dark:text-gray-500 mb-4" />
        )}
        {existingImages.length >= maxImages ? (
          <p className="text-gray-500 dark:text-gray-400">Maximum {maxImages} images reached</p>
        ) : uploading ? (
          <>
            <p className="text-gray-700 dark:text-gray-200 font-medium mb-2">
              Uploading {uploadingCount} image{uploadingCount === 1 ? "" : "s"}...
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Please wait while your images are being processed.
            </p>
          </>
        ) : (
          <>
            <p className="text-gray-700 dark:text-gray-200 font-medium mb-2">
              {isDragActive ? "Drop images here" : "Drag & drop images or click to select"}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Upload up to {maxImages - existingImages.length} more image
              {maxImages - existingImages.length !== 1 ? "s" : ""} (any image type, compressed to 1MB)
            </p>
          </>
        )}
      </div>

      {uploadError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300">
          {uploadError}
        </div>
      )}

      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {existingImages.map((url, index) => (
            <div
              key={index}
              className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
            >
              <Image src={url} alt={`Note ${index + 1}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
