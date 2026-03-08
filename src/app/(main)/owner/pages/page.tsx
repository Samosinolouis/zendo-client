"use client";

// ================================================================
// Owner Blog Editor — /owner/blog
// Block-based content editor for service pages.
// Each service has one page stored as a `payload` JSON blob.
//
// Features:
//   • Service selector with search
//   • Block editor: heading, paragraph, image, list, divider, callout
//   • Auto-save (2.5 s debounce after last change)
//   • Manual save + Ctrl/Cmd+S
//   • Preview mode
//   • Draft / Published toggle
//   • Tags input
//   • Delete page
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
import { GET_SERVICES, GET_SERVICE_PAGE } from "@/graphql/queries";
import { UPSERT_SERVICE_PAGE, DELETE_SERVICE_PAGE } from "@/graphql/mutations";
import { ImageUpload } from "@/components/ui/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { Service, ServicePage, Connection } from "@/types";
import {
  Search,
  Plus,
  Eye,
  EyeOff,
  Save,
  Loader2,
  CheckCircle,
  ChevronUp,
  ChevronDown,
  Trash2,
  Type,
  AlignLeft,
  Image as ImageIcon,
  List,
  Minus,
  AlertTriangle,
  BookOpen,
  Globe,
  FileText,
  Tag,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Block Types ──────────────────────────────────────────────

type BlockType =
  | "heading"
  | "paragraph"
  | "image"
  | "list"
  | "divider"
  | "callout";

interface HeadingBlock  { id: string; type: "heading";   level: 2 | 3; text: string }
interface ParaBlock     { id: string; type: "paragraph"; text: string }
interface ImageBlock    { id: string; type: "image";     url: string; caption: string }
interface ListBlock     { id: string; type: "list";      items: string[] }
interface DividerBlock  { id: string; type: "divider" }
interface CalloutBlock  { id: string; type: "callout";   text: string }

type Block =
  | HeadingBlock
  | ParaBlock
  | ImageBlock
  | ListBlock
  | DividerBlock
  | CalloutBlock;

interface BlogPayload {
  title: string;
  subtitle: string;
  bannerImageUrl: string;
  blocks: Block[];
  tags: string[];
  status: "draft" | "published";
}

// ─── Helpers ─────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function emptyPayload(title = ""): BlogPayload {
  return {
    title,
    subtitle: "",
    bannerImageUrl: "",
    blocks: [],
    tags: [],
    status: "draft",
  };
}

function parsePayload(
  raw: Record<string, unknown>,
  fallbackTitle: string,
): BlogPayload {
  return {
    title:          (raw.title          as string) ?? fallbackTitle,
    subtitle:       (raw.subtitle       as string) ?? "",
    bannerImageUrl: (raw.bannerImageUrl as string) ?? "",
    blocks:         (raw.blocks         as Block[]) ?? [],
    tags:           (raw.tags           as string[]) ?? [],
    status:         (raw.status         as "draft" | "published") ?? "draft",
  };
}

function newBlock(type: BlockType): Block {
  switch (type) {
    case "heading":   return { id: uid(), type: "heading",   level: 2,  text: "" };
    case "paragraph": return { id: uid(), type: "paragraph",             text: "" };
    case "image":     return { id: uid(), type: "image",     url: "",    caption: "" };
    case "list":      return { id: uid(), type: "list",      items: [""] };
    case "divider":   return { id: uid(), type: "divider" };
    case "callout":   return { id: uid(), type: "callout",               text: "" };
  }
}

const BLOCK_MENU: { type: BlockType; label: string; Icon: React.ComponentType<{ className?: string }> }[] = [
  { type: "heading",   label: "Heading",   Icon: Type           },
  { type: "paragraph", label: "Paragraph", Icon: AlignLeft      },
  { type: "image",     label: "Image",     Icon: ImageIcon      },
  { type: "list",      label: "List",      Icon: List           },
  { type: "divider",   label: "Divider",   Icon: Minus          },
  { type: "callout",   label: "Callout",   Icon: AlertTriangle  },
];

// ─── Block Editor ─────────────────────────────────────────────

interface BlockEditorProps {
  block: Block;
  index: number;
  total: number;
  onChange: (block: Block) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

function BlockEditor({
  block,
  index,
  total,
  onChange,
  onDelete,
  onMoveUp,
  onMoveDown,
}: BlockEditorProps) {
  const controls = (
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
      <button
        onClick={onMoveUp}
        disabled={index === 0}
        className="p-1 rounded hover:bg-muted disabled:opacity-25"
        title="Move up"
      >
        <ChevronUp className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onMoveDown}
        disabled={index === total - 1}
        className="p-1 rounded hover:bg-muted disabled:opacity-25"
        title="Move down"
      >
        <ChevronDown className="w-3.5 h-3.5" />
      </button>
      <button
        onClick={onDelete}
        className="p-1 rounded hover:bg-destructive/10 text-destructive"
        title="Delete block"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );

