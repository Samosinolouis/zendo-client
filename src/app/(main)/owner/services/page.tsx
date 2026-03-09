"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import type { GraphQLError } from "@/lib/graphql-client";
import { GET_SERVICES } from "@/graphql/queries";
import {
  CREATE_SERVICE,
  UPDATE_SERVICE,
  DELETE_SERVICE,
} from "@/graphql/mutations";
import type { Service, Connection } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Wrench,
  Plus,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertTriangle,
  ImageIcon,
  PhilippinePeso,
  Tag as TagIcon,
  X,
} from "lucide-react";

// GQL Error resolver

const GQL_ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: "Service not found.",
  FORBIDDEN: "You don't have permission to perform this action.",
  VALIDATION_ERROR: "Invalid input. Please check your fields and try again.",
};

function resolveGqlError(err: GraphQLError): string {
  const code = err.extensions?.code;
  return (code && GQL_ERROR_MESSAGES[code]) ?? err.message ?? "Something went wrong.";
}

// Service Form

interface ServiceFormState {
  name: string;
  description: string;
  bannerImageUrl: string;
  minPrice: string;
  maxPrice: string;
  tags: string[];
}

const emptyForm = (): ServiceFormState => ({
  name: "",
  description: "",
  bannerImageUrl: "",
  minPrice: "",
  maxPrice: "",
  tags: [],
});

interface ServiceFormProps {
  state: ServiceFormState;
  onChange: (patch: Partial<ServiceFormState>) => void;
  /** If provided, renders the business selector */
  businesses?: Array<{ id: string; name: string }>;
  selectedBizId?: string;
  onSelectBiz?: (id: string) => void;
}

// Tag chip input

function TagInput({
  tags,
  onChange,
}: Readonly<{ tags: string[]; onChange: (tags: string[]) => void }>) {
  const [input, setInput] = useState("");

  const addTag = (raw: string) => {
    const trimmed = raw.trim().toLowerCase();
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed]);
    }
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(input);
    } else if (e.key === "Backspace" && input === "" && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  return (
    <div className="rounded-md border p-2 flex flex-wrap gap-1.5 min-h-10.5 cursor-text focus-within:ring-2 focus-within:ring-ring">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 bg-primary/10 text-primary text-xs font-medium rounded-full px-2.5 py-0.5"
        >
          {tag}
          <button
            type="button"
            onClick={() => onChange(tags.filter((t) => t !== tag))}
            className="hover:text-destructive transition-colors ml-0.5"
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        className="flex-1 min-w-35 outline-none text-sm bg-transparent placeholder:text-muted-foreground"
        placeholder={tags.length === 0 ? "Add tags… (press Enter or ,)" : "Add more…"}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        onBlur={() => { if (input.trim()) addTag(input); }}
      />
    </div>
  );
}

