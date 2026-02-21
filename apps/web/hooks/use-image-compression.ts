import { useState, useCallback } from "react";

interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  outputFormat?: "image/jpeg" | "image/png" | "image/webp";
}

interface CompressionResult {
  compressedFile: File;
  originalSize: number;
  compressedSize: number;
  compressionRatio: number;
}

interface UseImageCompressionReturn {
  compressImage: (
    file: File,
    options?: CompressionOptions,
  ) => Promise<CompressionResult>;
  compressImages: (
    files: File[],
    options?: CompressionOptions,
  ) => Promise<CompressionResult[]>;
  isCompressing: boolean;
  compressionProgress: number;
}

export function useImageCompression(): UseImageCompressionReturn {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressionProgress, setCompressionProgress] = useState(0);

  const compressImage = useCallback(
    async (
      file: File,
      options: CompressionOptions = {},
    ): Promise<CompressionResult> => {
      const {
        maxWidth = 1024,
        maxHeight = 1024,
        quality = 0.7,
        outputFormat = "image/jpeg",
      } = options;

      return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (e) => {
          const img = new Image();
          img.src = e.target?.result as string;

          img.onload = () => {
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            if (!ctx) {
              reject(new Error("Canvas context not available"));
              return;
            }

            // Calculate new dimensions while preserving aspect ratio
            let newWidth = img.width;
            let newHeight = img.height;

            if (img.width > maxWidth) {
              newWidth = maxWidth;
              newHeight = (img.height * maxWidth) / img.width;
            }

            if (newHeight > maxHeight) {
              newWidth = (newWidth * maxHeight) / newHeight;
              newHeight = maxHeight;
            }

            canvas.width = newWidth;
            canvas.height = newHeight;

            // Draw the image on canvas
            ctx.drawImage(img, 0, 0, newWidth, newHeight);

            // Convert canvas to blob
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error("Failed to compress image"));
                  return;
                }

                const compressedFile = new File([blob], file.name, {
                  type: outputFormat,
                  lastModified: new Date().getTime(),
                });

                const originalSize = file.size;
                const compressedSize = compressedFile.size;
                const compressionRatio = compressedSize / originalSize;

                resolve({
                  compressedFile,
                  originalSize,
                  compressedSize,
                  compressionRatio,
                });
              },
              outputFormat,
              quality,
            );
          };

          img.onerror = () => {
            reject(new Error("Failed to load image"));
          };
        };

        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };

        reader.readAsDataURL(file);
      });
    },
    [],
  );

  const compressImages = useCallback(
    async (
      files: File[],
      options: CompressionOptions = {},
    ): Promise<CompressionResult[]> => {
      setIsCompressing(true);
      setCompressionProgress(0);

      const results: CompressionResult[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file) {
          try {
            const result = await compressImage(file, options);
            results.push(result);
            setCompressionProgress(((i + 1) / files.length) * 100);
          } catch (error) {
            console.error(`Failed to compress image ${file.name}:`, error);
            // Continue with the original file if compression fails
            results.push({
              compressedFile: file,
              originalSize: file.size,
              compressedSize: file.size,
              compressionRatio: 1,
            });
          }
        }
      }

      setIsCompressing(false);
      setCompressionProgress(0);

      return results;
    },
    [compressImage],
  );

  return {
    compressImage,
    compressImages,
    isCompressing,
    compressionProgress,
  };
}
