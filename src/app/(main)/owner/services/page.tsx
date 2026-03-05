"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import { GET_SERVICES } from "@/graphql/queries";
import { CREATE_SERVICE, UPDATE_SERVICE, DELETE_SERVICE } from "@/graphql/mutations";
import type { Service, Connection } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus } from "lucide-react";

export default function OwnerServicesPage() {
  const { user, businesses } = useAuth();
  const [showCreate, setShowCreate] = useState(false);
  const [selectedBizId, setSelectedBizId] = useState("");
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

  const { data: svcData, loading, refetch } = useQuery<{ services: Connection<Service> }>(
    GET_SERVICES,
    { first: 200 },
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
  }>(CREATE_SERVICE, { onCompleted: () => refetch() });

  const { mutate: updateService, loading: updating } = useMutation<{
    updateService: { service: Service };
  }>(UPDATE_SERVICE, { onCompleted: () => refetch() });

  const { mutate: deleteService, loading: deleting } = useMutation<{
    deleteService: { success: boolean; deletedId: string };
  }>(DELETE_SERVICE, { onCompleted: () => refetch() });

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

  const handleDeleteService = async (service: Service) => {
    if (!window.confirm("Delete this service?")) return;
    const res = await deleteService({ input: { id: service.id } });
    if (res && res.deleteService?.success) {
      // refetch triggered by onCompleted
    }
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
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Services</h1>
        <Button onClick={() => setShowCreate(true)} className="gap-2">
          <Plus className="w-4 h-4" /> New
        </Button>
      </header>

      {loading ? (
        <p className="text-sm text-muted">Loading…</p>
      ) : allServices.length === 0 ? (
        <p className="text-sm text-muted">No services found.</p>
      ) : (
        <div className="space-y-2">
          {allServices.map((svc) => (
            <div
              key={svc.id}
              className="flex items-center justify-between p-3 border rounded"
            >
              <div>
                <div className="font-medium">{svc.name}</div>
                <div className="text-sm text-muted">{svc.businessName}</div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link href={`/owner/services/${svc.id}/availability`}>Availability</Link>
                </Button>
                <Button size="sm" onClick={() => handleOpenEdit(svc)}>
                  Edit
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDeleteService(svc)}
                  disabled={deleting}
                >
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Business *</Label>
              <Select
                value={selectedBizId}
                onValueChange={setSelectedBizId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose..." />
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
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <Label>Price (PHP)</Label>
              <Input
                value={formPrice}
                onChange={(e) => setFormPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label>Banner</Label>
              <ImageUpload
                value={formBanner}
                onChange={(url) => setFormBanner(url)}
                onRemove={() => setFormBanner("")}
                aspect="banner"
                folder="services"
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

      {/* Edit dialog */}
      <Dialog open={showEdit} onOpenChange={setShowEdit}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit service</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={editFormName}
                onChange={(e) => setEditFormName(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea
                value={editFormDesc}
                onChange={(e) => setEditFormDesc(e.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-1">
              <Label>Price (PHP)</Label>
              <Input
                value={editFormPrice}
                onChange={(e) => setEditFormPrice(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-1">
              <Label>Banner</Label>
              <ImageUpload
                value={editFormBanner}
                onChange={(url) => setEditFormBanner(url)}
                onRemove={() => setEditFormBanner("")}
                aspect="banner"
                folder="services"
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
