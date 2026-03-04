"use client";

// ============================================================
// ImageUpload — Reusable Cloudinary image upload component
// Supports click-to-browse, drag-and-drop, preview,
// and remove. Works for banners, avatars, and blog images.
// ============================================================

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { uploadToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { Button } from "./button";
import { ImageIcon, Loader2, Upload, X, AlertCircle } from "lucide-react";

// Evaluated once at module load so it doesn't re-run on every render
const CLOUDINARY_READY = isCloudinaryConfigured();

export type ImageUploadAspect = "banner" | "square" | "auto";

interface ImageUploadProps {
  /** Current image URL (controlled) */
  value?: string;
  /** Called with the new Cloudinary secure_url after upload */
  onChange: (url: string) => void;
  /** Called when user explicitly removes the image */
  onRemove?: () => void;
  className?: string;
  /** Aspect ratio preset */
  aspect?: ImageUploadAspect;
  /** Cloudinary subfolder (e.g. "businesses", "services") */
  folder?: string;
  /** Placeholder text shown in the empty state */
  label?: string;
  /** Whether the component is disabled */
  disabled?: boolean;
}

const aspectClasses: Record<ImageUploadAspect, string> = {
  banner: "aspect-[16/5]",
  square: "aspect-square",
  auto: "min-h-30",
};

export function ImageUpload({
  value,
  onChange,
  onRemove,
  className,
  aspect = "banner",
  folder = "zendo",
  label = "Upload Image",
  disabled = false,
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (!CLOUDINARY_READY) {
        setError(
          "Cloudinary is not configured — set NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET in .env.local and restart the dev server."
        );
        return;
      }
      if (!file.type.startsWith("image/")) {
        setError("Please select a valid image file (PNG, JPG, WEBP, etc.).");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        setError("Image must be smaller than 10 MB.");
        return;
      }
      setError(null);
      setUploading(true);
      try {
        const result = await uploadToCloudinary(file, folder);
        onChange(result.secure_url);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed.");
      } finally {
        setUploading(false);
      }
    },
    [folder, onChange]
  );

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const onFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) handleFile(file);
      // Reset so the same file can be selected again
      e.target.value = "";
    },
    [handleFile]
  );

  return (
          <div className="space-y-1.5">
            {!CLOUDINARY_READY && (
              <div className="flex items-center gap-2 p-2 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
                <AlertCircle className="w-4 h-4" />
                Cloudinary not configured — uploads are disabled. Set `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` in your `.env.local`, then restart the dev server.
              </div>
            )}
      <div
        className={cn(
          "relative group rounded-xl overflow-hidden border border-border bg-muted/30",
          aspectClasses[aspect],
          className
        )}
      >
        {value ? (
          /* ── Preview state ── */
          <>
            <Image
              src={value}
              alt="Uploaded image"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 50vw"
            />
            {/* Overlay controls on hover */}
            {!disabled && (
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 z-10">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={() => inputRef.current?.click()}
                  disabled={uploading}
                  className="gap-1.5 shadow-lg"
                >
                  {uploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  {uploading ? "Uploading…" : "Change"}
                </Button>
                {onRemove && (
                  <Button
                    type="button"
                    size="sm"
                    variant="destructive"
                    onClick={onRemove}
                    disabled={uploading}
                    className="gap-1.5 shadow-lg"
                  >
                    <X className="w-3.5 h-3.5" />
                    Remove
                  </Button>
                )}
              </div>
            )}
          </>
        ) : (
          /* ── Empty / drop zone state ── */
          <button
            type="button"
            onClick={() => !disabled && inputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              if (!disabled) setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            disabled={disabled || uploading || !CLOUDINARY_READY}
            className={cn(
              "w-full h-full flex flex-col items-center justify-center gap-2",
              "text-muted-foreground hover:text-foreground",
              "hover:bg-muted/60 transition-colors cursor-pointer",
              dragOver && "bg-primary/10 border-primary text-primary",
              (disabled || uploading) && "cursor-not-allowed opacity-60",
              aspect === "auto" && "min-h-30 py-6"
            )}
          >
            {uploading ? (
              <>
                <Loader2 className="w-7 h-7 animate-spin text-primary" />
                <span className="text-sm font-medium">Uploading…</span>
              </>
            ) : (
              <>
                <ImageIcon className="w-7 h-7" />
                <span className="text-sm font-medium">{label}</span>
                <span className="text-xs opacity-60">
                  {dragOver ? "Drop to upload" : "PNG, JPG, WEBP · max 10 MB"}
                </span>
              </>
            )}
          </button>
        )}
      </div>

      {/* Inline error */}
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onFileChange}
        disabled={disabled}
      />
    </div>
  );
}
