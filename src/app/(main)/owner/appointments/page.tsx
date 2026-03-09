"use client";

import { useMemo, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import { GET_SERVICES, GET_SERVICE_APPOINTMENTS, GET_USER } from "@/graphql/queries";
import {
  APPROVE_SERVICE_APPOINTMENT,
  REJECT_SERVICE_APPOINTMENT,
  COMPLETE_SERVICE_APPOINTMENT_BY_BUSINESS,
} from "@/graphql/mutations";
import type { Service, ServiceAppointment, User, Connection } from "@/types";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import { ImageUpload } from "@/components/ui/image-upload";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CalendarCheck, Check, X, Eye, Loader2, CheckCheck, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// ── Status helpers ─────────────────────────────────────────────

type AptStatus = "paid" | "approved" | "rejected" | "cancelled" | "pending" | "completed" | "for_completion";

function getStatus(apt: ServiceAppointment): AptStatus {
  if (apt.canceledAt) return "cancelled";
  if (apt.completedAt) {
    return new Date(apt.completedAt) <= new Date() ? "completed" : "for_completion";
  }
  if (apt.approvedAt) return "approved";
  if (apt.rejectedAt) return "rejected";
  if (apt.paidAt) return "paid";
  return "pending";
}

const STATUS_BADGE: Record<AptStatus, string> = {
  paid:           "bg-blue-100 text-blue-800",
  approved:       "bg-green-100 text-green-800",
  rejected:       "bg-red-100 text-red-800",
  cancelled:      "bg-gray-100 text-gray-700",
  pending:        "bg-yellow-100 text-yellow-800",
  completed:      "bg-purple-100 text-purple-800",
  for_completion: "bg-orange-100 text-orange-800",
};

const STATUS_LABEL: Record<AptStatus, string> = {
  paid:           "Paid",
  approved:       "Approved",
  rejected:       "Rejected",
  cancelled:      "Cancelled",
  pending:        "Pending",
  completed:      "Completed",
  for_completion: "For Completion",
};

// ── Payload field shape ────────────────────────────────────────

interface AppointmentFieldEntry {
  name: string;
  label: string;
  type: string;
  value: unknown;
  amount: number;
}

interface AppointmentPayload {
  version?: number;
  currency?: string;
  totalAmount?: number;
  fields?: AppointmentFieldEntry[];
  meta?: {
    submittedAt?: string;
    clientVersion?: string;
    availabilityId?: string;
  };
}

function parseAptPayload(raw: Record<string, unknown> | null | undefined): AppointmentPayload {
  if (!raw) return {};
  return {
    version:     typeof raw.version === "number" ? raw.version : undefined,
    currency:    typeof raw.currency === "string" ? raw.currency : undefined,
    totalAmount: typeof raw.totalAmount === "number" ? raw.totalAmount : undefined,
    fields:      Array.isArray(raw.fields) ? (raw.fields as AppointmentFieldEntry[]) : [],
    meta:        raw.meta && typeof raw.meta === "object" ? (raw.meta as AppointmentPayload["meta"]) : undefined,
  };
}

// ── Customer cell ──────────────────────────────────────────────

function formatFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value || "—";
  if (typeof value === "number") return String(value);
  return "—";
}

function CustomerCell({ userId }: { readonly userId?: string }) {
  const { data } = useQuery<{ user: User }>(GET_USER, { id: userId! }, { skip: !userId });
  const customer = data?.user ?? null;
  return (
    <div className="flex items-center gap-3">
      <Avatar className="h-8 w-8">
        <AvatarImage src={customer?.profilePictureUrl ?? undefined} />
        <AvatarFallback className="text-xs">
          {customer ? getInitials(customer.firstName, customer.lastName) : "?"}
        </AvatarFallback>
      </Avatar>
      <p className="text-sm font-medium text-foreground">
        {customer ? `${customer.firstName} ${customer.lastName}` : "Guest"}
      </p>
    </div>
  );
}

// ── Actions cell ───────────────────────────────────────────────

