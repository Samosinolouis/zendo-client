"use client";

import { useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

/**
 * Invisible sentinel element that calls `onVisible` when it scrolls into view.
 * Place it at the bottom of a list to trigger loading more items.
 */
export function InfiniteScrollTrigger({
  onVisible,
  disabled = false,
}: {
  readonly onVisible: () => void;
  readonly disabled?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) onVisible();
      },
      { rootMargin: "120px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [onVisible, disabled]);

  return <div ref={ref} aria-hidden />;
}

/** Spinner row shown while loading the next page */
export function LoadingMoreIndicator() {
  return (
    <div className="flex items-center justify-center py-6 text-muted-foreground gap-2">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm">Loading more…</span>
    </div>
  );
}
