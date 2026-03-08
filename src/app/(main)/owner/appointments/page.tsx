"use client";

import { useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import { GET_SERVICES, GET_SERVICE_APPOINTMENTS, GET_USER } from "@/graphql/queries";
import {
  APPROVE_SERVICE_APPOINTMENT,
  REJECT_SERVICE_APPOINTMENT,
} from "@/graphql/mutations";
import type { Service, ServiceAppointment, User, Connection } from "@/types";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { CalendarCheck, Check, X, Eye, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

// ── Status helpers ─────────────────────────────────────────────

type AptStatus = "paid" | "approved" | "rejected" | "cancelled" | "pending";

function getStatus(apt: ServiceAppointment): AptStatus {
  if (apt.canceledAt) return "cancelled";
  if (apt.approvedAt) return "approved";
  if (apt.rejectedAt) return "rejected";
  if (apt.paidAt) return "paid";
  return "pending";
}

const STATUS_BADGE: Record<AptStatus, string> = {
  paid:      "bg-blue-100 text-blue-800",
  approved:  "bg-green-100 text-green-800",
  rejected:  "bg-red-100 text-red-800",
  cancelled: "bg-gray-100 text-gray-700",
  pending:   "bg-yellow-100 text-yellow-800",
};

const STATUS_LABEL: Record<AptStatus, string> = {
  paid:      "Paid",
  approved:  "Approved",
  rejected:  "Rejected",
  cancelled: "Cancelled",
  pending:   "Pending",
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

  const { mutate: approve, loading: approving } = useMutation<{
    approveServiceAppointment: { serviceAppointment: { id: string; approvedAt: string } };
  }>(APPROVE_SERVICE_APPOINTMENT, { onCompleted: refetch });

  const { mutate: reject, loading: rejecting } = useMutation<{
    rejectServiceAppointment: { serviceAppointment: { id: string; rejectedAt: string } };
  }>(REJECT_SERVICE_APPOINTMENT, { onCompleted: refetch });

  const payload = parseAptPayload(apt.payload);

  // Final states show only the details button
  const isFinal = status === "approved" || status === "rejected" || status === "cancelled";
  const busy = approving || rejecting;

  return (
    <div className="flex items-center gap-1.5">
      {/* Details dialog */}
      <Dialog>
        <DialogTrigger asChild>
          <Button size="sm" variant="outline" className="h-7 px-2 text-xs gap-1">
            <Eye className="w-3 h-3" />
            Details
          </Button>
        </DialogTrigger>
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

      {/* Transition actions — only for Paid status */}
      {status === "paid" && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs text-green-700 border-green-200 hover:bg-green-50 hover:text-green-800"
            disabled={busy}
            onClick={() => approve({ id: apt.id })}
          >
            {approving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-7 px-2 text-xs text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800"
            disabled={busy}
            onClick={() => reject({ id: apt.id })}
          >
            {rejecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <X className="w-3 h-3" />}
          </Button>
        </>
      )}

      {/* Final state tooltip hints */}
      {isFinal && (
        <span className="text-xs text-muted-foreground italic">Final</span>
      )}
    </div>
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