  if (block.type === "heading") {
    return (
      <div className="group flex items-start gap-2">
        <div className="flex-1 space-y-1.5">
          <select
            value={block.level}
            onChange={(e) =>
              onChange({ ...block, level: Number(e.target.value) as 2 | 3 })
            }
            className="text-xs border border-border rounded px-1.5 py-0.5 bg-background text-muted-foreground"
          >
            <option value={2}>H2 — Section heading</option>
            <option value={3}>H3 — Sub-heading</option>
          </select>
          <Input
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Heading text…"
            className={cn(
              "border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0",
              block.level === 2 ? "text-xl font-bold" : "text-lg font-semibold",
            )}
          />
        </div>
        {controls}
      </div>
    );
  }

  if (block.type === "paragraph") {
    return (
      <div className="group flex items-start gap-2">
        <Textarea
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
          placeholder="Write something…"
          rows={3}
          className="flex-1 resize-none border-0 border-b rounded-none px-0 shadow-none focus-visible:ring-0"
        />
        {controls}
      </div>
    );
  }

  if (block.type === "image") {
    return (
      <div className="group relative space-y-2">
        <div className="absolute top-2 right-2 z-10">{controls}</div>
        <ImageUpload
          value={block.url}
          onChange={(url) => onChange({ ...block, url })}
          onRemove={() => onChange({ ...block, url: "" })}
          aspect="banner"
          folder="service-pages"
        />
        <Input
          value={block.caption}
          onChange={(e) => onChange({ ...block, caption: e.target.value })}
          placeholder="Caption (optional)…"
          className="text-sm text-muted-foreground"
        />
      </div>
    );
  }

  if (block.type === "list") {
    const text = block.items.join("\n");
    return (
      <div className="group flex items-start gap-2">
        <div className="flex-1 space-y-1">
          <p className="text-xs text-muted-foreground">One item per line</p>
          <Textarea
            value={text}
            onChange={(e) =>
              onChange({ ...block, items: e.target.value.split("\n") })
            }
            placeholder={"First item\nSecond item\nThird item"}
            rows={4}
            className="resize-none"
          />
        </div>
        {controls}
      </div>
    );
  }

  if (block.type === "divider") {
    return (
      <div className="group flex items-center gap-2">
        <hr className="flex-1 border-border" />
        {controls}
      </div>
    );
  }

  if (block.type === "callout") {
    return (
      <div className="group flex items-start gap-2">
        <div className="flex-1 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
          <Textarea
            value={block.text}
            onChange={(e) => onChange({ ...block, text: e.target.value })}
            placeholder="Callout message…"
            rows={2}
            className="resize-none bg-transparent border-0 shadow-none focus-visible:ring-0 p-0"
          />
        </div>
        {controls}
      </div>
    );
  }

  return null;
}

// ─── Preview Block ────────────────────────────────────────────

function PreviewBlock({ block }: { block: Block }) {
  if (block.type === "heading") {
    const Tag = (block.level === 2 ? "h2" : "h3") as "h2" | "h3";
    return (
      <Tag
        className={cn(
          "font-bold",
          block.level === 2 ? "text-2xl" : "text-xl",
        )}
      >
        {block.text || (
          <span className="text-muted-foreground italic">Empty heading</span>
        )}
      </Tag>
    );
  }

  if (block.type === "paragraph") {
    return (
      <p className="text-base leading-relaxed whitespace-pre-wrap">
        {block.text || (
          <span className="text-muted-foreground italic">Empty paragraph</span>
        )}
      </p>
    );
  }

  if (block.type === "image") {
    if (!block.url)
      return (
        <div className="w-full h-40 bg-muted rounded-lg flex items-center justify-center text-muted-foreground text-sm gap-2">
          <ImageIcon className="w-5 h-5" /> No image uploaded
        </div>
      );
    return (
      <figure className="space-y-1">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={block.url}
          alt={block.caption || ""}
          className="w-full rounded-lg object-cover"
        />
        {block.caption && (
          <figcaption className="text-sm text-muted-foreground text-center">
            {block.caption}
          </figcaption>
        )}
      </figure>
    );
  }

  if (block.type === "list") {
    const items = block.items.filter(Boolean);
    return (
      <ul className="list-disc list-inside space-y-1">
        {items.length > 0 ? (
          items.map((item, i) => (
            <li key={i} className="text-base">
              {item}
            </li>
          ))
        ) : (
          <li className="text-muted-foreground italic">Empty list</li>
        )}
      </ul>
    );
  }

  if (block.type === "divider") {
    return <hr className="border-border" />;
  }

  if (block.type === "callout") {
    return (
      <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
        <p className="text-base whitespace-pre-wrap">
          {block.text || (
            <span className="italic">Empty callout</span>
          )}
        </p>
      </div>
    );
  }

  return null;
}

