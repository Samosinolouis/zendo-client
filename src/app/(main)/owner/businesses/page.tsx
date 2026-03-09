"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import type { GraphQLError } from "@/lib/graphql-client";
import { GET_SERVICES } from "@/graphql/queries";
import {
  CREATE_BUSINESS,
  UPDATE_BUSINESS,
  DELETE_BUSINESS,
} from "@/graphql/mutations";
import type { Service, Business, Connection } from "@/types";
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
  Building2,
  Plus,
  Briefcase,
  MoreHorizontal,
  Pencil,
  Trash2,
  AlertTriangle,
  ImageIcon,
} from "lucide-react";

// ── GQL Error resolver ───────────────────────────────────────

const GQL_ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: "Business not found.",
  FORBIDDEN: "You don't have permission to perform this action.",
  VALIDATION_ERROR: "Invalid input. Please check your fields and try again.",
};

function resolveGqlError(err: GraphQLError): string {
  const code = err.extensions?.code;
  return (code && GQL_ERROR_MESSAGES[code]) ?? err.message ?? "Something went wrong.";
}

// ── Business Form ─────────────────────────────────────────────

interface BusinessFormState {
  name: string;
  description: string;
  bannerImageUrl: string;
}

const emptyForm = (): BusinessFormState => ({
  name: "",
  description: "",
  bannerImageUrl: "",
});

interface BusinessFormProps {
  state: BusinessFormState;
  onChange: (patch: Partial<BusinessFormState>) => void;
}

