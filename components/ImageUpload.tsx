"use client";

import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";
import Image from "next/image";

interface ImageUploadProps {
  onUpload: (imageUrls: string[]) => void;
  existingImages: string[];
  maxImages: number;
}

export function ImageUpload({ onUpload, existingImages, maxImages }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (existingImages.length + acceptedFiles.length > maxImages) {
        alert(`Maximum ${maxImages} images allowed`);
        return;
      }

      setUploading(true);
      const imageUrls: string[] = [];

      try {
        for (const file of acceptedFiles) {
          // Convert to base64 for MVP (in production, upload to storage)
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              resolve(result);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          imageUrls.push(base64);
        }

        await onUpload(imageUrls);
      } catch (error) {
        console.error("Upload error:", error);
        alert("Failed to upload images");
      } finally {
        setUploading(false);
      }
    },
    [onUpload, existingImages.length, maxImages]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/*": [".png", ".jpg", ".jpeg", ".webp"],
    },
    maxFiles: maxImages - existingImages.length,
    disabled: uploading || existingImages.length >= maxImages,
  });

  return (
    <div className="space-y-4">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? "border-blue-500 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        } ${existingImages.length >= maxImages ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <input {...getInputProps()} />
        <Upload className="w-12 h-12 mx-auto text-gray-400 mb-4" />
        {existingImages.length >= maxImages ? (
          <p className="text-gray-500">Maximum {maxImages} images reached</p>
        ) : (
          <>
            <p className="text-gray-700 font-medium mb-2">
              {isDragActive ? "Drop images here" : "Drag & drop images or click to select"}
            </p>
            <p className="text-sm text-gray-500">
              Upload up to {maxImages - existingImages.length} more image
              {maxImages - existingImages.length !== 1 ? "s" : ""} (PNG, JPG, WEBP)
            </p>
          </>
        )}
      </div>

      {existingImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {existingImages.map((url, index) => (
            <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-gray-200">
              <Image src={url} alt={`Note ${index + 1}`} fill className="object-cover" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
