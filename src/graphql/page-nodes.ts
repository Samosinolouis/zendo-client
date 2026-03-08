// ============================================================
// Zendo — Service Page Node Schema (ProseMirror-compatible)
//
// Defines every custom node type used in the service page
// content editor.  The stored payload follows a ProseMirror-
// compatible JSON document structure:
//
//   {
//     type: "doc",
//     content: [
//       { id: "abc1", type: "heading",     attrs: { level: 2, text: "Hello" } },
//       { id: "def2", type: "stats",       attrs: { items: [ ... ] } },
//       { id: "ghi3", type: "serviceForm", attrs: {} }
//     ]
//   }
//
// Why ProseMirror-compatible?
//   • Enables future migration to a real ProseMirror / Tiptap
//     editor with zero data changes.
//   • `type` + `attrs` + optional nested `content` matches the
//     ProseMirror schema API exactly.
//   • Clean JSON: easy to serialise / deserialise / version.
//
// SOLID compliance (mirrors graphql/form.ts)
//   S — one responsibility: service page node schema
//   O — add a type by appending to PageNodeType + union; no
//       existing code changes
//   L — every concrete node satisfies the BasePageNode shape
//   I — attrs live only on nodes that need them
//   D — consumers depend on PageNode (the union), not on
//       concrete node types
// ============================================================

// ── Node type discriminant ────────────────────────────────────

/**
 * All possible block node types in the service page editor.
 * Extend here to add a new node — nothing else changes except
 * the concrete interface, `newPageNode` factory, and UI metadata.
 */
export type PageNodeType =
  | "heading"
  | "paragraph"
  | "quote"
  | "callout"
  | "image"
  | "gallery"
  | "video"
  | "divider"
  | "list"
  | "steps"
  | "stats"
  | "cta"
  | "serviceForm";

// ── Attribute interfaces ───────────────────────────────────────
// Each node type owns exactly the attributes it needs (ISP).

export interface HeadingAttrs {
  /** Heading level — H2 for section headings, H3 for sub-sections. */
  level: 2 | 3;
  /** The heading text. */
  text: string;
}

export interface ParagraphAttrs {
  /** Multi-line body text. */
  text: string;
}

export interface QuoteAttrs {
  /** The quoted text. */
  text: string;
  /** Name of the person being quoted. */
  author: string;
  /** Author's role / title (e.g. "Satisfied customer"). */
  role: string;
}

export type CalloutVariant = "info" | "warning" | "success" | "danger";

export interface CalloutAttrs {
  /** Visual style variant that controls colour and icon. */
  variant: CalloutVariant;
  /** Bold title line (optional). */
  title: string;
  /** Body text of the callout. */
  text: string;
}

export type ImageSize = "sm" | "md" | "lg" | "full";

export interface ImageAttrs {
  /** Cloudinary / remote URL of the image. */
  url: string;
  /** Alt text for accessibility. */
  alt: string;
  /** Optional caption displayed beneath the image. */
  caption: string;
  /** Horizontal width constraint. */
  size: ImageSize;
}

/** A single item in a gallery or video grid. */
export interface GalleryItem {
  /** Stable unique ID for React keying. */
  id: string;
  /** Image URL. */
  url: string;
  /** Optional caption. */
  caption: string;
}

export interface GalleryAttrs {
  /** Ordered list of gallery images. */
  items: GalleryItem[];
  /** Number of columns in the grid. */
  columns: 2 | 3 | 4;
}

export interface VideoAttrs {
  /**
   * Full YouTube or Vimeo URL.
   * e.g. "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
   */
  url: string;
  /** Optional caption / description shown below the embed. */
  caption: string;
}

export type DividerStyle = "line" | "dots" | "thick";

export interface DividerAttrs {
  /** Visual style of the horizontal rule. */
  style: DividerStyle;
}

export type ListStyle = "bullet" | "ordered" | "check";

/** A single item in a list block. */
export interface ListItem {
  /** Stable unique ID. */
  id: string;
  /** Item text. */
  text: string;
  /** Only relevant for `check` list style. */
  checked?: boolean;
}