function ServiceForm({
  state,
  onChange,
  businesses,
  selectedBizId,
  onSelectBiz,
}: Readonly<ServiceFormProps>) {
  return (
    <div className="space-y-5 py-2">
      {/* Banner image */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4" />
          Banner Image
        </Label>
        <ImageUpload
          value={state.bannerImageUrl || undefined}
          onChange={(url) => onChange({ bannerImageUrl: url })}
          onRemove={() => onChange({ bannerImageUrl: "" })}
          aspect="banner"
          folder="zendo/services"
          label="Upload Banner"
        />
        <p className="text-xs text-muted-foreground">
          Recommended: 1600 × 500 px. Will be shown on your service card.
        </p>
      </div>

      <Separator />

      {/* Business selector (create only) */}
      {businesses && onSelectBiz && (
        <div className="space-y-2">
          <Label htmlFor="svc-business">Business *</Label>
          <Select value={selectedBizId} onValueChange={onSelectBiz}>
            <SelectTrigger id="svc-business" className="w-full">
              <SelectValue placeholder="Choose a business…" />
            </SelectTrigger>
            <SelectContent position="popper">
              {businesses.map((b) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="svc-name">Service Name *</Label>
        <Input
          id="svc-name"
          placeholder="e.g. Premium Cleaning"
          value={state.name}
          onChange={(e) => onChange({ name: e.target.value })}
          maxLength={120}
        />
        <p className="text-xs text-muted-foreground text-right">
          {state.name.length}/120
        </p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="svc-desc">Description</Label>
        <Textarea
          id="svc-desc"
          placeholder="Describe what this service offers…"
          rows={4}
          value={state.description}
          onChange={(e) => onChange({ description: e.target.value })}
          maxLength={500}
          className="resize-y"
        />
        <p className="text-xs text-muted-foreground text-right">
          {state.description.length}/500
        </p>
      </div>

      {/* Pricing */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="svc-min-price">Min Price (PHP)</Label>
          <div className="relative">
            <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="svc-min-price"
              placeholder="0.00"
              value={state.minPrice}
              onChange={(e) => onChange({ minPrice: e.target.value })}
              className="pl-9"
              type="number"
              min="0"
              step="0.01"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="svc-max-price">Max Price (PHP)</Label>
          <div className="relative">
            <PhilippinePeso className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              id="svc-max-price"
              placeholder="0.00"
              value={state.maxPrice}
              onChange={(e) => onChange({ maxPrice: e.target.value })}
              className="pl-9"
              type="number"
              min="0"
              step="0.01"
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-muted-foreground -mt-2">
        Leave blank if pricing varies or is not applicable.
      </p>

      {/* Tags */}
      <div className="space-y-2">
        <Label className="flex items-center gap-2">
          <TagIcon className="w-4 h-4" />
          Tags
        </Label>
        <TagInput
          tags={state.tags}
          onChange={(tags) => onChange({ tags })}
        />
        <p className="text-xs text-muted-foreground">
          Press Enter or comma to add a tag. Tags help customers discover your service.
        </p>
      </div>
    </div>
  );
}

// Price display helper

function formatPrice(min?: number | null, max?: number | null): string | null {
  if (min == null && max == null) return null;
  const fmt = (v: number) =>
    v.toLocaleString("en-PH", { minimumFractionDigits: 2 });
  if (min != null && max != null && min !== max) return `₱${fmt(min)} – ₱${fmt(max)}`;
  if (min != null) return `₱${fmt(min)}`;
  if (max != null) return `₱${fmt(max)}`;
  return null;
}

// Main Page

type ServiceWithBizName = Service & { businessName: string };

export default function OwnerServicesPage() {
  const { user, businesses } = useAuth();
  const { showSuccess, showError } = useToast();

  // Dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBizId, setSelectedBizId] = useState("");
  const [editTarget, setEditTarget] = useState<ServiceWithBizName | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ServiceWithBizName | null>(null);

  // Form state
  const [createForm, setCreateForm] = useState<ServiceFormState>(emptyForm());
  const [editForm, setEditForm] = useState<ServiceFormState>(emptyForm());

  const bizIds = useMemo(() => businesses.map((b) => b.id), [businesses]);

  // Queries
  const { data: svcData, loading, refetch } = useQuery<{ services: Connection<Service> }>(
    GET_SERVICES,
    { first: 200 },
    { skip: bizIds.length === 0 },
  );

  const allServices = useMemo<ServiceWithBizName[]>(() => {
    const bizNameMap: Record<string, string> = {};
    for (const b of businesses) bizNameMap[b.id] = b.name;
    return extractNodes(svcData?.services)
      .filter((s) => bizIds.includes(s.businessId))
      .map((s) => ({ ...s, businessName: bizNameMap[s.businessId] ?? "Unknown" }));
  }, [svcData, bizIds, businesses]);

  // Mutations
  const { mutate: createService, loading: creating } = useMutation<{
    createService: { service: Service };
  }>(CREATE_SERVICE, {
    onError: (err) => showError(resolveGqlError(err)),
  });

  const { mutate: updateService, loading: updating } = useMutation<{
    updateService: { service: Service };
  }>(UPDATE_SERVICE, {
    onError: (err) => showError(resolveGqlError(err)),
  });

  const { mutate: deleteService, loading: deleting } = useMutation<{
    deleteService: { success: boolean; deletedId: string };
  }>(DELETE_SERVICE, {
    onError: (err) => showError(resolveGqlError(err)),
  });

  if (!user) return null;

  // Handlers

  const handleCreate = async () => {
    const res = await createService({
      input: {
        businessId: selectedBizId,
        name: createForm.name.trim(),
        description: createForm.description.trim() || undefined,
        bannerImageUrl: createForm.bannerImageUrl || undefined,
        minPrice: createForm.minPrice ? Number.parseFloat(createForm.minPrice) : undefined,
        maxPrice: createForm.maxPrice ? Number.parseFloat(createForm.maxPrice) : undefined,
        tags: createForm.tags,
      },
    });
    if (res) {
      setShowCreate(false);
      setCreateForm(emptyForm());
      setSelectedBizId("");
      refetch();
      showSuccess("Service created successfully.");
    }
  };

  const openEdit = (svc: ServiceWithBizName) => {
    setEditForm({
      name: svc.name,
      description: svc.description ?? "",
      bannerImageUrl: svc.bannerImageUrl ?? "",
      minPrice: svc.minPrice == null ? "" : String(svc.minPrice),
      maxPrice: svc.maxPrice == null ? "" : String(svc.maxPrice),
      tags: svc.tags ?? [],
    });
    setEditTarget(svc);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    const res = await updateService({
      input: {
        id: editTarget.id,
        name: editForm.name.trim(),
        description: editForm.description.trim() || undefined,
        bannerImageUrl: editForm.bannerImageUrl || undefined,
        minPrice: editForm.minPrice ? Number.parseFloat(editForm.minPrice) : undefined,
        maxPrice: editForm.maxPrice ? Number.parseFloat(editForm.maxPrice) : undefined,
        tags: editForm.tags,
      },
    });
    if (!res) return;

    setEditTarget(null);
    refetch();
    showSuccess("Service updated successfully.");
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteService({ input: { id: deleteTarget.id } });
    if (res?.deleteService?.success) {
      setDeleteTarget(null);
      refetch();
      showSuccess("Service deleted.");
    }
  };

  // â”€â”€ Render â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Services
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage the services your businesses offer
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Service
        </Button>
      </div>

      {/* Grid / empty / loading */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {(["a", "b", "c"]).map((k) => (
            <Card key={k} className="overflow-hidden border-0 shadow-sm">
              <div className="h-36 bg-muted animate-pulse" />
              <CardContent className="p-5 space-y-2">
                <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
                <div className="h-4 w-1/2 bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      {!loading && allServices.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Wrench className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">
              No services yet
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Add your first service to start accepting appointments.
            </p>
            <Button
              onClick={() => setShowCreate(true)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Create Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {allServices.map((svc) => {
            const priceLabel = formatPrice(svc.minPrice, svc.maxPrice);
            return (
              <Card
                key={svc.id}
                className="overflow-hidden border-0 shadow-sm group hover:shadow-md transition-shadow"
              >
                {/* Banner */}
                <div className="relative h-36 overflow-hidden bg-muted">
                  {svc.bannerImageUrl ? (
                    <Image
                      src={svc.bannerImageUrl}
                      alt={svc.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Wrench className="w-10 h-10 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />

                  {/* Business badge */}
                  <Badge className="absolute top-3 left-3 bg-background/80 text-foreground backdrop-blur-sm text-xs">
                    {svc.businessName}
                  </Badge>

                  {/* Actions menu */}
                  <div className="absolute top-2 right-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="secondary"
                          size="icon"
                          className="h-8 w-8 bg-background/80 backdrop-blur-sm hover:bg-background border-0 shadow"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem
                          onClick={() => openEdit(svc)}
                          className="gap-2 cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit Service
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(svc)}
                          className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Service
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Info */}
                <CardContent className="p-5 space-y-2">
                  <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                    {svc.name}
                  </h3>
                  {priceLabel ? (
                    <p className="text-sm font-medium text-primary">{priceLabel}</p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">No price set</p>
                  )}
                  {svc.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {svc.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No description yet. Click ••• → Edit to add one.
                    </p>
                  )}
                  {svc.tags && svc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {svc.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs py-0 px-1.5">
                          {tag}
                        </Badge>
                      ))}
                      {svc.tags.length > 4 && (
                        <Badge variant="secondary" className="text-xs py-0 px-1.5">
                          +{svc.tags.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) {
            setCreateForm(emptyForm());
            setSelectedBizId("");
          }
        }}
        modal={false}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              Create New Service
            </DialogTitle>
          </DialogHeader>
          <ServiceForm
            state={createForm}
            onChange={(patch) => setCreateForm((prev) => ({ ...prev, ...patch }))}
            businesses={businesses}
            selectedBizId={selectedBizId}
            onSelectBiz={setSelectedBizId}
          />
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreate(false);
                setCreateForm(emptyForm());
                setSelectedBizId("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!selectedBizId || !createForm.name.trim() || creating}
            >
              {creating ? "Creating…" : "Create Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={!!editTarget}
        onOpenChange={(open) => {
          if (!open) setEditTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="w-5 h-5 text-primary" />
              Edit Service
            </DialogTitle>
          </DialogHeader>
          <ServiceForm
            state={editForm}
            onChange={(patch) => setEditForm((prev) => ({ ...prev, ...patch }))}
          />
          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setEditTarget(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleEdit}
              disabled={!editForm.name.trim() || updating}
            >
              {updating ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Service
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong className="text-foreground">{deleteTarget?.name}</strong>?{" "}
            This will also remove all associated availability slots and data. This
            action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? "Deleting…" : "Delete Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