function ActionsCell({
  apt,
  refetch,
}: {
  readonly apt: ServiceAppointment;
  readonly refetch: () => void;
}) {
  const status = getStatus(apt);

  const [detailsOpen, setDetailsOpen] = useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = useState(false);
  const [proofUrl, setProofUrl] = useState<string>("");

  const { mutate: approve, loading: approving } = useMutation<{
    approveServiceAppointment: { serviceAppointment: { id: string; approvedAt: string } };
  }>(APPROVE_SERVICE_APPOINTMENT, { onCompleted: refetch });

  const { mutate: reject, loading: rejecting } = useMutation<{
    rejectServiceAppointment: { serviceAppointment: { id: string; rejectedAt: string } };
  }>(REJECT_SERVICE_APPOINTMENT, { onCompleted: refetch });

  const { mutate: completeByBusiness, loading: completing } = useMutation<{
    completeServiceAppointmentByBusiness: { serviceAppointment: { id: string; completedAt: string; completedProofUrl: string } };
  }>(COMPLETE_SERVICE_APPOINTMENT_BY_BUSINESS, {
    onCompleted: () => { refetch(); setCompleteDialogOpen(false); setProofUrl(""); },
  });

  const payload = parseAptPayload(apt.payload);
  const busy = approving || rejecting || completing;

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-7 w-7" disabled={busy}>
            {busy
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <MoreHorizontal className="w-4 h-4" />}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onClick={() => setDetailsOpen(true)}>
            <Eye className="w-3.5 h-3.5 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            className="text-green-700 focus:text-green-700 focus:bg-green-50"
            disabled={status !== "paid"}
            onClick={() => approve({ id: apt.id })}
          >
            <Check className="w-3.5 h-3.5 mr-2" />
            Mark as Approved
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-700 focus:text-red-700 focus:bg-red-50"
            disabled={status !== "paid"}
            onClick={() => reject({ id: apt.id })}
          >
            <X className="w-3.5 h-3.5 mr-2" />
            Mark as Rejected
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-purple-700 focus:text-purple-700 focus:bg-purple-50"
            disabled={status !== "approved"}
            onClick={() => setCompleteDialogOpen(true)}
          >
            <CheckCheck className="w-3.5 h-3.5 mr-2" />
            Mark as Completed
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Details dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Appointment Details</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-sm">
            {/* Status row */}
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <Badge
                variant="secondary"
                className={`capitalize text-xs font-medium ${STATUS_BADGE[status]}`}
              >
                {STATUS_LABEL[status]}
              </Badge>
            </div>

            {/* Timestamps */}
            {apt.paidAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Paid at</span>
                <span>{formatDate(apt.paidAt)}</span>
              </div>
            )}
            {apt.approvedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Approved at</span>
                <span>{formatDate(apt.approvedAt)}</span>
              </div>
            )}
            {apt.rejectedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Rejected at</span>
                <span>{formatDate(apt.rejectedAt)}</span>
              </div>
            )}
            {apt.canceledAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Cancelled at</span>
                <span>{formatDate(apt.canceledAt)}</span>
              </div>
            )}
            {apt.completedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">
                  {new Date(apt.completedAt) > new Date() ? "Completion deadline" : "Completed at"}
                </span>
                <span>{formatDate(apt.completedAt)}</span>
              </div>
            )}
            {apt.completedProofUrl && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Proof</span>
                <a
                  href={apt.completedProofUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary underline underline-offset-2 break-all text-right max-w-[60%]"
                >
                  View proof
                </a>
              </div>
            )}

            <Separator />

            {/* Pricing */}
            <div className="flex items-center justify-between font-semibold">
              <span>Total Amount</span>
              <span>{formatCurrency(apt.amount, apt.currency)}</span>
            </div>

            {/* Form fields */}
            {payload.fields && payload.fields.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <p className="font-semibold text-foreground">Form Responses</p>
                  {payload.fields.map((field) => (
                    <div key={field.name} className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground">{field.label}</p>
                        <p className="text-xs text-muted-foreground uppercase tracking-wide">
                          {field.type}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-foreground">
                          {formatFieldValue(field.value)}
                        </p>
                        {field.amount > 0 && (
                          <p className="text-xs text-muted-foreground">
                            +{formatCurrency(field.amount, apt.currency)}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Meta */}
            {payload.meta?.submittedAt && (
              <>
                <Separator />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>Submitted</span>
                  <span>{formatDate(payload.meta.submittedAt)}</span>
                </div>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Complete dialog */}
      <Dialog open={completeDialogOpen} onOpenChange={(open) => { setCompleteDialogOpen(open); if (!open) setProofUrl(""); }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Mark as Completed</DialogTitle>
          </DialogHeader>
          <div className="space-y-5 text-sm py-1">
            <p className="text-muted-foreground">
              Upload proof of service completion. The customer will have 7&nbsp;days to confirm.
            </p>
            <div className="space-y-2">
              <p className="text-xs font-medium text-foreground">Proof Image *</p>
              <ImageUpload
                value={proofUrl || undefined}
                onChange={(url) => setProofUrl(url)}
                onRemove={() => setProofUrl("")}
                aspect="auto"
                folder="zendo/proofs"
                label="Upload Proof Image"
              />
              <p className="text-xs text-muted-foreground">
                PNG, JPG, or PDF screenshot — max 10 MB.
              </p>
            </div>
            <Separator />
            <Button
              className="w-full"
              disabled={!proofUrl || completing}
              onClick={() => completeByBusiness({ id: apt.id, input: { completedProofUrl: proofUrl } })}
            >
              {completing
                ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Submitting…</>
                : <><CheckCheck className="w-4 h-4 mr-2" /> Submit Completion</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────

export default function OwnerAppointmentsPage() {
  const { user, businesses } = useAuth();

  const bizIds = useMemo(() => businesses.map((b) => b.id), [businesses]);

  const { data: svcData } = useQuery<{ services: Connection<Service> }>(
    GET_SERVICES, { first: 200 }, { skip: !user }
  );
  const allServicesRaw = extractNodes(svcData?.services);
  const ownerServices = useMemo(
    () => allServicesRaw.filter((s) => bizIds.includes(s.businessId)),
    [allServicesRaw, bizIds]
  );
  const svcMap = useMemo(() => {
    const m: Record<string, Service> = {};
    for (const s of ownerServices) m[s.id] = s;
    return m;
  }, [ownerServices]);

  const serviceIds = useMemo(() => ownerServices.map((s) => s.id), [ownerServices]);

  const { data: aptData, loading, refetch } = useQuery<{
    serviceAppointments: Connection<ServiceAppointment>;
  }>(
    GET_SERVICE_APPOINTMENTS, { first: 500 }, { skip: serviceIds.length === 0 }
  );
  const allAppointments = useMemo(() => {
    const all = extractNodes(aptData?.serviceAppointments);
    return all.filter((a) => serviceIds.includes(a.serviceId));
  }, [aptData, serviceIds]);

  if (!user) return null;

  function renderContent() {
    if (loading) {
      return (
        <div className="space-y-3">
          {[0, 1, 2, 3].map((n) => (
            <Skeleton key={n} className="h-14 rounded-xl" />
          ))}
        </div>
      );
    }

    if (allAppointments.length === 0) {
      return (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarCheck className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">No appointments yet</p>
            <p className="text-sm text-muted-foreground">
              Bookings will appear here once customers start booking.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card className="border-0 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allAppointments.map((apt) => {
                const svc = svcMap[apt.serviceId];
                const status = getStatus(apt);
                return (
                  <TableRow key={apt.id}>
                    <TableCell>
                      <CustomerCell userId={apt.userId} />
                    </TableCell>
                    <TableCell className="text-sm text-foreground">
                      {svc?.name ?? "—"}
                    </TableCell>
                    <TableCell className="font-semibold text-sm">
                      {formatCurrency(apt.amount, apt.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={`capitalize text-xs font-medium ${STATUS_BADGE[status]}`}
                      >
                        {STATUS_LABEL[status]}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <ActionsCell apt={apt} refetch={refetch} />
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Appointments</h1>
        <p className="text-muted-foreground mt-1">All bookings across your businesses</p>
      </div>

      {renderContent()}
    </div>
  );
}