export interface ListAttrs {
  /** Presentation style. */
  style: ListStyle;
  /** Ordered list of items. */
  items: ListItem[];
}

/** A single step in a numbered process. */
export interface StepItem {
  /** Stable unique ID. */
  id: string;
  /** Short step title. */
  title: string;
  /** Longer step description. */
  description: string;
}

export interface StepsAttrs {
  /** Ordered list of process steps. */
  items: StepItem[];
}

/** A single statistic displayed in a stats block. */
export interface StatItem {
  /** Stable unique ID. */
  id: string;
  /** The prominent metric value, e.g. "500+" or "99%". */
  value: string;
  /** Short label below the value, e.g. "Happy Clients". */
  label: string;
  /** Optional symbol prepended to value, e.g. "₱". */
  prefix?: string;
  /** Optional symbol appended to value, e.g. "%". */
  suffix?: string;
  /** Optional one-line description beneath the label. */
  description?: string;
}

export interface StatsAttrs {
  /** 2–4 statistics displayed side by side. */
  items: StatItem[];
}

export type CtaVariant = "card" | "minimal" | "gradient";

export interface CtaAttrs {
  /** Bold heading for the CTA section. */
  heading: string;
  /** Supporting text below the heading. */
  text: string;
  /** Primary button label. */
  primaryLabel: string;
  /** Primary button href / anchor. */
  primaryHref: string;
  /** Optional secondary / outline button label. */
  secondaryLabel?: string;
  /** Optional secondary button href. */
  secondaryHref?: string;
  /** Visual presentation variant. */
  variant: CtaVariant;
}

export interface ServiceFormAttrs {
  /**
   * When `true` (default) the block renders a "Book this service"
   * heading above the embedded form.
   */
  showTitle?: boolean;
}

// ── Concrete node interfaces ───────────────────────────────────

export interface HeadingNode     { id: string; type: "heading";     attrs: HeadingAttrs }
export interface ParagraphNode   { id: string; type: "paragraph";   attrs: ParagraphAttrs }
export interface QuoteNode       { id: string; type: "quote";       attrs: QuoteAttrs }
export interface CalloutNode     { id: string; type: "callout";     attrs: CalloutAttrs }
export interface ImageNode       { id: string; type: "image";       attrs: ImageAttrs }
export interface GalleryNode     { id: string; type: "gallery";     attrs: GalleryAttrs }
export interface VideoNode       { id: string; type: "video";       attrs: VideoAttrs }
export interface DividerNode     { id: string; type: "divider";     attrs: DividerAttrs }
export interface ListNode        { id: string; type: "list";        attrs: ListAttrs }
export interface StepsNode       { id: string; type: "steps";       attrs: StepsAttrs }
export interface StatsNode       { id: string; type: "stats";       attrs: StatsAttrs }
export interface CtaNode         { id: string; type: "cta";         attrs: CtaAttrs }
export interface ServiceFormNode { id: string; type: "serviceForm"; attrs: ServiceFormAttrs }

// ── Discriminated union ────────────────────────────────────────

/**
 * A single page content node.  TypeScript narrows this union to
 * the appropriate concrete type when you check `node.type`.
 *
 * @example
 * if (node.type === "stats") {
 *   // node is StatsNode — node.attrs.items is available
 * }
 */
export type PageNode =
  | HeadingNode
  | ParagraphNode
  | QuoteNode
  | CalloutNode
  | ImageNode
  | GalleryNode
  | VideoNode
  | DividerNode
  | ListNode
  | StepsNode
  | StatsNode
  | CtaNode
  | ServiceFormNode;

// ── Page payload — root document ───────────────────────────────

/**
 * The complete JSON blob stored in `ServicePage.payload`.
 *
 * The `type: "doc"` field marks this as a ProseMirror-compatible
 * document root.  The `content` array maps directly to PM's
 * `doc.content` nodes.
 */
