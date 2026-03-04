"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, useMutation } from "@/graphql/hooks";
import { GET_SERVICE, GET_SERVICE_PAGE } from "@/graphql/queries";
import { UPSERT_SERVICE_PAGE, DELETE_SERVICE_PAGE } from "@/graphql/mutations";
import { uploadToCloudinary } from "@/lib/cloudinary";
import type { Service, ServicePage } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Trash2,
  GripVertical,
  Save,
  FileText,
  Eye,
  Pencil,
  AlertCircle,
  CheckCircle2,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Quote,
  Code,
  Undo2,
  Redo2,
  Copy,
  Clock,
  BarChart3,
  Zap,
  Settings,
  Palette,
  Maximize,
  Download,
  Share2,
  Home,
  Youtube,
  Lightbulb,
} from "lucide-react";

type BlockType = "text" | "heading" | "image" | "quote" | "code" | "video";

interface ContentBlock {
  id: string;
  type: BlockType;
  content: string;
  metadata?: Record<string, unknown>;
}

interface BlogData {
  title: string;
  description: string;
  blocks: ContentBlock[];
  tags: string[];
  publishedAt?: string;
  updatedAt?: string;
}

export default function ServiceBlogEditorPage() {
  const params = useParams();
  const router = useRouter();
  const { businesses } = useAuth();
  const serviceId = params.id as string;
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch service info
  const { data: svcData, loading: svcLoading } = useQuery<{ service: Service | null }>(
    GET_SERVICE, { id: serviceId }, { skip: !serviceId }
  );
  const service = svcData?.service ?? null;

  // ── Check ownership
  const bizIds = businesses.map((b) => b.id);
  const isOwner = service ? bizIds.includes(service.businessId) : false;

  // ── Fetch existing blog page
  const { data: pageData, loading: pageLoading, refetch } = useQuery<{
    servicePageByService: ServicePage | null;
  }>(GET_SERVICE_PAGE, { serviceId }, { skip: !serviceId });

  const existingPage = pageData?.servicePageByService ?? null;
  const existingBlogData = useMemo<BlogData>(
    () =>
      existingPage?.payload
        ? (existingPage.payload as unknown as BlogData)
        : { title: "", description: "", blocks: [], tags: [], publishedAt: undefined, updatedAt: undefined },
    [existingPage]
  );

  // ── Editor state
  const [blogData, setBlogData] = useState<BlogData>(existingBlogData);
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [showImageGallery, setShowImageGallery] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [history, setHistory] = useState<BlogData[]>([existingBlogData]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [autoSaved, setAutoSaved] = useState(false);
  const [imageGallery, setImageGallery] = useState<string[]>([]);

  // ── Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      if (JSON.stringify(blogData) !== JSON.stringify(existingBlogData)) {
        setAutoSaved(true);
        setTimeout(() => setAutoSaved(false), 2000);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [blogData, existingBlogData]);

  // ── Calculate reading time
  const readingTime = useMemo(() => {
    const text = blogData.blocks.map((b) => b.content).join(" ");
    const words = text.split(/\s+/).length;
    return Math.ceil(words / 200);
  }, [blogData.blocks]);

  // ── Word count
  const wordCount = useMemo(() => {
    const text = blogData.blocks.map((b) => b.content).join(" ");
    return text.split(/\s+/).filter((w) => w).length;
  }, [blogData.blocks]);

  // ── Mutations
  const { mutate: upsertPage, loading: saving } = useMutation<{
    upsertServicePage: { servicePage: ServicePage };
  }>(UPSERT_SERVICE_PAGE);

  const { mutate: deletePage, loading: deleting } = useMutation<{
    deleteServicePage: { success: boolean };
  }>(DELETE_SERVICE_PAGE);

  // ── Handlers
  const addBlock = useCallback(
    (type: BlockType) => {
      const newBlock: ContentBlock = {
        id: `block-${Date.now()}`,
        type,
        content: "",
        metadata: {},
      };
      setBlogData((prev) => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
      updateHistory([...blogData.blocks, newBlock]);
    },
    [blogData]
  );

  const updateBlock = useCallback(
    (id: string, updates: Partial<ContentBlock>) => {
      setBlogData((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) => (b.id === id ? { ...b, ...updates } : b)),
      }));
    },
    []
  );

  const removeBlock = useCallback((id: string) => {
    setBlogData((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== id),
    }));
  }, []);

  const moveBlock = useCallback((id: string, direction: "up" | "down") => {
    setBlogData((prev) => {
      const index = prev.blocks.findIndex((b) => b.id === id);
      if (index === -1) return prev;
      const newBlocks = [...prev.blocks];
      const targetIndex = direction === "up" ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= newBlocks.length) return prev;
      [newBlocks[index], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[index]];
      return { ...prev, blocks: newBlocks };
    });
  }, []);

  const updateHistory = (blocks: ContentBlock[]) => {
    const newState = { ...blogData, blocks };
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newState);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setBlogData(history[historyIndex - 1]);
    }
  }, [history, historyIndex]);

  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setBlogData(history[historyIndex + 1]);
    }
  }, [history, historyIndex]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const result = await uploadToCloudinary(file, "blog-images");
      setImageGallery((prev) => [result.secure_url, ...prev]);

      if (editingBlockId) {
        updateBlock(editingBlockId, { content: result.secure_url });
      } else {
        const newBlock: ContentBlock = {
          id: `block-${Date.now()}`,
          type: "image",
          content: result.secure_url,
          metadata: { alt: file.name },
        };
        setBlogData((prev) => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setMsg("Image upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSave = async () => {
    setMsg(null);
    const res = await upsertPage({
      input: {
        serviceId,
        payload: blogData,
      },
    });
    if (res) {
      setMsg("Blog saved successfully! 🎉");
      refetch();
    } else {
      setMsg("Failed to save blog.");
    }
  };

  const handleDelete = async () => {
    if (!existingPage) return;
    setMsg(null);
    const res = await deletePage({ input: { id: existingPage.id } });
    if (res) {
      setConfirmDelete(false);
      setMsg("Blog deleted.");
      refetch();
    } else {
      setMsg("Failed to delete blog.");
    }
  };

  const exportAsMarkdown = () => {
    let markdown = `# ${blogData.title}\n\n${blogData.description}\n\n`;
    blogData.blocks.forEach((block) => {
      if (block.type === "heading") markdown += `## ${block.content}\n\n`;
      else if (block.type === "text") markdown += `${block.content}\n\n`;
      else if (block.type === "quote") markdown += `> ${block.content}\n\n`;
      else if (block.type === "code") markdown += `\`\`\`\n${block.content}\n\`\`\`\n\n`;
      else if (block.type === "image") markdown += `![Image](${block.content})\n\n`;
    });
    const blob = new Blob([markdown], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${blogData.title || "blog"}.md`;
    a.click();
  };

  // ── Loading & guard states
  if (svcLoading || pageLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-8 w-60 rounded-md" />
        <Skeleton className="h-4 w-40 rounded-md" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-40 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!service || !isOwner) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-foreground">Access denied</h2>
        <p className="text-muted-foreground mt-2">You don't own this service.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push("/owner/services")}
              className="gap-1 -ml-2 mb-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Services
            </Button>
            <h1 className="text-4xl font-bold tracking-tight text-foreground flex items-center gap-3">
              <FileText className="w-8 h-8 text-blue-600" />
              Blog Editor
            </h1>
            <p className="text-muted-foreground mt-2">
              Create stunning blog content for <span className="font-semibold text-foreground">{service.name}</span>
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={() => setShowSettings(true)} className="gap-2">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Card className="border-0 bg-blue-50 dark:bg-blue-950/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Words</p>
                <p className="text-2xl font-bold text-foreground">{wordCount}</p>
              </div>
              <BarChart3 className="w-5 h-5 text-blue-600" />
            </CardContent>
          </Card>
          <Card className="border-0 bg-green-50 dark:bg-green-950/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Reading Time</p>
                <p className="text-2xl font-bold text-foreground">{readingTime} min</p>
              </div>
              <Clock className="w-5 h-5 text-green-600" />
            </CardContent>
          </Card>
          <Card className="border-0 bg-purple-50 dark:bg-purple-950/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Blocks</p>
                <p className="text-2xl font-bold text-foreground">{blogData.blocks.length}</p>
              </div>
              <Zap className="w-5 h-5 text-purple-600" />
            </CardContent>
          </Card>
          <Card className="border-0 bg-amber-50 dark:bg-amber-950/30">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <p className="text-sm font-bold text-foreground">{autoSaved ? "Auto-saved" : "Ready"}</p>
              </div>
              <CheckCircle2 className={`w-5 h-5 ${autoSaved ? "text-amber-600 animate-pulse" : "text-muted-foreground/30"}`} />
            </CardContent>
          </Card>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border border-border rounded-lg bg-card p-3 sticky top-4 z-20 shadow-lg">
          <Button variant="ghost" size="sm" onClick={undo} disabled={historyIndex === 0} className="gap-1">
            <Undo2 className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1} className="gap-1">
            <Redo2 className="w-4 h-4" />
          </Button>

          <Separator orientation="vertical" className="h-6" />

          <div className="flex flex-wrap gap-1">
            <Button variant="ghost" size="sm" onClick={() => addBlock("heading")} className="gap-1" title="Add Heading">
              <span className="font-bold">H</span>
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addBlock("text")} className="gap-1" title="Add Text">
              <FileText className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => { setEditingBlockId(null); fileInputRef.current?.click(); }} className="gap-1" title="Add Image">
              <ImageIcon className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addBlock("quote")} className="gap-1" title="Add Quote">
              <Quote className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addBlock("code")} className="gap-1" title="Add Code Block">
              <Code className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={() => addBlock("video")} className="gap-1" title="Add Video">
              <Youtube className="w-4 h-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          <Button variant="ghost" size="sm" onClick={() => setShowImageGallery(true)} className="gap-1 text-xs">
            <ImageIcon className="w-4 h-4" />
            Gallery
          </Button>
          <Button variant="ghost" size="sm" onClick={exportAsMarkdown} className="gap-1 text-xs">
            <Download className="w-4 h-4" />
            Export
          </Button>

          <div className="flex-1" />

          <Button
            onClick={() => setPreview(!preview)}
            variant="outline"
            size="sm"
            className="gap-2"
          >
            {preview ? <Pencil className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            {preview ? "Edit" : "Preview"}
          </Button>

          {existingPage && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDelete(true)}
              className="gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Delete
            </Button>
          )}

          <Button onClick={handleSave} disabled={saving || blogData.blocks.length === 0} className="gap-2 bg-blue-600 hover:bg-blue-700">
            <Save className="w-4 h-4" />
            {saving ? "Saving…" : "Publish"}
          </Button>
        </div>

        {/* Message */}
        {msg && (
          <div className={`p-4 rounded-lg flex items-center gap-3 ${msg.includes("Failed") ? "bg-red-50 dark:bg-red-950/30 text-red-700" : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700"}`}>
            {msg.includes("Failed") ? <AlertCircle className="w-5 h-5 shrink-0" /> : <CheckCircle2 className="w-5 h-5 shrink-0" />}
            {msg}
          </div>
        )}

        {/* Main Editor Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Editor */}
          <div className="lg:col-span-2 space-y-6">
            {!preview && (
              <>
                <Card className="border-0 bg-card/50 backdrop-blur">
                  <CardContent className="p-6 space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">Blog Title</Label>
                      <Input
                        placeholder="Catchy blog title..."
                        className="mt-2 text-lg font-bold"
                        value={blogData.title}
                        onChange={(e) => setBlogData((prev) => ({ ...prev, title: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Description / Excerpt</Label>
                      <Textarea
                        placeholder="Brief description that appears in previews..."
                        className="mt-2 resize-none"
                        rows={2}
                        value={blogData.description}
                        onChange={(e) => setBlogData((prev) => ({ ...prev, description: e.target.value }))}
                      />
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {blogData.blocks.length === 0 ? (
              <Card className="border-2 border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-20 text-center">
                  <Lightbulb className="w-14 h-14 text-muted-foreground/30 mb-4" />
                  <p className="text-lg font-semibold text-foreground mb-2">No content yet</p>
                  <p className="text-sm text-muted-foreground mb-6 max-w-sm">
                    Use the toolbar above to add text, images, quotes, code, or videos. Build your blog post block by block!
                  </p>
                  <Button onClick={() => addBlock("text")} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add First Block
                  </Button>
                </CardContent>
              </Card>
            ) : preview ? (
              /* Preview Mode */
              <div className="space-y-8 prose prose-neutral dark:prose-invert max-w-none">
                {blogData.title && <h1 className="text-4xl font-bold">{blogData.title}</h1>}
                {blogData.description && <p className="text-lg text-muted-foreground italic">{blogData.description}</p>}

                {blogData.blocks.map((block) => (
                  <div key={block.id}>
                    {block.type === "heading" && <h2 className="text-3xl font-bold mt-8 mb-4">{block.content}</h2>}
                    {block.type === "text" && (
                      <p className="text-base leading-relaxed whitespace-pre-wrap text-foreground">{block.content}</p>
                    )}
                    {block.type === "image" && (
                      <div className="relative w-full h-96 my-6 rounded-lg overflow-hidden border border-border">
                        <Image src={block.content} alt={block.metadata?.alt as string || "Blog image"} fill className="object-cover" />
                      </div>
                    )}
                    {block.type === "quote" && (
                      <blockquote className="border-l-4 border-blue-600 pl-6 py-4 italic text-muted-foreground bg-muted/30 rounded-r-lg my-6">
                        {block.content}
                      </blockquote>
                    )}
                    {block.type === "code" && (
                      <pre className="bg-slate-900 text-slate-100 p-6 rounded-lg overflow-x-auto my-6">
                        <code>{block.content}</code>
                      </pre>
                    )}
                    {block.type === "video" && (
                      <div className="relative w-full aspect-video my-6 rounded-lg overflow-hidden border border-border bg-black">
                        <iframe
                          width="100%"
                          height="100%"
                          src={block.content}
                          title="Video"
                          allowFullScreen
                          className="absolute inset-0"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-4">
                {blogData.blocks.map((block, idx) => (
                  <Card key={block.id} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                          <span className="text-xs font-medium text-muted-foreground uppercase bg-muted px-2 py-1 rounded">
                            {block.type}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => moveBlock(block.id, "up")}
                            disabled={idx === 0}
                          >
                            ↑
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => moveBlock(block.id, "down")}
                            disabled={idx === blogData.blocks.length - 1}
                          >
                            ↓
                          </Button>
                          {block.type === "image" && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                setEditingBlockId(block.id);
                                fileInputRef.current?.click();
                              }}
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-600"
                            onClick={() => removeBlock(block.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <Separator />
                    <CardContent className="pt-4">
                      {block.type === "text" && (
                        <Textarea
                          placeholder="Write your content here..."
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          rows={6}
                          className="resize-y"
                        />
                      )}
                      {block.type === "heading" && (
                        <Input
                          placeholder="Section heading..."
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          className="text-lg font-bold"
                        />
                      )}
                      {block.type === "quote" && (
                        <Textarea
                          placeholder="Enter quote..."
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          rows={3}
                          className="italic resize-y"
                        />
                      )}
                      {block.type === "code" && (
                        <Textarea
                          placeholder="Paste your code here..."
                          value={block.content}
                          onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                          rows={8}
                          className="font-mono text-sm resize-y"
                        />
                      )}
                      {block.type === "image" && (
                        <div className="space-y-4">
                          {block.content && (
                            <div className="relative w-full h-48 rounded-lg overflow-hidden border border-border">
                              <Image
                                src={block.content}
                                alt={block.metadata?.alt as string || "preview"}
                                fill
                                className="object-cover"
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Image URL</Label>
                            <Input
                              value={block.content}
                              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                              placeholder="Image URL or paste URL..."
                            />
                            <Label className="text-xs">Alt Text</Label>
                            <Input
                              value={block.metadata?.alt as string || ""}
                              onChange={(e) => updateBlock(block.id, { metadata: { ...block.metadata, alt: e.target.value } })}
                              placeholder="Describe the image..."
                            />
                          </div>
                          <Button variant="outline" size="sm" onClick={() => { setEditingBlockId(block.id); fileInputRef.current?.click(); }} className="w-full gap-2">
                            <ImageIcon className="w-4 h-4" />
                            Upload Image
                          </Button>
                        </div>
                      )}
                      {block.type === "video" && (
                        <div className="space-y-4">
                          {block.content && (
                            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-border bg-black">
                              <iframe
                                width="100%"
                                height="100%"
                                src={block.content}
                                title="Video"
                                allowFullScreen
                                className="absolute inset-0"
                              />
                            </div>
                          )}
                          <div className="space-y-2">
                            <Label>Video Embed URL (YouTube, Vimeo)</Label>
                            <Input
                              value={block.content}
                              onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                              placeholder="https://www.youtube.com/embed/..."
                            />
                            <p className="text-xs text-muted-foreground">
                              Use the embed URL. For YouTube, replace watch?v= with embed/, or paste the share link.
                            </p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Tags */}
            <Card className="border-0">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {blogData.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-100 px-3 py-1 rounded-full text-xs font-medium flex items-center gap-2"
                    >
                      {tag}
                      <button
                        onClick={() =>
                          setBlogData((prev) => ({
                            ...prev,
                            tags: prev.tags.filter((_, i) => i !== idx),
                          }))
                        }
                        className="hover:text-blue-900 dark:hover:text-blue-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <Input
                  placeholder="Add tag, press Enter"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.currentTarget.value.trim()) {
                      setBlogData((prev) => ({
                        ...prev,
                        tags: [...prev.tags, e.currentTarget.value.trim()],
                      }));
                      e.currentTarget.value = "";
                    }
                  }}
                  className="text-sm"
                />
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-0">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Quick Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => addBlock("heading")}>
                  <Plus className="w-4 h-4" />
                  Add Heading
                </Button>
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={() => addBlock("text")}>
                  <Plus className="w-4 h-4" />
                  Add Text
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full gap-2"
                  onClick={() => {
                    setEditingBlockId(null);
                    fileInputRef.current?.click();
                  }}
                >
                  <Plus className="w-4 h-4" />
                  Add Image
                </Button>
                <Button variant="outline" size="sm" className="w-full gap-2" onClick={exportAsMarkdown}>
                  <Download className="w-4 h-4" />
                  Export as Markdown
                </Button>
              </CardContent>
            </Card>

            {/* Info */}
            <Card className="border-0 bg-muted/30">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p>
                  <span className="text-muted-foreground">Words:</span>{" "}
                  <span className="font-semibold text-foreground">{wordCount}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Est. Reading Time:</span>{" "}
                  <span className="font-semibold text-foreground">{readingTime} min</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Content Blocks:</span>{" "}
                  <span className="font-semibold text-foreground">{blogData.blocks.length}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Last Updated:</span>{" "}
                  <span className="font-semibold text-foreground">
                    {blogData.updatedAt ? new Date(blogData.updatedAt).toLocaleDateString() : "Not saved"}
                  </span>
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Image Gallery Dialog */}
        <Dialog open={showImageGallery} onOpenChange={setShowImageGallery}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Image Gallery</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4 max-h-96 overflow-y-auto">
              {imageGallery.length === 0 ? (
                <p className="col-span-3 text-center text-muted-foreground py-8">No images uploaded yet</p>
              ) : (
                imageGallery.map((url, idx) => (
                  <div key={idx} className="relative group cursor-pointer">
                    <div className="relative w-full h-24 rounded-lg overflow-hidden border border-border">
                      <Image src={url} alt="gallery" fill className="object-cover" />
                    </div>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity m-auto"
                      onClick={() => {
                        const newBlock: ContentBlock = {
                          id: `block-${Date.now()}`,
                          type: "image",
                          content: url,
                          metadata: {},
                        };
                        setBlogData((prev) => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
                        setShowImageGallery(false);
                      }}
                    >
                      Add
                    </Button>
                  </div>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Settings Dialog */}
        <Dialog open={showSettings} onOpenChange={setShowSettings}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Blog Settings</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Featured Image</Label>
                <p className="text-xs text-muted-foreground mt-1">Set a hero image for this blog (Not yet configured)</p>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <Label>Publish to Social Media</Label>
                <input type="checkbox" className="w-4 h-4" disabled />
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">More settings coming soon! Enable comments, scheduling, categories, and more.</p>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete confirmation dialog */}
        <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Delete Blog</DialogTitle>
            </DialogHeader>
            <p className="text-sm text-muted-foreground">
              Are you sure you want to delete this blog for <strong>{service.name}</strong>? This action cannot be undone.
            </p>
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmDelete(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
                {deleting ? "Deleting…" : "Delete"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
      </div>
    </div>
  );
}
