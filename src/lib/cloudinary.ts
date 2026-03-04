const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

/**
 * Returns true only when *real* (non-placeholder) credentials are present.
 * Placeholder strings left in .env.local will be treated as "not configured".
 */
export function isCloudinaryConfigured(): boolean {
  if (!CLOUD_NAME || !UPLOAD_PRESET) return false;
  if (CLOUD_NAME.startsWith("your_") || UPLOAD_PRESET.startsWith("your_")) return false;
  return true;
}

export interface CloudinaryUploadResult {
  secure_url: string;
  public_id: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

export async function uploadToCloudinary(
  file: File,
  folder = "zendo"
): Promise<CloudinaryUploadResult> {
  if (!isCloudinaryConfigured()) {
    throw new Error(
      "Cloudinary is not configured. " +
        "Open .env.local and replace the placeholder values for " +
        "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET " +
        "with your real Cloudinary cloud name and an unsigned upload preset. " +
        "Restart the dev server after saving."
    );
  }

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", UPLOAD_PRESET!);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: "POST", body: formData }
  );

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message ?? "Cloudinary upload failed");
  }

  return res.json();
}

export function cloudinaryUrl(
  publicId: string,
  opts: { width?: number; height?: number; crop?: string; quality?: string } = {}
): string {
  if (!CLOUD_NAME) return "";
  const transforms: string[] = [];
  if (opts.width) transforms.push(`w_${opts.width}`);
  if (opts.height) transforms.push(`h_${opts.height}`);
  if (opts.crop) transforms.push(`c_${opts.crop}`);
  transforms.push(`q_${opts.quality ?? "auto"}`);
  transforms.push("f_auto");
  const t = transforms.join(",");
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${t}/${publicId}`;
}
