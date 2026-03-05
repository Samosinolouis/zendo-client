"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, useMutation } from "@/graphql/hooks";
import { GET_SERVICE, GET_SERVICE_AVAILABILITIES } from "@/graphql/queries";
import { CREATE_SERVICE_AVAILABILITY, DELETE_SERVICE_AVAILABILITY } from "@/graphql/mutations";
import type { Service, ServiceAvailability } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Plus, Trash2, Calendar, Clock, Users, AlertCircle } from "lucide-react";

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export default function ServiceAvailabilityPage() {
  const params = useParams();
  const router = useRouter();
  const { businesses } = useAuth();
  const serviceId = params.id as string;

  const { data: svcData, loading: svcLoading } = useQuery<{ service: Service | null }>(
    GET_SERVICE,
    { id: serviceId },
    { skip: !serviceId },
  );
  const service = svcData?.service ?? null;

  const bizIds = businesses.map((b) => b.id);
  const isOwner = service ? bizIds.includes(service.businessId) : false;

  const {
    data: slotsData,
    loading: slotsLoading,
    refetch,
  } = useQuery<{ serviceAvailabilities: ServiceAvailability[] }>(
    GET_SERVICE_AVAILABILITIES,
    { serviceId, includeAll: true },
    { skip: !serviceId },
  );
  const slots = slotsData?.serviceAvailabilities ?? [];

  // Create dialog state
  const [showCreate, setShowCreate] = useState(false);
  const [formDate, setFormDate] = useState("");
  const [formTime, setFormTime] = useState("");
  const [formDuration, setFormDuration] = useState("60");
  const [formMaxBookings, setFormMaxBookings] = useState("1");
  const [createError, setCreateError] = useState<string | null>(null);

  // Delete confirm state
  const [deleteTarget, setDeleteTarget] = useState<ServiceAvailability | null>(null);

  const { mutate: createSlot, loading: creating } = useMutation(CREATE_SERVICE_AVAILABILITY, { throwOnError: true });
  const { mutate: deleteSlot, loading: deleting } = useMutation(DELETE_SERVICE_AVAILABILITY, { throwOnError: true });

  function resetForm() {
    setFormDate("");
    setFormTime("");
    setFormDuration("60");
    setFormMaxBookings("1");
    setCreateError(null);
  }

  async function handleCreate() {
    setCreateError(null);
    if (!formDate || !formTime) {
      setCreateError("Please select a date and time.");
      return;
    }
    const scheduledAt = new Date(`${formDate}T${formTime}`).toISOString();
    const durationMinutes = parseInt(formDuration, 10);
    const maxBookings = parseInt(formMaxBookings, 10);
    if (isNaN(durationMinutes) || durationMinutes < 1) {
      setCreateError("Duration must be at least 1 minute.");
      return;
    }
    if (isNaN(maxBookings) || maxBookings < 1) {
      setCreateError("Max bookings must be at least 1.");
      return;
    }
    try {
      await createSlot({ input: { serviceId, scheduledAt, durationMinutes, maxBookings } });
      setShowCreate(false);
      resetForm();
      refetch();
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Failed to create slot.");
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteSlot({ id: deleteTarget.id });
      setDeleteTarget(null);
      refetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to delete slot.");
    }
  }

  if (svcLoading) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4 space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!service || !isOwner) {
    return (
      <div className="max-w-3xl mx-auto py-10 px-4">
        <p className="text-muted-foreground">Service not found or access denied.</p>
        <Button variant="ghost" className="mt-4" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Go Back
        </Button>
      </div>
    );
  }

  const now = new Date();
  const upcoming = slots.filter((s) => new Date(s.scheduledAt) > now);
  const past = slots.filter((s) => new Date(s.scheduledAt) <= now);

  return (
    <div className="max-w-3xl mx-auto py-10 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Availability Slots</h1>
          <p className="text-muted-foreground text-sm">{service.name}</p>
        </div>
        <Button className="ml-auto" onClick={() => { resetForm(); setShowCreate(true); }}>
          <Plus className="mr-2 h-4 w-4" /> Add Slot
        </Button>
      </div>

      {/* Upcoming slots */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Calendar className="h-4 w-4" /> Upcoming Slots
          </CardTitle>
        </CardHeader>
        <CardContent>
          {slotsLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : upcoming.length === 0 ? (
            <p className="text-muted-foreground text-sm">No upcoming slots. Add one to let customers book.</p>
          ) : (
            <ul className="divide-y">
              {upcoming.map((slot) => (
                <SlotRow key={slot.id} slot={slot} onDelete={setDeleteTarget} />
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Past slots */}
      {past.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground flex items-center gap-2">
              <Clock className="h-4 w-4" /> Past Slots
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y">
              {past.map((slot) => (
                <SlotRow key={slot.id} slot={slot} onDelete={null} />
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Create dialog */}
      <Dialog open={showCreate} onOpenChange={(o) => { if (!o) resetForm(); setShowCreate(o); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Availability Slot</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Date</Label>
                <Input
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  min={new Date().toISOString().slice(0, 10)}
                />
              </div>
              <div className="space-y-1">
                <Label>Time</Label>
                <Input
                  type="time"
                  value={formTime}
                  onChange={(e) => setFormTime(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  min={1}
                  value={formDuration}
                  onChange={(e) => setFormDuration(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label>Max Bookings per Slot</Label>
                <Input
                  type="number"
                  min={1}
                  value={formMaxBookings}
                  onChange={(e) => setFormMaxBookings(e.target.value)}
                />
              </div>
            </div>
            {createError && (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {createError}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreate(false)} disabled={creating}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating}>
              {creating ? "Creating…" : "Create Slot"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(o) => { if (!o) setDeleteTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Slot?</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {deleteTarget && `Slot on ${formatDateTime(deleteTarget.scheduledAt)} will be permanently deleted.`}
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SlotRow({
  slot,
  onDelete,
}: {
  slot: ServiceAvailability;
  onDelete: ((s: ServiceAvailability) => void) | null;
}) {
  return (
    <li className="flex items-center gap-3 py-3">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{formatDateTime(slot.scheduledAt)}</p>
        <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {slot.durationMinutes} min
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3 w-3" /> {slot.bookedCount}/{slot.maxBookings} booked
          </span>
        </div>
      </div>
      {slot.isFull ? (
        <Badge variant="secondary">Full</Badge>
      ) : (
        <Badge variant="outline" className="text-green-600 border-green-200">
          Available
        </Badge>
      )}
      {onDelete && slot.bookedCount === 0 && (
        <Button
          variant="ghost"
          size="icon"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(slot)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </li>
  );
}
