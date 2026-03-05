"use client";

import { useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import { GET_SERVICES, GET_SERVICE_APPOINTMENTS, GET_USER } from "@/graphql/queries";
import { UPDATE_SERVICE_APPOINTMENT_STATUS } from "@/graphql/mutations";
import type { Service, ServiceAppointment, User, Connection } from "@/types";
import { formatCurrency, formatDateTime, getInitials } from "@/lib/utils";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CalendarCheck, Clock } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "pending",   label: "Pending" },
  { value: "confirmed", label: "Confirmed" },
  { value: "done",      label: "Done" },
  { value: "cancelled", label: "Cancelled" },
];

const STATUS_COLORS: Record<string, string> = {
  pending:   "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  done:      "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

function aptStatus(apt: ServiceAppointment): string {
  const p = apt.payload as Record<string, unknown> | null;
  return (p?.status as string) ?? "pending";
}
function aptScheduledAt(apt: ServiceAppointment): string | null {
  const p = apt.payload as Record<string, unknown> | null;
  return (p?.scheduledAt as string) ?? null;
}

function CustomerCell({ userId }: { userId?: string }) {
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
      <div>
        <p className="text-sm font-medium text-foreground">
          {customer ? `${customer.firstName} ${customer.lastName}` : "Guest"}
        </p>
      </div>
    </div>
  );
}

function StatusCell({ apt, refetch }: { apt: ServiceAppointment; refetch: () => void }) {
  const { mutate: updateStatus, loading } = useMutation<{
    updateServiceAppointmentStatus: { serviceAppointment: { id: string; payload: unknown } };
  }>(UPDATE_SERVICE_APPOINTMENT_STATUS, { onCompleted: refetch });

  const current = aptStatus(apt);

  return (
    <Select
      value={current}
      disabled={loading}
      onValueChange={(val) => updateStatus({ id: apt.id, status: val })}
    >
      <SelectTrigger className="w-32 h-7 text-xs border-0 shadow-none p-0">
        <SelectValue>
          <Badge
            variant="secondary"
            className={`capitalize text-xs font-medium ${STATUS_COLORS[current] ?? "bg-muted text-muted-foreground"}`}
          >
            {current}
          </Badge>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {STATUS_OPTIONS.map((opt) => (
          <SelectItem key={opt.value} value={opt.value} className="text-sm">
            {opt.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

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

  const { data: aptData, loading, refetch } = useQuery<{ serviceAppointments: Connection<ServiceAppointment> }>(
    GET_SERVICE_APPOINTMENTS, { first: 500 }, { skip: serviceIds.length === 0 }
  );
  const allAppointments = useMemo(() => {
    const all = extractNodes(aptData?.serviceAppointments);
    return all.filter((a) => serviceIds.includes(a.serviceId));
  }, [aptData, serviceIds]);

  if (!user) return null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Appointments</h1>
        <p className="text-muted-foreground mt-1">All bookings across your businesses</p>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 rounded-xl" />
          ))}
        </div>
      ) : allAppointments.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarCheck className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">No appointments yet</p>
            <p className="text-sm text-muted-foreground">Bookings will appear here once customers start booking.</p>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-0 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead>Customer</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead>Scheduled</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allAppointments.map((apt) => {
                  const svc = svcMap[apt.serviceId];
                  const scheduled = aptScheduledAt(apt);
                  return (
                    <TableRow key={apt.id}>
                      <TableCell>
                        <CustomerCell userId={apt.userId} />
                      </TableCell>
                      <TableCell className="text-sm">{svc?.name ?? "—"}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="w-3.5 h-3.5" />
                          {scheduled ? formatDateTime(scheduled) : "—"}
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-sm">
                        {formatCurrency(apt.amount, apt.currency)}
                      </TableCell>
                      <TableCell>
                        <StatusCell apt={apt} refetch={refetch} />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </Card>
      )}
    </div>
  );
}
