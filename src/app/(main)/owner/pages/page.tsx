"use client";

// ================================================================
// Owner Pages — /owner/pages
// ProseMirror-compatible block editor for service pages.
//
// Supported nodes (13):
//   Text:        heading · paragraph · quote · callout
//   Media:       image · gallery · video
//   Layout:      divider · list · steps · stats
//   Interactive: cta · serviceForm
//
// Features:
//   • Categorised block picker
//   • Per-node rich editors with add/remove sub-items
//   • Live preview mode
//   • Draft / Published toggle
//   • Tags input
//   • Delete page
//   • Auto-migration from legacy block format
// ================================================================

import {
  useState,
  useMemo,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import type { GraphQLError } from "@/lib/graphql-client";
import { useToast } from "@/providers/ToastProvider";
import { GET_SERVICES, GET_SERVICE_PAGE } from "@/graphql/queries";
import { UPSERT_SERVICE_PAGE, DELETE_SERVICE_PAGE } from "@/graphql/mutations";
import { ImageUpload } from "@/components/ui/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Service, ServicePage, Connection } from "@/types";
import {
  Search, Plus, Eye, EyeOff, Save, Loader2, CheckCircle,
  ChevronUp, ChevronDown, Trash2, Globe, FileText, BookOpen, Tag,
  Heading2, AlignLeft, Quote, Info,
  Image as ImageIcon, LayoutGrid, Video,
  Minus, List, ListOrdered, BarChart2, Zap, ClipboardList,
  X as XIcon,
  AlertTriangle, CheckCircle2, AlertCircle,
  ExternalLink, Clock, Users, Star,
  ZoomIn, ChevronLeft, ChevronRight, X as LightboxClose,
} from "lucide-react";
import { cn } from "@/lib/utils";

function resolveGqlError(err: GraphQLError): string {
  const code = err.extensions?.code;
  const messages: Record<string, string> = {
    NOT_FOUND:         "Resource not found.",
    UNAUTHORIZED:      "You are not authorised to do that.",
    VALIDATION_ERROR:  "Invalid input. Please check your fields and try again.",
  };
  return (code && messages[code]) ?? err.message ?? "Something went wrong.";
}
import type {
  PageNode,
  PageNodeType,
  PagePayload,
  HeadingNode,
  ParagraphNode,
  QuoteNode,
  CalloutNode,
  ImageNode,
  GalleryNode,
  VideoNode,
  DividerNode,
  ListNode,
  StepsNode,
  StatsNode,
  CtaNode,
  ServiceFormNode,
  ListItem,
  StepItem,
  StatItem,
  GalleryItem,
  NodeCategory,
} from "@/graphql/page-nodes";
import {
  uid,
  emptyPagePayload,
  parsePagePayload,
  newPageNode,
  PAGE_NODE_META,
  PAGE_NODE_CATEGORIES,
} from "@/graphql/page-nodes";

// ─── Block picker metadata (with icons) ───────────────────────

const NODE_ICONS: Record<PageNodeType, React.ComponentType<{ className?: string }>> = {
  heading:     Heading2,
  paragraph:   AlignLeft,
  quote:       Quote,
  callout:     Info,
  image:       ImageIcon,
  gallery:     LayoutGrid,
  video:       Video,
  divider:     Minus,
  list:        List,
  steps:       ListOrdered,
  stats:       BarChart2,
  cta:         Zap,
  serviceForm: ClipboardList,
};

// ─── Shared node wrapper controls ─────────────────────────────

interface NodeControlsProps {
  index: number;
  total: number;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onDelete: () => void;
}

function NodeControls({ index, total, onMoveUp, onMoveDown, onDelete }: NodeControlsProps) {
  return (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
      <button onClick={onMoveUp} disabled={index === 0}
        className="p-1.5 rounded hover:bg-muted disabled:opacity-25" title="Move up">
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
      <button onClick={onMoveDown} disabled={index === total - 1}
        className="p-1.5 rounded hover:bg-muted disabled:opacity-25" title="Move down">
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      <button onClick={onDelete}
        className="p-1.5 rounded hover:bg-destructive/10 text-destructive" title="Delete block">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function NodeLabel({ type }: { type: PageNodeType }) {
  const meta = PAGE_NODE_META.find((m) => m.type === type);
  const Icon = NODE_ICONS[type];
  return (
    <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60 mb-1.5">
      <Icon className="w-3 h-3" />
      {meta?.label ?? type}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// NODE EDITORS
// ═══════════════════════════════════════════════════════════════

function HeadingEditor({ node, onChange }: { node: HeadingNode; onChange: (n: HeadingNode) => void }) {
  return (
    <div className="space-y-2 flex-1">
      <NodeLabel type="heading" />
      <div className="flex items-center gap-2">
        <select value={node.attrs.level}
          onChange={(e) => onChange({ ...node, attrs: { ...node.attrs, level: Number(e.target.value) as 2 | 3 } })}
          className="text-xs border border-border rounded px-2 py-1.5 bg-background text-muted-foreground">
          <option value={2}>H2 — Section</option>
          <option value={3}>H3 — Sub-section</option>
        </select>
      </div>
      <Input value={node.attrs.text}
        onChange={(e) => onChange({ ...node, attrs: { ...node.attrs, text: e.target.value } })}
        placeholder="Heading text…"
        className={cn("border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0",
          node.attrs.level === 2 ? "text-xl font-bold" : "text-lg font-semibold")} />
    </div>
  );
}

function ParagraphEditor({ node, onChange }: { node: ParagraphNode; onChange: (n: ParagraphNode) => void }) {
  return (
    <div className="flex-1 space-y-1.5">
      <NodeLabel type="paragraph" />
      <Textarea value={node.attrs.text}
        onChange={(e) => onChange({ ...node, attrs: { text: e.target.value } })}
        placeholder="Write your paragraph…" rows={4}
        className="resize-none border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0" />
    </div>
  );
}

function QuoteEditor({ node, onChange }: { node: QuoteNode; onChange: (n: QuoteNode) => void }) {
  const update = (patch: Partial<typeof node.attrs>) => onChange({ ...node, attrs: { ...node.attrs, ...patch } });
  return (
    <div className="flex-1 space-y-3">
      <NodeLabel type="quote" />
      <Textarea value={node.attrs.text} onChange={(e) => update({ text: e.target.value })}
        placeholder="The quote text…" rows={3} className="resize-none text-base italic" />
      <div className="grid grid-cols-2 gap-2">
        <Input value={node.attrs.author} onChange={(e) => update({ author: e.target.value })} placeholder="Author name" />
        <Input value={node.attrs.role} onChange={(e) => update({ role: e.target.value })} placeholder="Role / title (optional)" />
      </div>
    </div>
  );
}

const CALLOUT_VARIANTS = [
  { value: "info" as const,    label: "Info",    cls: "bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-400" },
  { value: "warning" as const, label: "Warning", cls: "bg-amber-50 border-amber-200 text-amber-700 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-400" },
  { value: "success" as const, label: "Success", cls: "bg-green-50 border-green-200 text-green-700 dark:bg-green-950/30 dark:border-green-800 dark:text-green-400" },
  { value: "danger" as const,  label: "Danger",  cls: "bg-red-50 border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-800 dark:text-red-400" },
];

function CalloutEditor({ node, onChange }: { node: CalloutNode; onChange: (n: CalloutNode) => void }) {
  const update = (patch: Partial<typeof node.attrs>) => onChange({ ...node, attrs: { ...node.attrs, ...patch } });
  const cv = CALLOUT_VARIANTS.find((v) => v.value === node.attrs.variant) ?? CALLOUT_VARIANTS[0];
  return (
    <div className="flex-1 space-y-3">
      <NodeLabel type="callout" />
      <div className="flex gap-1.5 flex-wrap">
        {CALLOUT_VARIANTS.map((v) => (
          <button key={v.value} onClick={() => update({ variant: v.value })}
            className={cn("px-2.5 py-1 rounded-full text-xs font-medium border transition-all", v.cls,
              node.attrs.variant === v.value ? "ring-2 ring-offset-1 ring-current" : "opacity-60 hover:opacity-100")}>
            {v.label}
          </button>
        ))}
      </div>
      <div className={cn("rounded-lg border p-3 space-y-2", cv.cls)}>
        <Input value={node.attrs.title} onChange={(e) => update({ title: e.target.value })}
          placeholder="Title (optional)…"
          className="bg-transparent border-0 border-b border-current/20 rounded-none px-0 shadow-none focus-visible:ring-0 font-semibold" />
        <Textarea value={node.attrs.text} onChange={(e) => update({ text: e.target.value })}
          placeholder="Callout body text…" rows={2}
          className="resize-none bg-transparent border-0 shadow-none focus-visible:ring-0 p-0 text-sm" />
      </div>
    </div>
  );
}

function ImageEditor({ node, onChange }: { node: ImageNode; onChange: (n: ImageNode) => void }) {
  const update = (patch: Partial<typeof node.attrs>) => onChange({ ...node, attrs: { ...node.attrs, ...patch } });
  return (
    <div className="flex-1 space-y-3">
      <NodeLabel type="image" />
      <ImageUpload value={node.attrs.url} onChange={(url) => update({ url })}
        onRemove={() => update({ url: "" })} aspect="banner" folder="service-pages" />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="img-alt">Alt text</label>
          <Input id="img-alt" value={node.attrs.alt} onChange={(e) => update({ alt: e.target.value })} placeholder="Describe the image…" />
        </div>
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground" htmlFor="img-size">Width</label>
          <select id="img-size" value={node.attrs.size}
            onChange={(e) => update({ size: e.target.value as ImageNode["attrs"]["size"] })}
            className="w-full text-sm border border-border rounded-md px-2 py-2 bg-background">
            <option value="sm">Small (384px)</option>
            <option value="md">Medium (512px)</option>
            <option value="lg">Large (768px)</option>
            <option value="full">Full width</option>
          </select>
        </div>
      </div>
      <Input value={node.attrs.caption} onChange={(e) => update({ caption: e.target.value })}
        placeholder="Caption (optional)…" className="text-sm text-muted-foreground" />
    </div>
  );
}

function GalleryEditor({ node, onChange }: { node: GalleryNode; onChange: (n: GalleryNode) => void }) {
  const ua = (patch: Partial<typeof node.attrs>) => onChange({ ...node, attrs: { ...node.attrs, ...patch } });
  const updateItem = (id: string, patch: Partial<GalleryItem>) =>
    ua({ items: node.attrs.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  const addItem = () => ua({ items: [...node.attrs.items, { id: uid(), url: "", caption: "" }] });
  const removeItem = (id: string) => ua({ items: node.attrs.items.filter((it) => it.id !== id) });
  return (
    <div className="flex-1 space-y-3">
      <NodeLabel type="gallery" />
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground">Columns:</span>
        {([2, 3, 4] as const).map((c) => (
          <button key={c} onClick={() => ua({ columns: c })}
            className={cn("px-2.5 py-1 rounded text-xs font-medium border transition-colors",
              node.attrs.columns === c ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:border-primary/50")}>
            {c}
          </button>
        ))}
      </div>
      <div className="space-y-4">
        {node.attrs.items.map((item, idx) => (
          <div key={item.id} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium text-muted-foreground">Image {idx + 1}</span>
              <button onClick={() => removeItem(item.id)} disabled={node.attrs.items.length <= 1}
                className="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors">
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <ImageUpload value={item.url} onChange={(url) => updateItem(item.id, { url })}
              onRemove={() => updateItem(item.id, { url: "" })} aspect="square" folder="service-pages/gallery" />
            <Input value={item.caption} onChange={(e) => updateItem(item.id, { caption: e.target.value })}
              placeholder="Caption (optional)…" className="text-sm" />
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addItem} className="w-full gap-1.5 border-dashed">
        <Plus className="w-3.5 h-3.5" /> Add Image
      </Button>
    </div>
  );
}

function VideoEditor({ node, onChange }: { node: VideoNode; onChange: (n: VideoNode) => void }) {
  const update = (patch: Partial<typeof node.attrs>) => onChange({ ...node, attrs: { ...node.attrs, ...patch } });
  return (
    <div className="flex-1 space-y-3">
      <NodeLabel type="video" />
      <div className="space-y-1">
        <label className="text-xs text-muted-foreground" htmlFor="video-url">YouTube or Vimeo URL</label>
        <Input id="video-url" value={node.attrs.url} onChange={(e) => update({ url: e.target.value })}
          placeholder="https://www.youtube.com/watch?v=…" type="url" />
      </div>
      <Input value={node.attrs.caption} onChange={(e) => update({ caption: e.target.value })}
        placeholder="Caption (optional)…" className="text-sm text-muted-foreground" />
    </div>
  );
}

function DividerEditor({ node, onChange }: { node: DividerNode; onChange: (n: DividerNode) => void }) {
  return (
    <div className="flex-1 space-y-3">
      <NodeLabel type="divider" />
      <div className="flex items-center gap-2">
        {(["line", "dots", "thick"] as const).map((s) => (
          <button key={s} onClick={() => onChange({ ...node, attrs: { style: s } })}
            className={cn("flex-1 py-2 rounded border text-xs font-medium transition-colors capitalize",
              node.attrs.style === s ? "bg-primary/10 border-primary text-primary"
                : "bg-muted border-border text-muted-foreground hover:border-primary/50")}>
            {s}
          </button>
        ))}
      </div>
      <div className="py-2">
        {node.attrs.style === "line"  && <hr className="border-border" />}
        {node.attrs.style === "thick" && <hr className="border-2 border-border rounded-full" />}
        {node.attrs.style === "dots"  && (
          <div className="flex justify-center gap-1.5">
            {[0,1,2,3,4].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-border block" />)}
          </div>
        )}
      </div>
    </div>
  );
}

function ListEditor({ node, onChange }: { node: ListNode; onChange: (n: ListNode) => void }) {
  const ua = (patch: Partial<typeof node.attrs>) => onChange({ ...node, attrs: { ...node.attrs, ...patch } });
  const updateItem = (id: string, patch: Partial<ListItem>) =>
    ua({ items: node.attrs.items.map((it) => (it.id === id ? { ...it, ...patch } : it)) });
  const addItem = () => ua({ items: [...node.attrs.items, { id: uid(), text: "", checked: false }] });
  const removeItem = (id: string) => ua({ items: node.attrs.items.filter((it) => it.id !== id) });
  return (
    <div className="flex-1 space-y-3">
      <NodeLabel type="list" />
      <div className="flex gap-1.5">
        {(["bullet", "ordered", "check"] as const).map((s) => (
          <button key={s} onClick={() => ua({ style: s })}
            className={cn("px-3 py-1 rounded text-xs font-medium border transition-colors",
              node.attrs.style === s ? "bg-primary text-primary-foreground border-primary"
                : "bg-muted text-muted-foreground border-border hover:border-primary/50")}>
            {s === "check" ? "Checkbox" : (s === "ordered" ? "Numbered" : "Bullet")}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        {node.attrs.items.map((item, idx) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="text-muted-foreground/50 text-xs w-5 shrink-0 text-right select-none">
              {node.attrs.style === "ordered" ? `${idx + 1}.` : (node.attrs.style === "bullet" ? "•" : "☐")}
            </span>
            <Input value={item.text} onChange={(e) => updateItem(item.id, { text: e.target.value })}
              placeholder={`Item ${idx + 1}…`} className="flex-1 h-8 text-sm"
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }} />
            <button onClick={() => removeItem(item.id)} disabled={node.attrs.items.length <= 1}
              className="text-muted-foreground/50 hover:text-destructive disabled:opacity-30 transition-colors">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <Button variant="ghost" size="sm" onClick={addItem} className="gap-1 text-muted-foreground h-7 px-2">
        <Plus className="w-3 h-3" /> Add item
      </Button>
    </div>
  );
}

function StepsEditor({ node, onChange }: { node: StepsNode; onChange: (n: StepsNode) => void }) {
  const updateItems = (items: StepItem[]) => onChange({ ...node, attrs: { items } });
  const updateItem = (id: string, patch: Partial<StepItem>) =>
    updateItems(node.attrs.items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const addItem = () => updateItems([...node.attrs.items, { id: uid(), title: "", description: "" }]);
  const removeItem = (id: string) => updateItems(node.attrs.items.filter((it) => it.id !== id));
  return (
    <div className="flex-1 space-y-3">
      <NodeLabel type="steps" />
      <div className="space-y-3">
        {node.attrs.items.map((item, idx) => (
          <div key={item.id} className="flex gap-3">
            <div className="flex flex-col items-center gap-1 shrink-0">
              <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center">
                {idx + 1}
              </span>
              {idx < node.attrs.items.length - 1 && <span className="w-px flex-1 bg-border min-h-4" />}
            </div>
            <div className="flex-1 space-y-1.5 pb-2">
              <Input value={item.title} onChange={(e) => updateItem(item.id, { title: e.target.value })}
                placeholder={`Step ${idx + 1} title…`} className="font-medium" />
              <Textarea value={item.description} onChange={(e) => updateItem(item.id, { description: e.target.value })}
                placeholder="Description…" rows={2} className="resize-none text-sm" />
            </div>
            <button onClick={() => removeItem(item.id)} disabled={node.attrs.items.length <= 1}
              className="self-start mt-1 text-muted-foreground/50 hover:text-destructive disabled:opacity-30 transition-colors">
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addItem} className="w-full gap-1.5 border-dashed">
        <Plus className="w-3.5 h-3.5" /> Add Step
      </Button>
    </div>
  );
}

function StatsEditor({ node, onChange }: { node: StatsNode; onChange: (n: StatsNode) => void }) {
  const updateItems = (items: StatItem[]) => onChange({ ...node, attrs: { items } });
  const updateItem = (id: string, patch: Partial<StatItem>) =>
    updateItems(node.attrs.items.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  const addItem = () => updateItems([...node.attrs.items, { id: uid(), value: "", label: "" }]);
  const removeItem = (id: string) => updateItems(node.attrs.items.filter((it) => it.id !== id));
  return (
    <div className="flex-1 space-y-3">
      <NodeLabel type="stats" />
      <div className="space-y-2">
        {node.attrs.items.map((item) => (
          <div key={item.id} className="border border-border rounded-lg p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground">Stat</span>
              <button onClick={() => removeItem(item.id)} disabled={node.attrs.items.length <= 1}
                className="text-muted-foreground/50 hover:text-destructive disabled:opacity-30 transition-colors">
                <XIcon className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input value={item.prefix ?? ""} onChange={(e) => updateItem(item.id, { prefix: e.target.value })}
                placeholder="Prefix" className="text-center" />
              <Input value={item.value} onChange={(e) => updateItem(item.id, { value: e.target.value })}
                placeholder="Value *" className="text-center font-bold" />
              <Input value={item.suffix ?? ""} onChange={(e) => updateItem(item.id, { suffix: e.target.value })}
                placeholder="Suffix" className="text-center" />
            </div>
            <Input value={item.label} onChange={(e) => updateItem(item.id, { label: e.target.value })}
              placeholder="Label (e.g. Happy Clients) *" />
            <Input value={item.description ?? ""} onChange={(e) => updateItem(item.id, { description: e.target.value })}
              placeholder="Description (optional)…" className="text-sm text-muted-foreground" />
          </div>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={addItem} disabled={node.attrs.items.length >= 4}
        className="w-full gap-1.5 border-dashed">
        <Plus className="w-3.5 h-3.5" /> Add Stat {node.attrs.items.length >= 4 ? "(max 4)" : ""}
      </Button>
    </div>
  );
}

const CTA_VARIANTS = [
  { value: "card" as const,     label: "Card",     desc: "Bordered card with subtle background" },
  { value: "minimal" as const,  label: "Minimal",  desc: "Clean text with no background" },
  { value: "gradient" as const, label: "Gradient", desc: "Bold gradient background" },
];

function CtaEditor({ node, onChange }: { node: CtaNode; onChange: (n: CtaNode) => void }) {
  const update = (patch: Partial<typeof node.attrs>) => onChange({ ...node, attrs: { ...node.attrs, ...patch } });
  return (
    <div className="flex-1 space-y-3">
      <NodeLabel type="cta" />
      <div className="grid grid-cols-3 gap-1.5">
        {CTA_VARIANTS.map((v) => (
          <button key={v.value} onClick={() => update({ variant: v.value })}
            className={cn("p-2 rounded-lg border text-xs font-medium transition-colors text-left",
              node.attrs.variant === v.value ? "border-primary bg-primary/5 text-primary"
                : "border-border text-muted-foreground hover:border-primary/40")}>
            <span className="block font-semibold">{v.label}</span>
            <span className="text-[10px] leading-tight opacity-70">{v.desc}</span>
          </button>
        ))}
      </div>
      <Input value={node.attrs.heading} onChange={(e) => update({ heading: e.target.value })}
        placeholder="Heading…" className="font-semibold text-base" />
      <Textarea value={node.attrs.text} onChange={(e) => update({ text: e.target.value })}
        placeholder="Supporting text…" rows={2} className="resize-none" />
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">Primary Button</span>
        <div className="grid grid-cols-2 gap-2">
          <Input value={node.attrs.primaryLabel} onChange={(e) => update({ primaryLabel: e.target.value })} placeholder="Button label…" />
          <Input value={node.attrs.primaryHref} onChange={(e) => update({ primaryHref: e.target.value })} placeholder="#book or https://…" />
        </div>
      </div>
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground">
          Secondary Button <span className="font-normal opacity-60">(optional)</span>
        </span>
        <div className="grid grid-cols-2 gap-2">
          <Input value={node.attrs.secondaryLabel ?? ""} onChange={(e) => update({ secondaryLabel: e.target.value || undefined })} placeholder="Button label…" />
          <Input value={node.attrs.secondaryHref ?? ""} onChange={(e) => update({ secondaryHref: e.target.value || undefined })} placeholder="https://…" />
        </div>
      </div>
    </div>
  );
}

function ServiceFormEditor({ node, onChange }: { node: ServiceFormNode; onChange: (n: ServiceFormNode) => void }) {
  return (
    <div className="flex-1 space-y-3">
      <NodeLabel type="serviceForm" />
      <div className="rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 p-5 text-center space-y-2">
        <ClipboardList className="w-8 h-8 text-primary/50 mx-auto" />
        <p className="font-semibold text-sm text-foreground">Dynamic Booking Form</p>
        <p className="text-xs text-muted-foreground leading-relaxed">
          This block embeds your service&apos;s booking form — including all custom fields,
          time-slot picker, and pricing — directly on the page.
        </p>
        <label className="flex items-center justify-center gap-2 text-sm text-muted-foreground cursor-pointer mt-2">
          <input type="checkbox" checked={node.attrs.showTitle ?? true}
            onChange={(e) => onChange({ ...node, attrs: { showTitle: e.target.checked } })}
            className="rounded" />
          Show &ldquo;Book this service&rdquo; heading
        </label>
      </div>
    </div>
  );
}

// ─── Unified NodeEditor dispatcher ────────────────────────────

interface NodeEditorProps {
  node: PageNode;
  index: number;
  total: number;
  onChange: (node: PageNode) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function NodeEditor({ node, index, total, onChange, onDelete, onMoveUp, onMoveDown }: NodeEditorProps) {
  const controls = <NodeControls index={index} total={total} onMoveUp={onMoveUp} onMoveDown={onMoveDown} onDelete={onDelete} />;
  const renderEditor = () => {
    switch (node.type) {
      case "heading":     return <HeadingEditor     node={node} onChange={onChange as (n: typeof node) => void} />;
      case "paragraph":   return <ParagraphEditor   node={node} onChange={onChange as (n: typeof node) => void} />;
      case "quote":       return <QuoteEditor       node={node} onChange={onChange as (n: typeof node) => void} />;
      case "callout":     return <CalloutEditor     node={node} onChange={onChange as (n: typeof node) => void} />;
      case "image":       return <ImageEditor       node={node} onChange={onChange as (n: typeof node) => void} />;
      case "gallery":     return <GalleryEditor     node={node} onChange={onChange as (n: typeof node) => void} />;
      case "video":       return <VideoEditor       node={node} onChange={onChange as (n: typeof node) => void} />;
      case "divider":     return <DividerEditor     node={node} onChange={onChange as (n: typeof node) => void} />;
      case "list":        return <ListEditor        node={node} onChange={onChange as (n: typeof node) => void} />;
      case "steps":       return <StepsEditor       node={node} onChange={onChange as (n: typeof node) => void} />;
      case "stats":       return <StatsEditor       node={node} onChange={onChange as (n: typeof node) => void} />;
      case "cta":         return <CtaEditor         node={node} onChange={onChange as (n: typeof node) => void} />;
      case "serviceForm": return <ServiceFormEditor node={node} onChange={onChange as (n: typeof node) => void} />;
    }
  };
  return (
    <div className={cn("group flex items-start gap-3 p-4 rounded-xl border bg-card",
        "hover:border-border/80 hover:shadow-sm transition-all")}>
      {renderEditor()}
      {controls}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// NODE PREVIEWS
// ═══════════════════════════════════════════════════════════════

const CALLOUT_PREVIEW: Record<string, { wrapper: string; Icon: React.ComponentType<{ className?: string }> }> = {
  info:    { wrapper: "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/30 dark:border-blue-800 dark:text-blue-200",    Icon: Info },
  warning: { wrapper: "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/30 dark:border-amber-800 dark:text-amber-200", Icon: AlertTriangle },
  success: { wrapper: "bg-green-50 border-green-200 text-green-800 dark:bg-green-950/30 dark:border-green-800 dark:text-green-200", Icon: CheckCircle2 },
  danger:  { wrapper: "bg-red-50 border-red-200 text-red-800 dark:bg-red-950/30 dark:border-red-800 dark:text-red-200",           Icon: AlertCircle },
};

const IMAGE_SIZE_CLS: Record<string, string> = {
  sm: "max-w-sm mx-auto", md: "max-w-md mx-auto", lg: "max-w-2xl mx-auto", full: "w-full",
};

function getEmbedUrl(rawUrl: string): string | null {
  if (!rawUrl) return null;
  try {
    const url = new URL(rawUrl);
    if (url.hostname.includes("youtube.com") || url.hostname.includes("youtu.be")) {
      const v = url.searchParams.get("v") ?? (url.hostname === "youtu.be" ? url.pathname.slice(1) : null);
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (url.hostname.includes("vimeo.com")) {
      const id = url.pathname.split("/").findLast(Boolean);
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
  } catch { /* ignore */ }
  return null;
}

const CTA_CLS: Record<string, string> = {
  card:     "bg-card border border-border rounded-2xl p-8 text-center",
  minimal:  "py-8 text-center",
  gradient: "bg-gradient-to-br from-primary to-primary/70 rounded-2xl p-8 text-center text-primary-foreground",
};

// ── Lightbox carousel ──────────────────────────────────────────
function GalleryLightbox({
  images,
  startIndex,
  onClose,
}: {
  readonly images: { url: string; caption?: string }[];
  readonly startIndex: number;
  readonly onClose: () => void;
}) {
  const [index, setIndex] = useState(startIndex);
  const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);
  const next = () => setIndex((i) => (i + 1) % images.length);

  // Close on Escape, navigate with arrow keys
  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "ArrowLeft") prev();
    if (e.key === "ArrowRight") next();
  };

  const current = images[index];

  return (
    // biome-ignore lint: keyboard handler on overlay is intentional for lightbox dismiss
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKey}
      // biome-ignore lint: tabIndex required for key events
      // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
      tabIndex={0}
    >
      {/* Stop propagation so clicking the image/controls doesn't close */}
      {/* biome-ignore lint: intentional */}
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
      <div
        className="relative flex flex-col items-center max-w-4xl w-full px-4"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-10 right-0 text-white/70 hover:text-white transition-colors"
        >
          <LightboxClose className="w-7 h-7" />
        </button>

        {/* Main image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.url}
          alt={current.caption || ""}
          className="max-h-[75vh] max-w-full rounded-xl object-contain shadow-2xl"
        />

        {/* Caption */}
        {current.caption && (
          <p className="mt-3 text-sm text-white/70 text-center">{current.caption}</p>
        )}

        {/* Counter */}
        {images.length > 1 && (
          <p className="mt-1.5 text-xs text-white/40">{index + 1} / {images.length}</p>
        )}

        {/* Prev / Next */}
        {images.length > 1 && (
          <>
            <button
              type="button"
              onClick={prev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={next}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center text-white transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </>
        )}

        {/* Dot indicators */}
        {images.length > 1 && (
          <div className="flex gap-1.5 mt-4">
            {images.map((img, i) => (
              <button
                key={img.url}
                type="button"
                onClick={() => setIndex(i)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  i === index ? "bg-white" : "bg-white/30 hover:bg-white/60",
                )}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function ImageNodePreview({ node }: { readonly node: ImageNode }) {
  const [open, setOpen] = useState(false);
  if (!node.attrs.url)
    return (
      <div className="w-full h-40 bg-muted rounded-xl flex items-center justify-center text-muted-foreground gap-2">
        <ImageIcon className="w-5 h-5" /><span className="text-sm">No image uploaded</span>
      </div>
    );
  return (
    <>
      <figure className={cn("space-y-2", IMAGE_SIZE_CLS[node.attrs.size] ?? "w-full")}>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="relative group w-auto block rounded-xl overflow-hidden shadow-sm"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={node.attrs.url} alt={node.attrs.alt || ""} className="max-h-64 w-auto rounded-xl object-cover transition-transform group-hover:scale-105" />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
            <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
          </div>
        </button>
        {node.attrs.caption && <figcaption className="text-sm text-muted-foreground text-center">{node.attrs.caption}</figcaption>}
      </figure>
      {open && (
        <GalleryLightbox
          images={[{ url: node.attrs.url, caption: node.attrs.caption }]}
          startIndex={0}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function GalleryNodePreview({ node }: { readonly node: GalleryNode }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  const items = node.attrs.items.filter((i) => i.url);
  if (!items.length)
    return (
      <div className="w-full h-32 bg-muted rounded-xl flex items-center justify-center text-muted-foreground gap-2">
        <LayoutGrid className="w-5 h-5" /><span className="text-sm">No gallery images</span>
      </div>
    );
  return (
    <>
      <div className="flex flex-wrap gap-2">
        {items.map((item, idx) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLightboxIdx(idx)}
            className="relative group overflow-hidden rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary shrink-0"
            style={{ width: 150, height: 150 }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.caption || ""} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
            </div>
            {item.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1.5 translate-y-full group-hover:translate-y-0 transition-transform">
                {item.caption}
              </div>
            )}
          </button>
        ))}
      </div>
      {lightboxIdx !== null && (
        <GalleryLightbox
          images={items.map((it) => ({ url: it.url, caption: it.caption }))}
          startIndex={lightboxIdx}
          onClose={() => setLightboxIdx(null)}
        />
      )}
    </>
  );
}

export function NodePreview({ node }: { node: PageNode }) {
  switch (node.type) {
    case "heading": {
      const Tag = node.attrs.level === 2 ? "h2" : "h3";
      return (
        <Tag className={cn("font-bold text-foreground", node.attrs.level === 2 ? "text-2xl" : "text-xl")}>
          {node.attrs.text || <span className="text-muted-foreground italic">Empty heading</span>}
        </Tag>
      );
    }
    case "paragraph":
      return (
        <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground">
          {node.attrs.text || <span className="text-muted-foreground italic">Empty paragraph</span>}
        </p>
      );
    case "quote":
      return (
        <blockquote className="relative pl-6 border-l-4 border-primary/50 space-y-2">
          <Quote className="absolute -left-1 -top-1 w-5 h-5 text-primary/30" />
          <p className="text-lg italic text-foreground leading-relaxed">
            {node.attrs.text || <span className="text-muted-foreground">Empty quote</span>}
          </p>
          {(node.attrs.author || node.attrs.role) && (
            <footer className="flex items-center gap-2">
              <span className="w-8 h-px bg-border" />
              <span className="text-sm font-medium text-foreground">{node.attrs.author}</span>
              {node.attrs.role && <span className="text-sm text-muted-foreground">{node.attrs.role}</span>}
            </footer>
          )}
        </blockquote>
      );
    case "callout": {
      const cs = CALLOUT_PREVIEW[node.attrs.variant] ?? CALLOUT_PREVIEW.info;
      return (
        <div className={cn("border rounded-xl p-4 flex gap-3", cs.wrapper)}>
          <cs.Icon className="w-5 h-5 shrink-0 mt-0.5 opacity-80" />
          <div className="space-y-0.5">
            {node.attrs.title && <p className="font-semibold text-sm">{node.attrs.title}</p>}
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {node.attrs.text || <span className="italic opacity-60">Empty callout</span>}
            </p>
          </div>
        </div>
      );
    }
    case "image":
      return <ImageNodePreview node={node} />;
    case "gallery":
      return <GalleryNodePreview node={node} />;
    case "video": {
      const embedUrl = getEmbedUrl(node.attrs.url);
      if (!embedUrl)
        return (
          <div className="w-full h-40 bg-muted rounded-xl flex items-center justify-center text-muted-foreground gap-2">
            <Video className="w-5 h-5" /><span className="text-sm">{node.attrs.url ? "Invalid URL" : "No video URL"}</span>
          </div>
        );
      return (
        <figure className="space-y-2">
          <div className="relative w-full aspect-video rounded-xl overflow-hidden shadow-sm">
            <iframe src={embedUrl} className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen title="Embedded video" />
          </div>
          {node.attrs.caption && <figcaption className="text-sm text-muted-foreground text-center">{node.attrs.caption}</figcaption>}
        </figure>
      );
    }
    case "divider":
      if (node.attrs.style === "dots")
        return <div className="flex justify-center gap-2 py-1">{[0,1,2,3,4].map((i) => <span key={i} className="w-1.5 h-1.5 rounded-full bg-border block" />)}</div>;
      if (node.attrs.style === "thick")
        return <hr className="border-2 border-border rounded-full" />;
      return <hr className="border-border" />;
    case "list": {
      const items = node.attrs.items.filter((i) => i.text);
      if (!items.length) return <p className="text-muted-foreground italic text-sm">Empty list</p>;
      if (node.attrs.style === "check")
        return (
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id} className="flex items-start gap-2.5">
                <span className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 border-2",
                  item.checked ? "bg-green-500 border-green-500 text-white" : "border-border")}>
                  {item.checked && <CheckCircle2 className="w-3.5 h-3.5" />}
                </span>
                <span className={cn("text-base", item.checked && "line-through text-muted-foreground")}>{item.text}</span>
              </li>
            ))}
          </ul>
        );
      if (node.attrs.style === "ordered")
        return (
          <ol className="space-y-2 list-none">
            {items.map((item, idx) => (
              <li key={item.id} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">{idx + 1}</span>
                <span className="text-base">{item.text}</span>
              </li>
            ))}
          </ol>
        );
      return (
        <ul className="space-y-2">
          {items.map((item) => (
            <li key={item.id} className="flex items-start gap-2.5">
              <span className="w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0 mt-2.5" />
              <span className="text-base">{item.text}</span>
            </li>
          ))}
        </ul>
      );
    }
    case "steps":
      return (
        <div className="space-y-0">
          {node.attrs.items.map((step, idx) => (
            <div key={step.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <span className="w-9 h-9 rounded-full bg-primary text-primary-foreground text-sm font-bold flex items-center justify-center shrink-0 shadow-sm">{idx + 1}</span>
                {idx < node.attrs.items.length - 1 && <span className="w-0.5 flex-1 bg-linear-to-b from-primary/40 to-border min-h-6 my-1" />}
              </div>
              <div className={cn("pb-6 pt-1 flex-1", idx === node.attrs.items.length - 1 && "pb-0")}>
                <p className="font-semibold text-foreground text-base">
                  {step.title || <span className="text-muted-foreground italic">Step title</span>}
                </p>
                {step.description && <p className="text-muted-foreground text-sm mt-0.5 leading-relaxed">{step.description}</p>}
              </div>
            </div>
          ))}
        </div>
      );
    case "stats":
      return (
        <div className={cn("grid gap-4 text-center",
          node.attrs.items.length === 2 && "grid-cols-2",
          node.attrs.items.length === 3 && "grid-cols-3",
          node.attrs.items.length === 4 && "grid-cols-2 sm:grid-cols-4")}>
          {node.attrs.items.map((stat) => (
            <div key={stat.id} className="space-y-1 p-4 rounded-xl bg-muted/50 border border-border">
              <p className="text-3xl font-extrabold text-foreground tracking-tight">
                {stat.prefix && <span className="text-2xl text-muted-foreground">{stat.prefix}</span>}
                {stat.value || <span className="text-muted-foreground">—</span>}
                {stat.suffix && <span className="text-xl text-muted-foreground">{stat.suffix}</span>}
              </p>
              <p className="text-sm font-semibold text-foreground">
                {stat.label || <span className="italic opacity-50">Label</span>}
              </p>
              {stat.description && <p className="text-xs text-muted-foreground">{stat.description}</p>}
            </div>
          ))}
        </div>
      );
    case "cta": {
      const isGrad = node.attrs.variant === "gradient";
      return (
        <div className={CTA_CLS[node.attrs.variant] ?? CTA_CLS.card}>
          {node.attrs.heading && (
            <h3 className={cn("text-2xl font-bold mb-2", isGrad ? "text-primary-foreground" : "text-foreground")}>{node.attrs.heading}</h3>
          )}
          {node.attrs.text && (
            <p className={cn("text-base mb-5 max-w-lg mx-auto", isGrad ? "text-primary-foreground/80" : "text-muted-foreground")}>{node.attrs.text}</p>
          )}
          <div className="flex flex-wrap gap-3 justify-center">
            {node.attrs.primaryLabel && (
              <span className={cn("inline-flex items-center gap-1.5 px-5 py-2.5 rounded-lg font-semibold text-sm cursor-pointer",
                isGrad ? "bg-white text-primary hover:bg-white/90" : "bg-primary text-primary-foreground hover:bg-primary/90")}>
                {node.attrs.primaryLabel} <ExternalLink className="w-3.5 h-3.5" />
              </span>
            )}
            {node.attrs.secondaryLabel && (
              <span className={cn("inline-flex items-center px-5 py-2.5 rounded-lg font-semibold text-sm border cursor-pointer",
                isGrad ? "border-white/50 text-primary-foreground hover:bg-white/10" : "border-border text-foreground hover:bg-muted")}>
                {node.attrs.secondaryLabel}
              </span>
            )}
          </div>
        </div>
      );
    }
    case "serviceForm":
      return (
        <div className="rounded-2xl border-2 border-primary/30 bg-linear-to-br from-primary/5 to-primary/10 p-6 space-y-4">
          {(node.attrs.showTitle ?? true) && (
            <div className="text-center space-y-1">
              <h3 className="text-xl font-bold text-foreground">Book This Service</h3>
              <p className="text-sm text-muted-foreground">Fill out the form to schedule your appointment</p>
            </div>
          )}
          <div className="grid gap-3">
            {[
              { Icon: Clock,  label: "Choose a time slot" },
              { Icon: Users,  label: "Your details" },
              { Icon: Star,   label: "Review & confirm" },
            ].map(({ Icon, label }) => (
              <div key={label} className="flex items-center gap-3 p-3 rounded-lg bg-background/80 border border-border">
                <span className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-primary" />
                </span>
                <span className="text-sm font-medium text-foreground">{label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground text-center">
            The interactive booking form with your custom fields will appear here
          </p>
        </div>
      );
  }
}

// ═══════════════════════════════════════════════════════════════
// BLOCK PICKER
// ═══════════════════════════════════════════════════════════════

function BlockPicker({ onAdd, onClose }: { onAdd: (type: PageNodeType) => void; onClose: () => void }) {
  const [activeCategory, setActiveCategory] = useState<NodeCategory>("text");
  const filtered = PAGE_NODE_META.filter((m) => m.category === activeCategory);
  return (
    <>
      <button type="button" aria-label="Close picker" className="fixed inset-0 z-30 cursor-default bg-transparent border-0" onClick={onClose} />
      <div className="absolute top-full left-0 mt-2 z-40 bg-popover border border-border rounded-2xl shadow-xl w-80 overflow-hidden">
        <div className="flex border-b border-border">
          {PAGE_NODE_CATEGORIES.map((cat) => (
            <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
              className={cn("flex-1 py-2.5 text-xs font-semibold transition-colors",
                activeCategory === cat.id ? "bg-primary/5 text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50")}>
              {cat.label}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-1.5 p-2.5">
          {filtered.map(({ type, label, description }) => {
            const Icon = NODE_ICONS[type];
            return (
              <button key={type} onClick={() => onAdd(type)}
                className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-muted transition-colors text-left group">
                <span className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-4 h-4 text-primary" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-foreground leading-tight">{label}</p>
                  <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 line-clamp-2">{description}</p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}

// ═══════════════════════════════════════════════════════════════
// SERVICE PAGE EDITOR
// ═══════════════════════════════════════════════════════════════

type ServiceWithBiz = Service & { businessName: string };

function ServicePageEditor({ service, onBack }: { service: ServiceWithBiz; onBack: () => void }) {
  const { data: pageData, loading: pageLoading, refetch: refetchPage } =
    useQuery<{ servicePageByService: ServicePage | null }>(GET_SERVICE_PAGE, { serviceId: service.id });

  const { showSuccess, showError } = useToast();

  const [payload, setPayload] = useState<PagePayload>(emptyPagePayload(service.name));
  const [isDirty, setIsDirty]           = useState(false);
  const [previewMode, setPreviewMode]   = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [tagInput, setTagInput]         = useState("");
  const [saveStatus, setSaveStatus]     = useState<"saved" | "unsaved" | "saving">("saved");

  const payloadRef = useRef(payload);

  useEffect(() => { payloadRef.current = payload; }, [payload]);

  useEffect(() => {
    if (pageData?.servicePageByService?.payload) {
      const loaded = parsePagePayload(
        pageData.servicePageByService.payload,
        service.name,
      );
      setPayload(() => loaded);
      setIsDirty(() => false);
      setSaveStatus(() => "saved");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageData]);

  const { mutate: upsert }     = useMutation<{ upsertServicePage: { servicePage: ServicePage } }>(UPSERT_SERVICE_PAGE, {
    onError: (err) => showError(resolveGqlError(err)),
  });
  const { mutate: deletePage } = useMutation<{ deleteServicePage: { success: boolean } }>(DELETE_SERVICE_PAGE, {
    onError: (err) => showError(resolveGqlError(err)),
  });

  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    const result = await upsert({ input: { serviceId: service.id, payload: payloadRef.current } });
    if (result) { setSaveStatus("saved"); setIsDirty(false); refetchPage(); showSuccess("Page saved."); }
    else setSaveStatus("unsaved");
  }, [service.id, upsert, refetchPage, showSuccess]);

  const update = useCallback((updater: (p: PagePayload) => PagePayload) => {
    setPayload((prev) => updater(prev));
    setIsDirty(true);
    setSaveStatus("unsaved");
  }, []);

  const updateNode = useCallback(
    (id: string, node: PageNode) => update((p) => ({ ...p, content: p.content.map((n) => (n.id === id ? node : n)) })),
    [update],
  );
  const deleteNode = useCallback(
    (id: string) => update((p) => ({ ...p, content: p.content.filter((n) => n.id !== id) })),
    [update],
  );
  const moveNode = useCallback(
    (id: string, dir: -1 | 1) =>
      update((p) => {
        const idx = p.content.findIndex((n) => n.id === id);
        if (idx < 0) return p;
        const next = idx + dir;
        if (next < 0 || next >= p.content.length) return p;
        const content = [...p.content];
        [content[idx], content[next]] = [content[next], content[idx]];
        return { ...p, content };
      }),
    [update],
  );
  const addNode = useCallback((type: PageNodeType) => {
    update((p) => ({ ...p, content: [...p.content, newPageNode(type)] }));
    setShowAddBlock(false);
  }, [update]);
  const addTag = useCallback(() => {
    const t = tagInput.trim().toLowerCase().replaceAll(/\s+/g, "-");
    if (!t || payload.tags.includes(t)) return;
    update((p) => ({ ...p, tags: [...p.tags, t] }));
    setTagInput("");
  }, [tagInput, payload.tags, update]);
  const removeTag = useCallback(
    (tag: string) => update((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) })),
    [update],
  );
  const handleDeletePage = async () => {
    if (!globalThis.confirm("Delete this page? This cannot be undone.")) return;
    const result = await deletePage({ input: { serviceId: service.id } });
    if (result) {
      setPayload(emptyPagePayload(service.name));
      setIsDirty(false); setSaveStatus("saved"); refetchPage();
      showSuccess("Page deleted.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground shrink-0 transition-colors">
            ← All Services
          </button>
          <div className="min-w-0">
            <h2 className="font-semibold text-foreground leading-tight truncate">{service.name}</h2>
            <p className="text-xs text-muted-foreground">{service.businessName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {saveStatus === "saving" && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…
            </span>
          )}
          {saveStatus === "saved" && (
            <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
              <CheckCircle className="w-3.5 h-3.5" /> Saved
            </span>
          )}
          {saveStatus === "unsaved" && <span className="text-xs text-amber-500">Unsaved changes</span>}
          <button
            onClick={() => update((p) => ({ ...p, status: p.status === "published" ? "draft" : "published" }))}
            className={cn("flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border font-medium transition-colors",
              payload.status === "published"
                ? "bg-green-50 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-700"
                : "bg-muted text-muted-foreground border-border")}>
            <Globe className="w-3.5 h-3.5" />
            {payload.status === "published" ? "Published" : "Draft"}
          </button>
          <Button size="sm" variant="outline" onClick={() => setPreviewMode((v) => !v)} className="gap-1.5">
            {previewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {previewMode ? "Edit" : "Preview"}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saveStatus === "saving"} className="gap-1.5">
            <Save className="w-3.5 h-3.5" /> Save
          </Button>
        </div>
      </div>

      {pageLoading && (
        <div className="flex items-center gap-2 text-muted-foreground py-12">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading page…
        </div>
      )}
      {!pageLoading && previewMode && (
        /* ── Preview ─────────────────────────────── */
        <div className="max-w-2xl space-y-6">
          {payload.bannerImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={payload.bannerImageUrl} alt="" className="w-full rounded-2xl object-cover max-h-72 shadow-sm" />
          )}
          {payload.title && <h1 className="text-3xl font-bold text-foreground">{payload.title}</h1>}
          {payload.subtitle && <p className="text-lg text-muted-foreground">{payload.subtitle}</p>}
          {payload.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {payload.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}
            </div>
          )}
          {payload.content.length === 0 && (
            <p className="text-muted-foreground italic text-center py-8">
              No content blocks yet — Switch to Edit mode to add some.
            </p>
          )}
          {payload.content.map((node) => <NodePreview key={node.id} node={node} />)}
        </div>
      )}
      {!pageLoading && !previewMode && (
        /* ── Edit ─────────────────────────────────────────────── */
        <div className="space-y-8 max-w-2xl">
          <section>
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Banner Image
            </span>
            <ImageUpload value={payload.bannerImageUrl}
              onChange={(url) => update((p) => ({ ...p, bannerImageUrl: url }))}
              onRemove={() => update((p) => ({ ...p, bannerImageUrl: "" }))}
              aspect="banner" folder="service-pages" />
          </section>
          <section>
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Page Title</span>
            <Input value={payload.title} onChange={(e) => update((p) => ({ ...p, title: e.target.value }))}
              placeholder="Page title…" className="text-xl font-bold" />
          </section>
          <section>
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Subtitle</span>
            <Input value={payload.subtitle} onChange={(e) => update((p) => ({ ...p, subtitle: e.target.value }))}
              placeholder="A short, enticing description…" />
          </section>

          {/* Content nodes */}
          <section>
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Content Blocks ({payload.content.length})
            </span>
            <div className="space-y-3">
              {payload.content.length === 0 && (
                <div className="py-12 text-center border-2 border-dashed border-border rounded-2xl space-y-2">
                  <LayoutGrid className="w-8 h-8 text-muted-foreground/30 mx-auto" />
                  <p className="text-sm text-muted-foreground font-medium">No blocks yet</p>
                  <p className="text-xs text-muted-foreground/70">Click &ldquo;Add Block&rdquo; to build your page</p>
                </div>
              )}
              {payload.content.map((node, idx) => (
                <NodeEditor key={node.id} node={node} index={idx} total={payload.content.length}
                  onChange={(n) => updateNode(node.id, n)}
                  onDelete={() => deleteNode(node.id)}
                  onMoveUp={() => moveNode(node.id, -1)}
                  onMoveDown={() => moveNode(node.id, 1)} />
              ))}
            </div>
            <div className="relative mt-3">
              <Button variant="outline" size="sm" onClick={() => setShowAddBlock((v) => !v)}
                className="w-full gap-2 border-dashed">
                <Plus className="w-3.5 h-3.5" /> Add Block
              </Button>
              {showAddBlock && <BlockPicker onAdd={addNode} onClose={() => setShowAddBlock(false)} />}
            </div>
          </section>

          {/* Tags */}
          <section>
            <span className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Tags</span>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-6">
              {payload.tags.map((tag) => (
                <Badge key={tag} variant="secondary" className="gap-1 pr-1">
                  <Tag className="w-3 h-3" />{tag}
                  <button onClick={() => removeTag(tag)}
                    className="ml-0.5 hover:text-destructive rounded-full" aria-label={`Remove tag ${tag}`}>
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); } }}
                placeholder="Add a tag and press Enter…" className="flex-1" />
              <Button size="sm" variant="outline" onClick={addTag}>Add</Button>
            </div>
          </section>

          {/* Danger zone */}
          {pageData?.servicePageByService && (
            <section className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Deleting the page removes all content but leaves the service intact.
              </p>
              <Button size="sm" variant="destructive" onClick={handleDeletePage} className="gap-1.5">
                <Trash2 className="w-3.5 h-3.5" /> Delete Page
              </Button>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// OWNER PAGES — Default export (service selector)
// ═══════════════════════════════════════════════════════════════

export default function OwnerPages() {
  const { user, businesses } = useAuth();
  const [selected, setSelected] = useState<ServiceWithBiz | null>(null);
  const [search, setSearch]     = useState("");
  const bizIds = useMemo(() => businesses.map((b) => b.id), [businesses]);
  const { data: svcData, loading } = useQuery<{ services: Connection<Service> }>(GET_SERVICES, { first: 200 });
  const services: ServiceWithBiz[] = useMemo(() => {
    const raw = extractNodes(svcData?.services);
    const bizNameMap: Record<string, string> = {};
    for (const b of businesses) bizNameMap[b.id] = b.name;
    return raw
      .filter((s) => bizIds.includes(s.businessId))
      .filter((s) => !search || s.name.toLowerCase().includes(search.toLowerCase()))
      .map((s) => ({ ...s, businessName: bizNameMap[s.businessId] ?? "Unknown" }));
  }, [svcData, bizIds, businesses, search]);

  if (!user) return null;
  if (selected) return <ServicePageEditor service={selected} onBack={() => setSelected(null)} />;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Pages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Build and publish rich content pages for each of your services.
        </p>
      </header>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search services…"
          className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring" />
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading services…
        </div>
      )}
      {!loading && services.length === 0 && (
        <div className="text-center py-20">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No services found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {search ? "Try a different search term." : "Create a service first to add a page to it."}
          </p>
        </div>
      )}
      {!loading && services.length > 0 && (
        <div className="grid sm:grid-cols-2 gap-3">
          {services.map((svc) => (
            <button key={svc.id} onClick={() => setSelected(svc)}
              className="text-left p-4 border border-border rounded-xl hover:border-primary/40 hover:bg-muted/40 transition-all group">
              {svc.bannerImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={svc.bannerImageUrl} alt={svc.name} className="w-full h-28 object-cover rounded-lg mb-3" />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-foreground group-hover:text-primary transition-colors truncate">{svc.name}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{svc.businessName}</div>
                </div>
                <FileText className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/50 shrink-0 mt-0.5 transition-colors" />
              </div>
              {svc.description && (
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{svc.description}</p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