function BusinessForm({ state, onChange }: Readonly<BusinessFormProps>) {
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
          folder="zendo/businesses"
          label="Upload Banner"
        />
        <p className="text-xs text-muted-foreground">
          Recommended: 1600 × 500 px. Will be shown on your business card.
        </p>
      </div>

      <Separator />

      {/* Name */}
      <div className="space-y-2">
        <Label htmlFor="biz-name">Business Name *</Label>
        <Input
          id="biz-name"
          placeholder="My awesome business"
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
        <Label htmlFor="biz-desc">Description</Label>
        <Textarea
          id="biz-desc"
          placeholder="Tell customers what your business offers…"
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
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────

export default function OwnerBusinessesPage() {
  const { user, businesses, refreshBusinesses, status } = useAuth();
  const { showSuccess, showError } = useToast();

  // ── Dialog state ───────────────────────────────────────
  const [showCreate, setShowCreate] = useState(false);
  const [editTarget, setEditTarget] = useState<Business | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Business | null>(null);

  // ── Form state ─────────────────────────────────────────
  const [createForm, setCreateForm] = useState<BusinessFormState>(emptyForm());
  const [editForm, setEditForm] = useState<BusinessFormState>(emptyForm());

  // ── Service count per business ─────────────────────────
  const bizIds = useMemo(() => businesses.map((b) => b.id), [businesses]);
  const { data: svcData } = useQuery<{ services: Connection<Service> }>(
    GET_SERVICES,
    { first: 200 },
    { skip: bizIds.length === 0 }
  );
  const svcCountMap = useMemo(() => {
    const map: Record<string, number> = {};
    for (const s of extractNodes(svcData?.services)) {
      if (bizIds.includes(s.businessId)) {
        map[s.businessId] = (map[s.businessId] || 0) + 1;
      }
    }
    return map;
  }, [svcData, bizIds]);

  // ── Mutations ──────────────────────────────────────────
  const { mutate: createBusiness, loading: creating } = useMutation<{
    createBusiness: { business: Business };
  }>(CREATE_BUSINESS, {
    onError: (err) => showError(resolveGqlError(err)),
  });

  const { mutate: updateBusiness, loading: updating } = useMutation<{
    updateBusiness: { business: Business };
  }>(UPDATE_BUSINESS, {
    onError: (err) => showError(resolveGqlError(err)),
  });

  const { mutate: deleteBusiness, loading: deleting } = useMutation<{
    deleteBusiness: { success: boolean };
  }>(DELETE_BUSINESS, {
    onError: (err) => showError(resolveGqlError(err)),
  });

  if (!user) return null;

  if (status === "loading") {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-36 bg-muted rounded animate-pulse" />
            <div className="h-4 w-80 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-9 w-32 bg-muted rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {["owner-biz-skel-1", "owner-biz-skel-2", "owner-biz-skel-3"].map((key) => (
            <Card key={key} className="overflow-hidden border-0 shadow-sm">
              <div className="h-36 bg-muted animate-pulse" />
              <CardContent className="p-5 space-y-2">
                <div className="h-5 w-2/3 bg-muted animate-pulse rounded" />
                <div className="h-4 w-full bg-muted animate-pulse rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // ── Handlers ───────────────────────────────────────────

  const handleCreate = async () => {
    const res = await createBusiness({
      input: {
        name: createForm.name.trim(),
        description: createForm.description.trim(),
        bannerImageUrl: createForm.bannerImageUrl || undefined,
      },
    });
    if (res) {
      setShowCreate(false);
      setCreateForm(emptyForm());
      refreshBusinesses();
      showSuccess("Business created successfully.");
    }
  };

  const openEdit = (biz: Business) => {
    setEditForm({
      name: biz.name,
      description: biz.description ?? "",
      bannerImageUrl: biz.bannerImageUrl ?? "",
    });
    setEditTarget(biz);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    const res = await updateBusiness({
      input: {
        id: editTarget.id,
        name: editForm.name.trim(),
        description: editForm.description.trim(),
        bannerImageUrl: editForm.bannerImageUrl || undefined,
      },
    });
    if (res) {
      setEditTarget(null);
      refreshBusinesses();
      showSuccess("Business updated successfully.");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const res = await deleteBusiness({ input: { id: deleteTarget.id } });
    if (res) {
      setDeleteTarget(null);
      refreshBusinesses();
      showSuccess("Business deleted.");
    }
  };

  // ── Render ─────────────────────────────────────────────

  return (
    <div className="space-y-8">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Businesses
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your business profiles, banners, and descriptions
          </p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Business
        </Button>
      </div>

      {/* Grid / empty state */}
      {businesses.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Building2 className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">
              No businesses yet
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Create your first business to start listing services.
            </p>
            <Button
              onClick={() => setShowCreate(true)}
              variant="outline"
              className="gap-2"
            >
              <Plus className="w-4 h-4" /> Create Business
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {businesses.map((biz) => {
            const svcCount = svcCountMap[biz.id] ?? 0;
            return (
              <Card
                key={biz.id}
                className="overflow-hidden border-0 shadow-sm group hover:shadow-md transition-shadow"
              >
                {/* Banner */}
                <div className="relative h-36 overflow-hidden bg-muted">
                  {biz.bannerImageUrl ? (
                    <Image
                      src={biz.bannerImageUrl}
                      alt={biz.name}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-linear-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <Building2 className="w-10 h-10 text-primary/40" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />

                  {/* Service count badge */}
                  <Badge className="absolute top-3 left-3 bg-background/80 text-foreground backdrop-blur-sm text-xs">
                    <Briefcase className="w-3 h-3 mr-1" />
                    {svcCount} {svcCount === 1 ? "service" : "services"}
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
                          onClick={() => openEdit(biz)}
                          className="gap-2 cursor-pointer"
                        >
                          <Pencil className="w-4 h-4" />
                          Edit Business
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => setDeleteTarget(biz)}
                          className="gap-2 cursor-pointer text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                          Delete Business
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Info */}
                <CardContent className="p-5 space-y-2">
                  <h3 className="text-lg font-semibold text-foreground line-clamp-1">
                    {biz.name}
                  </h3>
                  {biz.description ? (
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {biz.description}
                    </p>
                  ) : (
                    <p className="text-sm text-muted-foreground italic">
                      No description yet. Click ••• → Edit to add one.
                    </p>
                  )}
                  <Separator className="mt-3!" />
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start gap-2 -ml-1 text-muted-foreground hover:text-foreground"
                    onClick={() => openEdit(biz)}
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit details & banner
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ── Create Dialog ── */}
      <Dialog
        open={showCreate}
        onOpenChange={(open) => {
          setShowCreate(open);
          if (!open) setCreateForm(emptyForm());
        }}
      >
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Create New Business
            </DialogTitle>
          </DialogHeader>
          <BusinessForm
            state={createForm}
            onChange={(patch) =>
              setCreateForm((prev) => ({ ...prev, ...patch }))
            }
          />
          <DialogFooter className="pt-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCreate(false);
                setCreateForm(emptyForm());
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreate}
              disabled={!createForm.name.trim() || creating}
            >
              {creating ? "Creating…" : "Create Business"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Dialog ── */}
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
              Edit Business
            </DialogTitle>
          </DialogHeader>
          <BusinessForm
            state={editForm}
            onChange={(patch) =>
              setEditForm((prev) => ({ ...prev, ...patch }))
            }
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

      {/* ── Delete Confirmation ── */}
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
              Delete Business
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Are you sure you want to delete{" "}
            <strong className="text-foreground">{deleteTarget?.name}</strong>?{" "}
            This will also remove all associated services and data. This action
            cannot be undone.
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
              {deleting ? "Deleting…" : "Delete Business"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}