import { ImageIcon } from "lucide-react";
import { ChangeEvent, type ComponentProps, useRef } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Button } from "@ethereum-canonical-registry/ui/components/button";
import { useMutation } from "@tanstack/react-query";
import { useImageCompression } from "@/hooks/use-image-compression";
import { upload } from "@vercel/blob/client";
import { toast } from "sonner";
import { cn } from "@ethereum-canonical-registry/ui/lib/utils";

export function ImageUpload({
  name,
  maxSize = 5 * 1024 * 1024, // 3 MB
  className,
}: {
  name: string;
  maxSize?: number;
} & ComponentProps<"img">) {
  const ref = useRef<HTMLInputElement>(null);
  const { control, setError } = useFormContext();
  const { compressImages, isCompressing } = useImageCompression();

  const setPreview = useMutation({
    mutationFn: async (file: File) => URL.createObjectURL(file),
  });

  const { mutate, isPending } = useMutation({
    mutationFn: async (file: File) => {
      const compressedFile = await compressImages([file]);
      return upload(file.name, compressedFile?.[0]!.compressedFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
      });
    },
    onSuccess: (data) => {
      toast.success("Image uploaded successfully");
    },
    onError: (error) => {
      console.error("error", error);
      toast.error("Failed to upload image");
    },
  });

  return (
    <Controller
      control={control}
      name={name}
      render={({ field: { value, onChange, ...field } }) => {
        function handleChange(event: ChangeEvent<HTMLInputElement>) {
          const [file] = event.target.files ?? [];
          if (file) {
            if (file?.size >= maxSize) {
              setError(name!, {
                message: `Image file is too large. Max size is ${(
                  maxSize / 1024
                ).toFixed(2)} kb`,
              });
            } else {
              setPreview.mutate(file, {
                onSuccess: () =>
                  mutate(file, {
                    onSuccess: ({ url }) => onChange(url),
                  }),
              });
            }
          }
        }

        return (
          <div
            className={cn(
              "group relative h-32 cursor-pointer overflow-hidden",
              className,
            )}
            onClick={() => ref.current?.click()}
          >
            <Button
              disabled={isPending}
              size="icon"
              variant={"ghost"}
              icon={ImageIcon}
              isLoading={isPending}
              className="absolute bottom-1 right-1 rounded-full"
            />

            <div
              className={cn(
                "h-full rounded-3xl bg-gray-100 bg-cover bg-center bg-no-repeat transition-colors group-hover:bg-gray-50 dark:bg-gray-800 dark:group-hover:bg-gray-900",
                { ["animate-pulse opacity-50"]: isPending },
              )}
              style={{
                backgroundImage: `url("${setPreview.data ?? value}")`,
              }}
            />
            <input
              {...field}
              ref={ref}
              className="hidden"
              accept="image/png, image/jpeg"
              onChange={handleChange}
              type="file"
            />
          </div>
        );
      }}
    />
  );
}