// ─── Service Page Editor ──────────────────────────────────────

type ServiceWithBiz = Service & { businessName: string };

function ServicePageEditor({
  service,
  onBack,
}: {
  service: ServiceWithBiz;
  onBack: () => void;
}) {
  const { data: pageData, loading: pageLoading, refetch: refetchPage } =
    useQuery<{ servicePageByService: ServicePage | null }>(GET_SERVICE_PAGE, {
      serviceId: service.id,
    });

  const [payload, setPayload] = useState<BlogPayload>(
    emptyPayload(service.name),
  );
  const [isDirty, setIsDirty]       = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [showAddBlock, setShowAddBlock] = useState(false);
  const [tagInput, setTagInput]      = useState("");
  const [saveStatus, setSaveStatus]  = useState<"saved" | "unsaved" | "saving">(
    "saved",
  );

  // Always-fresh ref to payload, used inside the stable handleSave callback
  const payloadRef  = useRef(payload);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    payloadRef.current = payload;
  }, [payload]);

  // Populate from fetched data
  useEffect(() => {
    if (pageData?.servicePageByService?.payload) {
      const loaded = parsePayload(
        pageData.servicePageByService.payload as Record<string, unknown>,
        service.name,
      );
      // Batch all related state updates to avoid cascading renders
      setPayload(() => loaded);
      setIsDirty(() => false);
      setSaveStatus(() => "saved");
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageData]);

  const { mutate: upsert } = useMutation<{
    upsertServicePage: { servicePage: ServicePage };
  }>(UPSERT_SERVICE_PAGE);

  const { mutate: deletePage } = useMutation<{
    deleteServicePage: { success: boolean };
  }>(DELETE_SERVICE_PAGE);

  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    const result = await upsert({
      input: {
        serviceId: service.id,
        payload: payloadRef.current,
      },
    });
    if (result) {
      setSaveStatus("saved");
      setIsDirty(false);
      refetchPage();
    } else {
      setSaveStatus("unsaved");
    }
  }, [service.id, upsert, refetchPage]);

  // Debounced auto-save
  useEffect(() => {
    if (!isDirty) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(handleSave, 2500);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [isDirty, payload, handleSave]);

  // Ctrl/Cmd+S shortcut
  useEffect(() => {
    const handler = (e: globalThis.KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  // ─── Payload updater ────────────────────────────────────────

  const update = useCallback((updater: (p: BlogPayload) => BlogPayload) => {
    setPayload((prev) => updater(prev));
    setIsDirty(true);
    setSaveStatus("unsaved");
  }, []);

  const updateBlock = useCallback(
    (id: string, block: Block) =>
      update((p) => ({
        ...p,
        blocks: p.blocks.map((b) => (b.id === id ? block : b)),
      })),
    [update],
  );

  const deleteBlock = useCallback(
    (id: string) =>
      update((p) => ({ ...p, blocks: p.blocks.filter((b) => b.id !== id) })),
    [update],
  );

  const moveBlock = useCallback(
    (id: string, dir: -1 | 1) =>
      update((p) => {
        const idx = p.blocks.findIndex((b) => b.id === id);
        if (idx < 0) return p;
        const next = idx + dir;
        if (next < 0 || next >= p.blocks.length) return p;
        const blocks = [...p.blocks];
        [blocks[idx], blocks[next]] = [blocks[next], blocks[idx]];
        return { ...p, blocks };
      }),
    [update],
  );

  const addBlock = useCallback(
    (type: BlockType) => {
      update((p) => ({ ...p, blocks: [...p.blocks, newBlock(type)] }));
      setShowAddBlock(false);
    },
    [update],
  );

  const addTag = useCallback(() => {
    const t = tagInput.trim().toLowerCase().replace(/\s+/g, "-");
    if (!t || payload.tags.includes(t)) return;
    update((p) => ({ ...p, tags: [...p.tags, t] }));
    setTagInput("");
  }, [tagInput, payload.tags, update]);

  const removeTag = useCallback(
    (tag: string) =>
      update((p) => ({ ...p, tags: p.tags.filter((t) => t !== tag) })),
    [update],
  );

  const handleDeletePage = async () => {
    if (!window.confirm("Delete this page? This cannot be undone.")) return;
    await deletePage({ input: { serviceId: service.id } });
    setPayload(emptyPayload(service.name));
    setIsDirty(false);
    setSaveStatus("saved");
    refetchPage();
  };

  // ─── Render ─────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3 flex-wrap border-b pb-4">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={onBack}
            className="text-sm text-muted-foreground hover:text-foreground shrink-0"
          >
            ← All Services
          </button>
          <div className="min-w-0">
            <h2 className="font-semibold text-foreground leading-tight truncate">
              {service.name}
            </h2>
            <p className="text-xs text-muted-foreground">{service.businessName}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Save status indicator */}
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
          {saveStatus === "unsaved" && (
            <span className="text-xs text-amber-500">Unsaved changes</span>
          )}

          {/* Draft / Published toggle */}
          <button
            onClick={() =>
              update((p) => ({
                ...p,
                status: p.status === "published" ? "draft" : "published",
              }))
            }
            className={cn(
              "flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-full border font-medium transition-colors",
              payload.status === "published"
                ? "bg-green-50 text-green-700 border-green-300 dark:bg-green-950/40 dark:text-green-400 dark:border-green-700"
                : "bg-muted text-muted-foreground border-border",
            )}
          >
            <Globe className="w-3.5 h-3.5" />
            {payload.status === "published" ? "Published" : "Draft"}
          </button>

          {/* Preview toggle */}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setPreviewMode((v) => !v)}
            className="gap-1.5"
          >
            {previewMode ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
            {previewMode ? "Edit" : "Preview"}
          </Button>

          {/* Save */}
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save
          </Button>
        </div>
      </div>

      {/* Keyboard shortcut hint */}
      <p className="text-xs text-muted-foreground -mt-4">
        Press <kbd className="px-1 py-0.5 border rounded text-xs">Ctrl+S</kbd>{" "}
        to save. Changes auto-save after 2.5 s of inactivity.
      </p>

      {pageLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-12">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading page…
        </div>
      ) : previewMode ? (
        /* ── Preview mode ─────────────────────────────────── */
        <div className="max-w-2xl space-y-6">
          {payload.bannerImageUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={payload.bannerImageUrl}
              alt=""
              className="w-full rounded-xl object-cover max-h-72"
            />
          )}
          {payload.title && (
            <h1 className="text-3xl font-bold">{payload.title}</h1>
          )}
          {payload.subtitle && (
            <p className="text-lg text-muted-foreground">{payload.subtitle}</p>
          )}
          {payload.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {payload.tags.map((t) => (
                <Badge key={t} variant="secondary">
                  {t}
                </Badge>
              ))}
            </div>
          )}
          {payload.blocks.length === 0 && (
            <p className="text-muted-foreground italic">
              No content blocks yet. Switch to Edit mode to add some.
            </p>
          )}
          {payload.blocks.map((block) => (
            <PreviewBlock key={block.id} block={block} />
          ))}
        </div>
      ) : (
        /* ── Edit mode ────────────────────────────────────── */
        <div className="space-y-8 max-w-2xl">
          {/* Banner image */}
          <section>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Banner Image
            </label>
            <ImageUpload
              value={payload.bannerImageUrl}
              onChange={(url) => update((p) => ({ ...p, bannerImageUrl: url }))}
              onRemove={() => update((p) => ({ ...p, bannerImageUrl: "" }))}
              aspect="banner"
              folder="service-pages"
            />
          </section>

          {/* Title */}
          <section>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Title
            </label>
            <Input
              value={payload.title}
              onChange={(e) =>
                update((p) => ({ ...p, title: e.target.value }))
              }
              placeholder="Page title…"
              className="text-xl font-bold"
            />
          </section>

          {/* Subtitle */}
          <section>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Subtitle
            </label>
            <Input
              value={payload.subtitle}
              onChange={(e) =>
                update((p) => ({ ...p, subtitle: e.target.value }))
              }
              placeholder="A short, enticing description…"
            />
          </section>

          {/* Content blocks */}
          <section>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Content Blocks
            </label>

            <div className="space-y-3">
              {payload.blocks.length === 0 && (
                <p className="text-sm text-muted-foreground italic py-4 text-center border border-dashed rounded-lg">
                  No blocks yet. Add one below.
                </p>
              )}

              {payload.blocks.map((block, idx) => (
                <div
                  key={block.id}
                  className="p-3 border rounded-lg bg-card hover:border-border/80 transition-colors"
                >
                  <BlockEditor
                    block={block}
                    index={idx}
                    total={payload.blocks.length}
                    onChange={(b) => updateBlock(block.id, b)}
                    onDelete={() => deleteBlock(block.id)}
                    onMoveUp={() => moveBlock(block.id, -1)}
                    onMoveDown={() => moveBlock(block.id, 1)}
                  />
                </div>
              ))}
            </div>

            {/* Add block button + popover */}
            <div className="relative mt-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddBlock((v) => !v)}
                className="w-full gap-2 border-dashed"
              >
                <Plus className="w-3.5 h-3.5" /> Add Block
              </Button>

              {showAddBlock && (
                <>
                  {/* Click-outside overlay */}
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setShowAddBlock(false)}
                  />
                  <div className="absolute top-full left-0 mt-1.5 z-20 bg-popover border rounded-xl shadow-lg p-2 grid grid-cols-3 gap-1 w-56">
                    {BLOCK_MENU.map(({ type, label, Icon }) => (
                      <button
                        key={type}
                        onClick={() => addBlock(type)}
                        className="flex flex-col items-center gap-1.5 p-2.5 rounded-lg hover:bg-muted text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Icon className="w-4 h-4" />
                        {label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>

          {/* Tags */}
          <section>
            <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
              Tags
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2 min-h-6">
              {payload.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="gap-1 pr-1"
                >
                  <Tag className="w-3 h-3" />
                  {tag}
                  <button
                    onClick={() => removeTag(tag)}
                    className="ml-0.5 hover:text-destructive rounded-full"
                    aria-label={`Remove tag ${tag}`}
                  >
                    ×
                  </button>
                </Badge>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add a tag and press Enter…"
                className="flex-1"
              />
              <Button size="sm" variant="outline" onClick={addTag}>
                Add
              </Button>
            </div>
          </section>

          {/* Danger zone — only shown if a page record exists */}
          {pageData?.servicePageByService && (
            <section className="pt-4 border-t">
              <p className="text-xs text-muted-foreground mb-2">
                Deleting the page removes all content but leaves the service intact.
              </p>
              <Button
                size="sm"
                variant="destructive"
                onClick={handleDeletePage}
                className="gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" /> Delete Page
              </Button>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Owner Pages ──────────────────────────────────────────

export default function OwnerPages() {
  const { user, businesses } = useAuth();
  const [selected, setSelected] = useState<ServiceWithBiz | null>(null);
  const [search, setSearch] = useState("");

  const bizIds = useMemo(
    () => businesses.map((b) => b.id),
    [businesses],
  );

  const { data: svcData, loading } = useQuery<{
    services: Connection<Service>;
  }>(GET_SERVICES, { first: 200 });

  const services: ServiceWithBiz[] = useMemo(() => {
    const raw = extractNodes(svcData?.services);
    const bizNameMap: Record<string, string> = {};
    for (const b of businesses) bizNameMap[b.id] = b.name;

    return raw
      .filter((s) => bizIds.includes(s.businessId))
      .filter(
        (s) =>
          !search ||
          s.name.toLowerCase().includes(search.toLowerCase()),
      )
      .map((s) => ({ ...s, businessName: bizNameMap[s.businessId] ?? "Unknown" }));
  }, [svcData, bizIds, businesses, search]);

  if (!user) return null;

  if (selected) {
    return (
      <ServicePageEditor
        service={selected}
        onBack={() => setSelected(null)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Pages</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Write and publish rich content pages for each of your services.
        </p>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search services…"
          className="w-full pl-9 pr-3 py-2 border border-border rounded-md text-sm bg-background focus:outline-none focus:ring-1 focus:ring-ring"
        />
      </div>

      {loading ? (
        <div className="flex items-center gap-2 text-muted-foreground py-8">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading services…
        </div>
      ) : services.length === 0 ? (
        <div className="text-center py-20">
          <BookOpen className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No services found</p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            {search
              ? "Try a different search term."
              : "Create a service first to add a page to it."}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-3">
          {services.map((svc) => (
            <button
              key={svc.id}
              onClick={() => setSelected(svc)}
              className="text-left p-4 border border-border rounded-xl hover:border-primary/40 hover:bg-muted/40 transition-all group"
            >
              {svc.bannerImageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={svc.bannerImageUrl}
                  alt={svc.name}
                  className="w-full h-28 object-cover rounded-lg mb-3"
                />
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {svc.name}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {svc.businessName}
                  </div>
                </div>
                <FileText className="w-4 h-4 text-muted-foreground/40 group-hover:text-primary/50 shrink-0 mt-0.5 transition-colors" />
              </div>
              {svc.description && (
                <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">
                  {svc.description}
                </p>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