export interface PagePayload {
  /** ProseMirror document root marker. */
  type: "doc";
  /** Page / article title. */
  title: string;
  /** Short subtitle or tagline. */
  subtitle: string;
  /** Cloudinary URL for the full-width banner image. */
  bannerImageUrl: string;
  /** Searchable tags (kebab-case). */
  tags: string[];
  /** Draft pages are not displayed publicly. */
  status: "draft" | "published";
  /** Ordered list of content nodes (ProseMirror `content` array). */
  content: PageNode[];
}

// ── Factories ──────────────────────────────────────────────────

/** Generates a short random unique ID. */
export function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Returns a blank `PagePayload` for a newly created service page.
 */
export function emptyPagePayload(title = ""): PagePayload {
  return {
    type: "doc",
    title,
    subtitle: "",
    bannerImageUrl: "",
    tags: [],
    status: "draft",
    content: [],
  };
}

/**
 * Constructs a new `PageNode` with sensible defaults for the
 * given type.  The caller can spread overrides on top.
 *
 * @example
 * const node = { ...newPageNode("stats"), id: "custom-id" };
 */
export function newPageNode(type: PageNodeType): PageNode {
  const id = uid();
  switch (type) {
    case "heading":
      return { id, type, attrs: { level: 2, text: "" } };

    case "paragraph":
      return { id, type, attrs: { text: "" } };

    case "quote":
      return { id, type, attrs: { text: "", author: "", role: "" } };

    case "callout":
      return { id, type, attrs: { variant: "info", title: "", text: "" } };

    case "image":
      return { id, type, attrs: { url: "", alt: "", caption: "", size: "full" } };

    case "gallery":
      return {
        id, type, attrs: {
          items: [{ id: uid(), url: "", caption: "" }],
          columns: 3,
        },
      };

    case "video":
      return { id, type, attrs: { url: "", caption: "" } };

    case "divider":
      return { id, type, attrs: { style: "line" } };

    case "list":
      return {
        id, type, attrs: {
          style: "bullet",
          items: [
            { id: uid(), text: "" },
            { id: uid(), text: "" },
          ],
        },
      };

    case "steps":
      return {
        id, type, attrs: {
          items: [
            { id: uid(), title: "", description: "" },
            { id: uid(), title: "", description: "" },
            { id: uid(), title: "", description: "" },
          ],
        },
      };

    case "stats":
      return {
        id, type, attrs: {
          items: [
            { id: uid(), value: "", label: "" },
            { id: uid(), value: "", label: "" },
            { id: uid(), value: "", label: "" },
          ],
        },
      };

    case "cta":
      return {
        id, type, attrs: {
          heading: "",
          text: "",
          primaryLabel: "Book Now",
          primaryHref: "#book",
          variant: "card",
        },
      };

    case "serviceForm":
      return { id, type, attrs: { showTitle: true } };
  }
}

/**
 * Safely deserialises a raw JSON object from the API into a typed
 * `PagePayload`.  Handles three cases:
 *   1. New format — `type: "doc"` with `content` array.
 *   2. Legacy format — flat `blocks` array (auto-migrates).
 *   3. Unknown / null — returns an empty payload.
 */
