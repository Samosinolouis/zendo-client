"use client";

import React, { createContext, useContext, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";

// ── Types ─────────────────────────────────────────────────────

interface ToastContextType {
  /** Show a green success toast */
  showSuccess: (message: string, description?: string) => void;
  /** Show a red error toast. Falls back to "Something went wrong." */
  showError: (message?: string, description?: string) => void;
  /** Show an amber warning toast */
  showWarning: (message: string, description?: string) => void;
}

// ── Context ───────────────────────────────────────────────────

const ToastContext = createContext<ToastContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const showSuccess = useCallback((message: string, description?: string) => {
    toast.success(message, { description });
  }, []);

  const showError = useCallback(
    (message?: string, description?: string) => {
      toast.error(message ?? "Something went wrong.", { description });
    },
    []
  );

  const showWarning = useCallback((message: string, description?: string) => {
    toast.warning(message, { description });
  }, []);

  const value = useMemo(
    () => ({ showSuccess, showError, showWarning }),
    [showSuccess, showError, showWarning]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      {/* Mount the toaster once at the provider level */}
      <Toaster position="bottom-right" richColors closeButton />
    </ToastContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────

export function useToast(): ToastContextType {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used inside <ToastProvider>");
  }
  return ctx;
}
