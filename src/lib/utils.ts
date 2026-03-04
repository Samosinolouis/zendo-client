import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency?: string): string {
  const cur = currency ?? "PHP";
  return new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: cur,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export function formatDateTime(dateString: string): string {
  const d = new Date(dateString);
  const date = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  const time = d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
  return `${date} at ${time}`;
}

export function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case "completed":
    case "paid":
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
    case "confirmed":
    case "active":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400";
    case "pending":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    case "cancelled":
    case "failed":
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
    default:
      return "bg-muted text-muted-foreground";
  }
}

export function getInitials(first?: string | null, last?: string | null): string {
  const f = (first ?? "").trim();
  const l = (last ?? "").trim();
  if (!f && !l) return "?";
  const a = f ? f[0] : "";
  let b = l ? l[0] : "";
  if (!b && f && f.length > 1) b = f[1];
  const initials = `${a}${b}`.toUpperCase();
  return initials || "?";
}