export function parsePagePayload(
  raw: Record<string, unknown> | null | undefined,
  fallbackTitle = "",
): PagePayload {
  if (!raw) return emptyPagePayload(fallbackTitle);

  // ── New format ─────────────────────────────────────────────
  if (raw.type === "doc" && Array.isArray(raw.content)) {
    return {
      type: "doc",
      title:          (raw.title          as string)              ?? fallbackTitle,
      subtitle:       (raw.subtitle       as string)              ?? "",
      bannerImageUrl: (raw.bannerImageUrl as string)              ?? "",
      tags:           Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
      status:         (raw.status as "draft" | "published")       ?? "draft",
      content:        raw.content as PageNode[],
    };
  }

  // ── Legacy block format (auto-migrate) ─────────────────────
  if (Array.isArray(raw.blocks)) {
    type OldBlock = {
      id: string;
      type: string;
      level?: number;
      text?: string;
      url?: string;
      caption?: string;
      items?: string[];
    };

    const migrated: PageNode[] = (raw.blocks as OldBlock[])
      .map((b): PageNode | null => {
        switch (b.type) {
          case "heading":
            return {
              id: b.id, type: "heading",
              attrs: { level: (b.level as 2 | 3) ?? 2, text: b.text ?? "" },
            };
          case "paragraph":
            return { id: b.id, type: "paragraph", attrs: { text: b.text ?? "" } };
          case "image":
            return {
              id: b.id, type: "image",
              attrs: { url: b.url ?? "", alt: "", caption: b.caption ?? "", size: "full" },
            };
          case "list":
            return {
              id: b.id, type: "list",
              attrs: { style: "bullet", items: (b.items ?? []).map((t) => ({ id: uid(), text: t })) },
            };
          case "divider":
            return { id: b.id, type: "divider", attrs: { style: "line" } };
          case "callout":
            return {
              id: b.id, type: "callout",
              attrs: { variant: "info", title: "", text: b.text ?? "" },
            };
          default:
            return null;
        }
      })
      .filter((n): n is PageNode => n !== null);

    return {
      type: "doc",
      title:          (raw.title          as string) ?? fallbackTitle,
      subtitle:       (raw.subtitle       as string) ?? "",
      bannerImageUrl: (raw.bannerImageUrl as string) ?? "",
      tags:           Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
      status:         (raw.status as "draft" | "published") ?? "draft",
      content:        migrated,
    };
  }

  return emptyPagePayload(fallbackTitle);
}

// ── Type guards ────────────────────────────────────────────────

/** Returns `true` when the node has an `items` array in its attrs. */
export function hasItemsAttr(
  node: PageNode,
): node is StatsNode | StepsNode | GalleryNode | ListNode {
  return (
    node.type === "stats"   ||
    node.type === "steps"   ||
    node.type === "gallery" ||
    node.type === "list"
  );
}

// ── Display metadata ───────────────────────────────────────────

/** Category grouping for the block picker. */
export type NodeCategory = "text" | "media" | "layout" | "interactive";

export interface PageNodeMeta {
  type: PageNodeType;
  label: string;
  description: string;
  category: NodeCategory;
}

/**
 * Ordered metadata for every node type.  Used to populate the
 * block-picker UI and toolbar tooltips.
 */
export const PAGE_NODE_META: readonly PageNodeMeta[] = [
  // ── Text ────────────────────────────────────────────────────
  { type: "heading",     label: "Heading",       description: "Section or sub-heading",              category: "text"        },
  { type: "paragraph",   label: "Paragraph",     description: "Body text block",                     category: "text"        },
  { type: "quote",       label: "Quote",         description: "Blockquote with attribution",          category: "text"        },
  { type: "callout",     label: "Callout",       description: "Info, warning, tip, or success box",   category: "text"        },
  // ── Media ───────────────────────────────────────────────────
  { type: "image",       label: "Image",         description: "Single image with optional caption",   category: "media"       },
  { type: "gallery",     label: "Gallery",       description: "Multi-image grid",                     category: "media"       },
  { type: "video",       label: "Video",         description: "YouTube or Vimeo embed",               category: "media"       },
  // ── Layout ──────────────────────────────────────────────────
  { type: "divider",     label: "Divider",       description: "Visual section separator",             category: "layout"      },
  { type: "list",        label: "List",          description: "Bullet, numbered, or checklist",       category: "layout"      },
  { type: "steps",       label: "Steps",         description: "Numbered process steps",               category: "layout"      },
  { type: "stats",       label: "Stats",         description: "Key numbers and metrics",              category: "layout"      },
  // ── Interactive ─────────────────────────────────────────────
  { type: "cta",         label: "Call to Action", description: "Prominent button / action section",   category: "interactive" },
  { type: "serviceForm", label: "Booking Form",  description: "Embed the service booking form inline", category: "interactive" },
] as const;

export const PAGE_NODE_CATEGORIES: readonly { id: NodeCategory; label: string }[] = [
  { id: "text",        label: "Text" },
  { id: "media",       label: "Media" },
  { id: "layout",      label: "Layout" },
  { id: "interactive", label: "Interactive" },
] as const;
