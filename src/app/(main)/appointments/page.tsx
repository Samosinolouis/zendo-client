"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import { GET_SERVICE_APPOINTMENTS, GET_SERVICES, GET_BUSINESSES } from "@/graphql/queries";
import { COMPLETE_SERVICE_APPOINTMENT } from "@/graphql/mutations";
import type { ServiceAppointment, Service, Business, Connection } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  CalendarDays, ArrowRight, Clock, CheckCircle2, XCircle,
  Hourglass, Sparkles, CalendarCheck, CheckCheck, MoreHorizontal, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";

// â”€â”€ Status helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
type AptStatus = "paid" | "approved" | "rejected" | "cancelled" | "pending" | "completed" | "for_completion";

function aptStatus(apt: ServiceAppointment): AptStatus {
  if (apt.canceledAt) return "cancelled";
  if (apt.completedAt) {
    return new Date(apt.completedAt) <= new Date() ? "completed" : "for_completion";
  }
  if (apt.approvedAt) return "approved";
  if (apt.rejectedAt) return "rejected";
  if (apt.paidAt) return "paid";
  return "pending";
}

function aptScheduledAt(apt: ServiceAppointment): string | null {
  const meta = apt.payload?.meta as Record<string, string> | undefined;
  return meta?.submittedAt ?? apt.createdAt ?? null;
}

const STATUS_LABEL: Record<AptStatus, string> = {
  paid:           "Paid",
  approved:       "Approved",
  rejected:       "Rejected",
  cancelled:      "Cancelled",
  pending:        "Pending",
  completed:      "Completed",
  for_completion: "For Completion",
};

const STATUS_BADGE: Record<AptStatus, string> = {
  paid:           "bg-blue-100 text-blue-800 border-blue-200",
  approved:       "bg-green-100 text-green-800 border-green-200",
  rejected:       "bg-red-100 text-red-800 border-red-200",
  cancelled:      "bg-gray-100 text-gray-600 border-gray-200",
  pending:        "bg-yellow-100 text-yellow-800 border-yellow-200",
  completed:      "bg-purple-100 text-purple-800 border-purple-200",
  for_completion: "bg-orange-100 text-orange-800 border-orange-200",
};

const STRIPE_COLOR: Record<AptStatus, string> = {
  approved:       "bg-green-500",
  for_completion: "bg-orange-400",
  paid:           "bg-blue-400",
  pending:        "bg-amber-400",
  completed:      "bg-purple-400",
  rejected:       "bg-red-400",
  cancelled:      "bg-gray-300",
};

// â”€â”€ Payload types â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
interface AppointmentFieldEntry {
  name: string;
  label: string;
  type: string;
  value: unknown;
  amount: number;
}
interface AppointmentPayload {
  fields?: AppointmentFieldEntry[];
  meta?: { submittedAt?: string; availabilityId?: string };
}
function parsePayload(raw: Record<string, unknown>): AppointmentPayload {
  return {
    fields: Array.isArray(raw.fields) ? (raw.fields as AppointmentFieldEntry[]) : [],
    meta:   raw.meta && typeof raw.meta === "object" ? (raw.meta as AppointmentPayload["meta"]) : undefined,
  };
}
function fmtFieldValue(value: unknown): string {
  if (value === null || value === undefined) return "â€”";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value || "â€”";
  if (typeof value === "number") return String(value);
  return "â€”";
}

