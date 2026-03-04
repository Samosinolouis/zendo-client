"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import { GET_SERVICES, GET_SERVICE_FORM } from "@/graphql/queries";
import { CREATE_SERVICE, UPDATE_SERVICE } from "@/graphql/mutations";
import type { Service, ServiceForm, Connection } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageUpload } from "@/components/ui/image-upload";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  Plus,
  ChevronDown,
  ChevronUp,
  ListChecks,
  FileText,
  ImageIcon,
} from "lucide-react";
import Link from "next/link";

interface FormField {
  id: string;
  name: string;
  type: string;
  description?: string;
  required?: boolean;
  options?: { id: string; name: string; amount?: number; currency?: string }[];
}

/** Inline expandable form fields for a single service */
function ServiceFormDetail({ serviceId }: { serviceId: string }) {
  const { data } = useQuery<{ serviceFormByService: ServiceForm | null }>(
    GET_SERVICE_FORM, { serviceId }
  );
  const form = data?.serviceFormByService;
  const fields: FormField[] = form?.payload
    ? ((form.payload as Record<string, unknown>).fields as FormField[]) ?? []
    : [];

  if (!form) return <p className="text-sm text-muted-foreground italic">No form configured.</p>;

  if (fields.length === 0) return <p className="text-sm text-muted-foreground italic">No fields configured.</p>;

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
        <ListChecks className="w-4 h-4" />
        Booking Fields
      </h4>
      <div className="grid gap-3">
        {fields.map((field) => (
          <div key={field.id} className="p-3 rounded-lg bg-background border border-border">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm font-medium text-foreground">{field.name}</span>
              <Badge variant="outline" className="text-xs capitalize">{field.type}</Badge>
            </div>
            {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}
            {field.options && field.options.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {field.options.map((opt) => (
                  <Badge key={opt.id} variant="secondary" className="text-xs">
                    {opt.name}
                    {opt.amount != null && (
                      <span className="ml-1 opacity-70">{formatCurrency(opt.amount, opt.currency)}</span>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function OwnerServicesPage() {
  const { user, businesses } = useAuth();
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBizId, setSelectedBizId] = useState<string>("");
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formBanner, setFormBanner] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [showEdit, setShowEdit] = useState(false);
  const [editTarget, setEditTarget] = useState<string | null>(null);
  const [editFormName, setEditFormName] = useState("");
  const [editFormDesc, setEditFormDesc] = useState("");
  const [editFormBanner, setEditFormBanner] = useState("");
  const [editFormPrice, setEditFormPrice] = useState("");

  const bizIds = useMemo(() => businesses.map((b) => b.id), [businesses]);

  // Fetch services
  const { data: svcData, loading, refetch } = useQuery<{ services: Connection<Service> }>(
    GET_SERVICES, { first: 200 }, { skip: !user }
  );
  const allServicesRaw = extractNodes(svcData?.services);
  const allServices = useMemo(() => {
    const bizNameMap: Record<string, string> = {};
    for (const b of businesses) bizNameMap[b.id] = b.name;
    return allServicesRaw
      .filter((s) => bizIds.includes(s.businessId))
      .map((s) => ({ ...s, businessName: bizNameMap[s.businessId] ?? "Unknown" }));
  }, [allServicesRaw, bizIds, businesses]);

  const { mutate: createService, loading: creating } = useMutation<{
    createService: { service: Service };
  }>(CREATE_SERVICE);

  const { mutate: updateService, loading: updating } = useMutation<{
    updateService: { service: Service };
  }>(UPDATE_SERVICE);

  if (!user) return null;

  const handleCreate = async () => {
    const res = await createService({
      input: {
        businessId: selectedBizId,
        name: formName.trim(),
        description: formDesc.trim(),
        bannerImageUrl: formBanner || undefined,
        price: formPrice ? parseFloat(formPrice) : undefined,
      },
    });
    if (res) {
      setShowCreate(false);
      setFormName("");
      setFormDesc("");
      setFormBanner("");
      setFormPrice("");
      setSelectedBizId("");
      refetch();
    }
  };

  const handleOpenEdit = (service: Service) => {
    setEditTarget(service.id);
    setEditFormName(service.name);
    setEditFormDesc(service.description || "");
    setEditFormBanner(service.bannerImageUrl || "");
    setEditFormPrice(service.price ? String(service.price) : "");
    setShowEdit(true);
  };

  const handleEdit = async () => {
    if (!editTarget) return;
    const res = await updateService({
      input: {
        id: editTarget,
        name: editFormName.trim(),
        description: editFormDesc.trim(),
        bannerImageUrl: editFormBanner || undefined,
        price: editFormPrice ? parseFloat(editFormPrice) : undefined,
      },
    });
    if (res) {
      setShowEdit(false);
      setEditTarget(null);
      setEditFormName("");
      setEditFormDesc("");
      setEditFormBanner("");
      setEditFormPrice("");
      refetch();
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Services</h1>
          <p className="text-muted-foreground mt-1">Manage your service offerings</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Service
        </Button>
      </div>

      {/* Loading */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : allServices.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Briefcase className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">No services yet</p>
            <p className="text-sm text-muted-foreground mb-4">Create a service for one of your businesses.</p>
            <Button onClick={() => setShowCreate(true)} variant="outline" className="gap-2">
              <Plus className="w-4 h-4" /> Create Service
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {allServices.map((svc) => {
            const isExpanded = expandedService === svc.id;

            return (
              <Card key={svc.id} className="border-0 shadow-sm overflow-hidden">
                {/* Service header row */}
                <button
                  onClick={() => setExpandedService(isExpanded ? null : svc.id)}
                  className="w-full text-left"
                >
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                          <Briefcase className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-base font-semibold text-foreground truncate">{svc.name}</h3>
                          <p className="text-sm text-muted-foreground truncate">{svc.businessName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        {isExpanded ? (
                          <ChevronUp className="w-4 h-4 text-muted-foreground" />
                        ) : (
                          <ChevronDown className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                    </div>
                  </CardContent>
                </button>

                {/* Expanded detail */}
                {isExpanded && (
                  <>
                    <Separator />
                    <CardContent className="p-5 bg-muted/30">
                      {svc.description && (
                        <p className="text-sm text-muted-foreground mb-4">{svc.description}</p>
                      )}
                      <ServiceFormDetail serviceId={svc.id} />
                      <div className="mt-4 pt-4 border-t border-border space-y-2">
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="gap-2"
                            onClick={() => handleOpenEdit(svc)}
                          >
                            <Briefcase className="w-4 h-4" />
                            Edit Service
                          </Button>
                          <Link href={`/owner/services/${svc.id}/blog`} className="flex-1">
                            <Button variant="outline" size="sm" className="gap-2 w-full">
                              <FileText className="w-4 h-4" />
                              Manage Blog
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Create New Service
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Banner Image
              </Label>
              <ImageUpload
                value={formBanner || undefined}
                onChange={(url) => setFormBanner(url)}
                onRemove={() => setFormBanner("")}
                aspect="banner"
                folder="zendo/services"
                label="Upload Banner"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 1600 × 500 px. Shown on the service card.
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="svc-biz">Business *</Label>
              <Select value={selectedBizId} onValueChange={setSelectedBizId}>
                <SelectTrigger id="svc-biz">
                  <SelectValue placeholder="Select a business" />
                </SelectTrigger>
                <SelectContent>
                  {businesses.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-name">Service Name *</Label>
              <Input
                id="svc-name"
                placeholder="e.g. Premium Haircut"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-desc">Description</Label>
              <Textarea
                id="svc-desc"
                placeholder="Describe the service you offer"
                rows={3}
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="svc-price">Price (PHP) *</Label>
              <Input
                id="svc-price"
                type="number"
                placeholder="e.g. 500"
                step="0.01"
                min="0"
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={!selectedBizId || !formName.trim() || creating}>
              {creating ? "Creating…" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-primary" />
              Edit Service
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Banner Image
              </Label>
              <ImageUpload
                value={editFormBanner || undefined}
                onChange={(url) => setEditFormBanner(url)}
                onRemove={() => setEditFormBanner("")}
                aspect="banner"
                folder="zendo/services"
                label="Upload Banner"
              />
              <p className="text-xs text-muted-foreground">
                Recommended: 1600 × 500 px. Shown on the service card.
              </p>
            </div>
            <Separator />
            <div className="space-y-2">
              <Label htmlFor="edit-svc-name">Service Name *</Label>
              <Input
                id="edit-svc-name"
                placeholder="e.g. Premium Haircut"
                value={editFormName}
                onChange={(e) => setEditFormName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-svc-desc">Description</Label>
              <Textarea
                id="edit-svc-desc"
                placeholder="Describe the service you offer"
                rows={3}
                value={editFormDesc}
                onChange={(e) => setEditFormDesc(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-svc-price">Price (PHP) *</Label>
              <Input
                id="edit-svc-price"
                type="number"
                placeholder="e.g. 500"
                step="0.01"
                min="0"
                value={editFormPrice}
                onChange={(e) => setEditFormPrice(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEdit(false)}>
              Cancel
            </Button>
            <Button onClick={handleEdit} disabled={!editFormName.trim() || updating}>
              {updating ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
