"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, extractNodes } from "@/graphql/hooks";
import { GET_SERVICE_APPOINTMENTS, GET_SERVICES, GET_BUSINESSES } from "@/graphql/queries";
import type { ServiceAppointment, Service, Business, Connection } from "@/types";
import { formatCurrency, formatDateTime, getStatusColor } from "@/lib/utils";
import {
  CalendarDays, ArrowRight, Clock, CheckCircle2, XCircle,
  Hourglass, Sparkles, CalendarCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

/* helpers to read payload fields */
function aptStatus(apt: ServiceAppointment): string {
  return (apt.payload as Record<string, string>)?.status ?? "pending";
}
function aptScheduledAt(apt: ServiceAppointment): string | null {
  return (apt.payload as Record<string, string>)?.scheduledAt ?? null;
}

export default function AppointmentsPage() {
  const { user, isLoggedIn } = useAuth();

  const { data: aptData, loading: aptLoading } = useQuery<{ serviceAppointments: Connection<ServiceAppointment> }>(
    GET_SERVICE_APPOINTMENTS,
    { first: 100, filter: { userId: user?.id } },
    { skip: !user }
  );
  const appointments = extractNodes(aptData?.serviceAppointments);

  // Fetch services & businesses for name resolution
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
        <div className="bg-hero px-4 pb-20 pt-12"><div className="max-w-7xl mx-auto"><Skeleton className="h-10 w-72 bg-white/10" /></div></div>
        <div className="max-w-7xl mx-auto px-4 -mt-4 pb-16 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      </div>
    );
  }

  const upcoming = appointments.filter((a) => { const s = aptStatus(a); return s === "confirmed" || s === "pending"; });
  const past = appointments.filter((a) => { const s = aptStatus(a); return s === "completed" || s === "cancelled"; });

  const statCards = [
    { label: "Total", value: appointments.length, icon: CalendarDays, bg: "bg-primary/10", text: "text-primary" },
    { label: "Confirmed", value: appointments.filter((a) => aptStatus(a) === "confirmed").length, icon: CheckCircle2, bg: "bg-green-50", text: "text-green-600" },
    { label: "Pending", value: appointments.filter((a) => aptStatus(a) === "pending").length, icon: Hourglass, bg: "bg-amber-50", text: "text-amber-600" },
    { label: "Cancelled", value: appointments.filter((a) => aptStatus(a) === "cancelled").length, icon: XCircle, bg: "bg-red-50", text: "text-red-600" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden bg-hero px-4 pb-20 pt-12">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/20 rounded-full filter blur-3xl animate-blob pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-primary/15 rounded-full filter blur-3xl animate-blob pointer-events-none" style={{ animationDelay: "3s" }} />

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="animate-slide-up">
              <Badge variant="secondary" className="bg-white/10 border-white/20 text-white/70 mb-3">
                <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Your Schedule
              </Badge>
              <h1 className="text-4xl font-extrabold text-white leading-tight">My Appointments</h1>
              <p className="text-white/60 mt-2 text-base">
                Hello, <span className="text-white font-semibold">{user?.firstName}</span>! You have{" "}
                <span className="text-primary-foreground/70 font-semibold">{upcoming.length}</span> upcoming booking{upcoming.length !== 1 ? "s" : ""}.
              </p>
            </div>
            <Button variant="outline" asChild className="animate-fade-in shrink-0 bg-white/10 border-white/20 text-white hover:bg-white/20">
              <Link href="/explore">
                <CalendarCheck className="w-4 h-4 mr-2" /> Book New Service
              </Link>
            </Button>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 20C1200 60 900 0 720 20C540 40 240 0 0 20L0 60Z" className="fill-background" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-16">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map((s, i) => (
            <Card key={s.label} style={{ animationDelay: `${i * 0.08}s` }} className={`animate-scale-in ${s.bg} border-white shadow-sm`}>
              <CardContent className="p-5">
                <s.icon className={`w-6 h-6 ${s.text} mb-3`} />
                <p className="text-3xl font-extrabold text-foreground">{s.value}</p>
                <p className={`text-sm font-medium ${s.text} mt-0.5`}>{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upcoming */}
        <section className="mb-12">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Upcoming</h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary">{upcoming.length}</Badge>
          </div>

          {upcoming.length === 0 ? (
            <Card className="animate-fade-in">
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
            <div className="space-y-4">
              {upcoming.map((apt, i) => {
                const service = getService(apt.serviceId);
                const business = service ? getBusiness(service.businessId) : null;
                const status = aptStatus(apt);
                const scheduled = aptScheduledAt(apt);
                return (
                  <Card
                    key={apt.id}
                    style={{ animationDelay: `${i * 0.07}s` }}
                    className="animate-slide-up group hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300"
                  >
                    <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className={`w-1.5 h-16 rounded-full shrink-0 ${status === "confirmed" ? "bg-green-500" : "bg-amber-400"} hidden sm:block`} />
                      <div className="w-14 h-14 bg-primary/10 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-primary/20">
                        <span className="text-xs font-bold text-primary uppercase leading-none">
                          {scheduled ? new Date(scheduled).toLocaleString("default", { month: "short" }) : "—"}
                        </span>
                        <span className="text-2xl font-extrabold text-primary leading-none">
                          {scheduled ? new Date(scheduled).getDate() : "—"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge variant="secondary" className={`mb-1.5 ${getStatusColor(status)}`}>
                          {status}
                        </Badge>
                        <h3 className="font-bold text-foreground text-base group-hover:text-primary transition-colors truncate">
                          {service?.name ?? "Unknown Service"}
                        </h3>
                        <p className="text-sm text-muted-foreground">{business?.name}</p>
                        {scheduled && (
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" /> {formatDateTime(scheduled)}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <div className="text-right">
                          <p className="text-xs text-muted-foreground">Amount</p>
                          <p className="text-lg font-bold text-foreground">{formatCurrency(apt.amount, apt.currency)}</p>
                        </div>
                        <Button size="icon" asChild>
                          <Link href={`/service/${apt.serviceId}`}>
                            <ArrowRight className="w-4 h-4" />
                          </Link>
                        </Button>
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
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-gray-500" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Past</h2>
            <Badge variant="secondary">{past.length}</Badge>
          </div>

          {past.length === 0 ? (
            <p className="text-muted-foreground text-sm">No past appointments yet.</p>
          ) : (
            <div className="space-y-3">
              {past.map((apt, i) => {
                const service = getService(apt.serviceId);
                const business = service ? getBusiness(service.businessId) : null;
                const status = aptStatus(apt);
                const scheduled = aptScheduledAt(apt);
                return (
                  <Card key={apt.id} style={{ animationDelay: `${i * 0.05}s` }} className="animate-fade-in opacity-70 hover:opacity-100 transition-opacity">
                    <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                      <div className="w-12 h-12 bg-muted rounded-xl flex flex-col items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-muted-foreground uppercase leading-none">
                          {scheduled ? new Date(scheduled).toLocaleString("default", { month: "short" }) : "—"}
                        </span>
                        <span className="text-xl font-extrabold text-muted-foreground leading-none">
                          {scheduled ? new Date(scheduled).getDate() : "—"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <Badge variant="secondary" className={`mb-1 ${getStatusColor(status)}`}>
                          {status}
                        </Badge>
                        <h3 className="font-semibold text-muted-foreground truncate">{service?.name ?? "Unknown Service"}</h3>
                        <p className="text-sm text-muted-foreground">{business?.name}</p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-base font-bold text-muted-foreground">{formatCurrency(apt.amount, apt.currency)}</p>
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