// â”€â”€ Per-card action cell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function AppointmentActions({
  apt,
  service,
  business,
  onCompleted,
}: {
  readonly apt: ServiceAppointment;
  readonly service: Service | undefined;
  readonly business: Business | undefined;
  readonly onCompleted: () => void;
}) {
  const status = aptStatus(apt);
  const payload = parsePayload(apt.payload);

  const { mutate: complete, loading } = useMutation<{
    completeServiceAppointment: { serviceAppointment: { id: string; completedAt: string } };
  }>(COMPLETE_SERVICE_APPOINTMENT, { onCompleted });

  const canComplete = status === "approved" || status === "for_completion";

  return (
    <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          <DropdownMenuItem
            onSelect={(e) => e.preventDefault()}
            className="p-0"
          >
            <Dialog>
              <DialogTrigger asChild>
                <button className="flex w-full items-center gap-2 px-2 py-1.5 text-sm">
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Appointment Details</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <Badge variant="outline" className={`text-xs font-medium ${STATUS_BADGE[status]}`}>
                      {STATUS_LABEL[status]}
                    </Badge>
                  </div>
                  {service && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Service</span>
                      <span className="font-medium">{service.name}</span>
                    </div>
                  )}
                  {business && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Business</span>
                      <span>{business.name}</span>
                    </div>
                  )}
                  <Separator />
                  {apt.paidAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Paid at</span>
                      <span>{formatDateTime(apt.paidAt)}</span>
                    </div>
                  )}
                  {apt.approvedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Approved at</span>
                      <span>{formatDateTime(apt.approvedAt)}</span>
                    </div>
                  )}
                  {apt.rejectedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Rejected at</span>
                      <span>{formatDateTime(apt.rejectedAt)}</span>
                    </div>
                  )}
                  {apt.canceledAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Cancelled at</span>
                      <span>{formatDateTime(apt.canceledAt)}</span>
                    </div>
                  )}
                  {apt.completedAt && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">
                        {new Date(apt.completedAt) > new Date() ? "Completion deadline" : "Completed at"}
                      </span>
                      <span>{formatDateTime(apt.completedAt)}</span>
                    </div>
                  )}
                  {apt.completedProofUrl && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Proof</span>
                      <a
                        href={apt.completedProofUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        View proof
                      </a>
                    </div>
                  )}
                  <Separator />
                  <div className="flex items-center justify-between font-semibold">
                    <span>Total Amount</span>
                    <span>{formatCurrency(apt.amount, apt.currency)}</span>
                  </div>
                  {payload.fields && payload.fields.length > 0 && (
                    <>
                      <Separator />
                      <p className="font-semibold">Form Responses</p>
                      <div className="space-y-3">
                        {payload.fields.map((field) => (
                          <div key={field.name} className="flex items-start justify-between gap-4">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium">{field.label}</p>
                              <p className="text-xs text-muted-foreground uppercase tracking-wide">{field.type}</p>
                            </div>
                            <div className="text-right shrink-0">
                              <p>{fmtFieldValue(field.value)}</p>
                              {field.amount > 0 && (
                                <p className="text-xs text-muted-foreground">+{formatCurrency(field.amount, apt.currency)}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                  {payload.meta?.submittedAt && (
                    <>
                      <Separator />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>Submitted</span>
                        <span>{formatDateTime(payload.meta.submittedAt)}</span>
                      </div>
                    </>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </DropdownMenuItem>

          <DropdownMenuItem asChild>
            <Link href={`/service/${apt.serviceId}`} className="flex items-center gap-2">
              <ArrowRight className="w-3.5 h-3.5" />
              View Service
            </Link>
          </DropdownMenuItem>

          {canComplete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="p-0"
              >
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-purple-700 focus:text-purple-700">
                      <CheckCheck className="w-3.5 h-3.5" />
                      {status === "for_completion" ? "Confirm Completion" : "Mark as Completed"}
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-sm">
                    <DialogHeader>
                      <DialogTitle>
                        {status === "for_completion" ? "Confirm Completion" : "Mark as Completed"}
                      </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 text-sm">
                      {status === "for_completion" && apt.completedProofUrl && (
                        <div className="rounded-lg border p-3 bg-muted/50 flex items-center justify-between">
                          <span className="text-muted-foreground text-xs">Business proof</span>
                          <a
                            href={apt.completedProofUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary underline underline-offset-2"
                          >
                            View
                          </a>
                        </div>
                      )}
                      <p className="text-muted-foreground">
                        {status === "for_completion"
                          ? "The business has marked this appointment as completed. Confirm to finalize it."
                          : "Confirm that the service has been rendered and mark this appointment as completed."}
                      </p>
                      <Separator />
                      <Button className="w-full" disabled={loading} onClick={() => complete({ id: apt.id })}>
                        {loading ? (
                          <span className="flex items-center gap-2">
                            <CheckCheck className="w-4 h-4 animate-pulse" /> Processingâ€¦
                          </span>
                        ) : (
                          <span className="flex items-center gap-2">
                            <CheckCheck className="w-4 h-4" /> Mark as Completed
                          </span>
                        )}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
  );
}

export default function AppointmentsPage() {
  const { user, isLoggedIn } = useAuth();

  const { data: aptData, loading: aptLoading, refetch } = useQuery<{ serviceAppointments: Connection<ServiceAppointment> }>(
    GET_SERVICE_APPOINTMENTS,
    { first: 100, filter: { userId: user?.id } },
    { skip: !user }
  );
  const appointments = extractNodes(aptData?.serviceAppointments);

  const { data: svcData } = useQuery<{ services: Connection<Service> }>(
    GET_SERVICES, { first: 200 }, { skip: !user }
  );
  const services = extractNodes(svcData?.services);

  const { data: bizData } = useQuery<{ businesses: Connection<Business> }>(
    GET_BUSINESSES, { first: 200 }, { skip: !user }
  );
  const businesses = extractNodes(bizData?.businesses);

  const getService = (id: string) => services.find((s) => s.id === id);
  const getBusiness = (businessId: string) => businesses.find((b) => b.id === businessId);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-hero flex items-center justify-center px-4">
        <div className="text-center animate-scale-in">
          <div className="w-24 h-24 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
            <CalendarDays className="w-10 h-10 text-white/70" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Your Appointments</h1>
          <p className="text-white/60 mb-8 text-lg">Sign in to view and manage your bookings.</p>
          <Button
            onClick={() => signIn("keycloak", { callbackUrl: "/onboarding" })}
            variant="secondary"
            size="lg"
          >
            Sign in to continue <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (aptLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-hero px-4 pb-20 pt-12">
          <div className="max-w-7xl mx-auto"><Skeleton className="h-10 w-72 bg-white/10" /></div>
        </div>
        <div className="max-w-7xl mx-auto px-4 -mt-4 pb-16 space-y-4">
          {[0, 1, 2, 3].map((n) => <Skeleton key={n} className="h-28 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const upcoming = appointments.filter((a) => {
    const s = aptStatus(a);
    return s === "pending" || s === "paid" || s === "approved" || s === "for_completion";
  });
  const past = appointments.filter((a) => {
    const s = aptStatus(a);
    return s === "rejected" || s === "cancelled" || s === "completed";
  });

  const statCards = [
    { label: "Total",     value: appointments.length,                                                                                      icon: CalendarDays,  bg: "bg-primary/10", text: "text-primary"    },
    { label: "Approved",  value: appointments.filter((a) => aptStatus(a) === "approved").length,                                           icon: CheckCircle2,  bg: "bg-green-50",   text: "text-green-600"  },
    { label: "Pending",   value: appointments.filter((a) => { const s = aptStatus(a); return s === "pending" || s === "paid"; }).length,    icon: Hourglass,     bg: "bg-amber-50",   text: "text-amber-600"  },
    { label: "Cancelled", value: appointments.filter((a) => { const s = aptStatus(a); return s === "cancelled" || s === "rejected"; }).length, icon: XCircle,    bg: "bg-red-50",     text: "text-red-600"    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative bg-hero px-4 pb-20 pt-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl animate-blob" />
          <div className="absolute bottom-0 left-20 w-64 h-64 bg-primary/15 rounded-full filter blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
        </div>

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="animate-slide-up">
              <Badge variant="secondary" className="bg-white/10 border-white/20 text-white/70 mb-3">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Your Schedule
              </Badge>
              <h1 className="text-4xl font-extrabold text-white leading-tight">My Appointments</h1>
              <p className="text-white/60 mt-2 text-base">
                Hello, <span className="text-white font-semibold">{user?.firstName}</span>! You have{" "}
                <span className="text-white font-semibold">{upcoming.length}</span>{" "}
                upcoming {upcoming.length === 1 ? "booking" : "bookings"}.
              </p>
            </div>
            <Button variant="outline" asChild className="animate-fade-in shrink-0 bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Link href="/explore">
                <CalendarCheck className="w-4 h-4 mr-2" /> Book New Service
              </Link>
            </Button>
          </div>
        </div>

        <div className="absolute -bottom-0.5 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path d="M0 60L1440 60L1440 20C1200 60 900 0 720 20C540 40 240 0 0 20L0 60Z" className="fill-background" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-16">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map((s, i) => (
            <Card key={s.label} style={{ animationDelay: `${i * 0.08}s` }} className="animate-scale-in shadow-sm">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`w-10 h-10 ${s.bg} rounded-xl flex items-center justify-center shrink-0`}>
                  <s.icon className={`w-5 h-5 ${s.text}`} />
                </div>
                <div>
                  <p className="text-2xl font-extrabold text-foreground leading-none">{s.value}</p>
                  <p className={`text-xs font-medium ${s.text} mt-0.5`}>{s.label}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upcoming */}
        <section className="mb-12">
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Upcoming</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">{upcoming.length}</Badge>
          </div>

          {upcoming.length === 0 ? (
            <Card className="animate-fade-in border-dashed">
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                  <CalendarDays className="w-9 h-9 text-primary/40" />
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">No upcoming appointments</h3>
                <p className="text-muted-foreground mb-6">Ready to book something amazing?</p>
                <Button asChild>
                  <Link href="/explore">
                    Explore Services <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {upcoming.map((apt, i) => {
                const service = getService(apt.serviceId);
                const business = service ? getBusiness(service.businessId) : null;
                const status = aptStatus(apt);
                const scheduled = aptScheduledAt(apt);
                return (
                  <Card
                    key={apt.id}
                    style={{ animationDelay: `${i * 0.06}s` }}
                    className="animate-slide-up hover:shadow-md transition-shadow duration-200"
                  >
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        {/* Status stripe */}
                        <div className={`w-1 rounded-l-xl shrink-0 ${STRIPE_COLOR[status]}`} />

                        <div className="flex flex-1 items-center gap-4 p-4 min-w-0">
                          {/* Date badge */}
                          <div className="w-12 h-12 bg-muted rounded-xl flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none">
                              {scheduled ? new Date(scheduled).toLocaleString("default", { month: "short" }) : "â€”"}
                            </span>
                            <span className="text-xl font-extrabold text-foreground leading-none">
                              {scheduled ? new Date(scheduled).getDate() : "â€”"}
                            </span>
                          </div>

                          {/* Main info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                              <Badge variant="outline" className={`text-xs font-semibold px-2 py-0 ${STATUS_BADGE[status]}`}>
                                {STATUS_LABEL[status]}
                              </Badge>
                              {status === "for_completion" && apt.completedProofUrl && (
                                <a
                                  href={apt.completedProofUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-primary underline underline-offset-2"
                                >
                                  View proof
                                </a>
                              )}
                            </div>
                            <p className="font-semibold text-foreground text-sm truncate">
                              {service?.name ?? "Unknown Service"}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">{business?.name ?? "â€”"}</p>
                            {scheduled && (
                              <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                                <Clock className="w-3 h-3" /> {formatDateTime(scheduled)}
                              </p>
                            )}
                          </div>

                          {/* Amount + actions */}
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right hidden sm:block">
                              <p className="text-xs text-muted-foreground">Amount</p>
                              <p className="text-base font-bold text-foreground">{formatCurrency(apt.amount, apt.currency)}</p>
                            </div>
                            <AppointmentActions
                              apt={apt}
                              service={service}
                              business={business ?? undefined}
                              onCompleted={refetch}
                            />
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Past */}
        <section>
          <div className="flex items-center gap-2.5 mb-5">
            <div className="w-8 h-8 bg-muted rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Past</h2>
            <Badge variant="secondary">{past.length}</Badge>
          </div>

          {past.length === 0 ? (
            <p className="text-muted-foreground text-sm">No past appointments yet.</p>
          ) : (
            <div className="space-y-2">
              {past.map((apt, i) => {
                const service = getService(apt.serviceId);
                const business = service ? getBusiness(service.businessId) : null;
                const status = aptStatus(apt);
                const scheduled = aptScheduledAt(apt);
                return (
                  <Card key={apt.id} style={{ animationDelay: `${i * 0.04}s` }} className="animate-fade-in opacity-60 hover:opacity-100 transition-opacity duration-200">
                    <CardContent className="p-0">
                      <div className="flex items-stretch">
                        <div className={`w-1 rounded-l-xl shrink-0 ${STRIPE_COLOR[status]}`} />
                        <div className="flex flex-1 items-center gap-4 p-3.5 min-w-0">
                          <div className="w-11 h-11 bg-muted rounded-lg flex flex-col items-center justify-center shrink-0">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase leading-none">
                              {scheduled ? new Date(scheduled).toLocaleString("default", { month: "short" }) : "â€”"}
                            </span>
                            <span className="text-lg font-extrabold text-muted-foreground leading-none">
                              {scheduled ? new Date(scheduled).getDate() : "â€”"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <Badge variant="outline" className={`text-xs font-semibold px-2 py-0 mb-0.5 ${STATUS_BADGE[status]}`}>
                              {STATUS_LABEL[status]}
                            </Badge>
                            <p className="font-medium text-sm text-muted-foreground truncate">{service?.name ?? "Unknown Service"}</p>
                            <p className="text-xs text-muted-foreground truncate">{business?.name ?? "â€”"}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-sm font-bold text-muted-foreground">{formatCurrency(apt.amount, apt.currency)}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </section>

        {/* Bottom CTA if empty */}
        {appointments.length === 0 && (
          <div className="mt-10 rounded-3xl overflow-hidden relative bg-hero p-10 text-center animate-fade-in">
            <div className="absolute inset-0 bg-linear-to-br from-primary/80 to-primary/90" />
            <div className="relative">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Start Your Journey</h3>
              <p className="text-white/70 mb-6">Book your first appointment with one of our amazing services.</p>
              <Button variant="secondary" size="lg" asChild>
                <Link href="/explore">
                  Browse Services <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
