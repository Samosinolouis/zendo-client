"use client";

import { useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, extractNodes } from "@/graphql/hooks";
import { GET_SERVICES, GET_SERVICE_APPOINTMENTS, GET_PAYOUT_STATEMENTS, GET_SERVICE_FEEDBACKS } from "@/graphql/queries";
import type { Service, ServiceAppointment, PayoutStatement, ServiceFeedback, Connection } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Building2,
  Briefcase,
  CalendarCheck,
  Star,
  TrendingUp,
  Receipt,
  Percent,
  DollarSign,
} from "lucide-react";

function aptStatus(apt: ServiceAppointment): string {
  const p = apt.payload as Record<string, unknown> | null;
  return (p?.status as string) ?? "pending";
}

export default function OwnerDashboardPage() {
  const { user, businesses } = useAuth();

  // Collect all business IDs
  const bizIds = useMemo(() => businesses.map((b) => b.id), [businesses]);

  // Fetch services for all businesses
  const { data: svcData, loading: svcLoading } = useQuery<{ services: Connection<Service> }>(
    GET_SERVICES, { first: 200 }, { skip: !user }
  );
  const allServicesRaw = extractNodes(svcData?.services);
  const allServices = useMemo(
    () => allServicesRaw.filter((s) => bizIds.includes(s.businessId)),
    [allServicesRaw, bizIds]
  );

  // Fetch appointments (all, then filter to owner's services)
  const serviceIds = useMemo(() => allServices.map((s) => s.id), [allServices]);
  const { data: aptData, loading: aptLoading } = useQuery<{ serviceAppointments: Connection<ServiceAppointment> }>(
    GET_SERVICE_APPOINTMENTS, { first: 500 }, { skip: serviceIds.length === 0 }
  );
  const allAppointments = useMemo(() => {
    const all = extractNodes(aptData?.serviceAppointments);
    return all.filter((a) => serviceIds.includes(a.serviceId));
  }, [aptData, serviceIds]);

  // Fetch payouts for each business
  const { data: payData, loading: payLoading } = useQuery<{ payoutStatements: Connection<PayoutStatement> }>(
    GET_PAYOUT_STATEMENTS, { first: 200 }, { skip: bizIds.length === 0 }
  );
  const allPayouts = useMemo(() => {
    const all = extractNodes(payData?.payoutStatements);
    return all.filter((p) => bizIds.includes(p.businessId));
  }, [payData, bizIds]);

  // Fetch feedbacks for owner's services
  const { data: fbData, loading: fbLoading } = useQuery<{ serviceFeedbacks: Connection<ServiceFeedback> }>(
    GET_SERVICE_FEEDBACKS, { first: 200 }, { skip: serviceIds.length === 0 }
  );
  const allFeedbacks = useMemo(() => {
    const all = extractNodes(fbData?.serviceFeedbacks);
    return all.filter((f) => serviceIds.includes(f.serviceId));
  }, [fbData, serviceIds]);

  const loading = svcLoading || aptLoading || payLoading || fbLoading;

  if (!user) return null;

  const avgRating =
    allFeedbacks.length > 0
      ? (allFeedbacks.reduce((s, f) => s + (f.rating ?? 0), 0) / allFeedbacks.length).toFixed(1)
      : "—";

  const totalGross = allPayouts.reduce((s, p) => s + p.grossCollection, 0);
  const totalFees = allPayouts.reduce((s, p) => s + p.totalFees, 0);
  const totalTax = allPayouts.reduce((s, p) => s + p.withholdingTax, 0);
  const totalNet = allPayouts.reduce((s, p) => s + p.netPayout, 0);

  const statusCounts = allAppointments.reduce(
    (acc, a) => {
      const st = aptStatus(a);
      acc[st] = (acc[st] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statusConfig: Record<string, { color: string; bg: string }> = {
    completed: { color: "bg-green-500", bg: "bg-green-100 dark:bg-green-900/30" },
    confirmed: { color: "bg-primary", bg: "bg-primary/10 dark:bg-primary/20" },
    pending: { color: "bg-yellow-500", bg: "bg-yellow-100 dark:bg-yellow-900/30" },
    cancelled: { color: "bg-red-500", bg: "bg-red-100 dark:bg-red-900/30" },
  };

  const statCards = [
    { icon: Building2, label: "Businesses", value: businesses.length, color: "text-violet-600", bg: "bg-violet-50 dark:bg-violet-950/30" },
    { icon: Briefcase, label: "Services", value: allServices.length, color: "text-primary", bg: "bg-primary/10 dark:bg-primary/20" },
    { icon: CalendarCheck, label: "Appointments", value: allAppointments.length, color: "text-emerald-600", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
    { icon: Star, label: "Avg Rating", value: avgRating, color: "text-amber-600", bg: "bg-amber-50 dark:bg-amber-950/30" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of your business performance</p>
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          <Skeleton className="h-48 rounded-xl" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Skeleton className="h-56 rounded-xl" />
            <Skeleton className="h-56 rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {statCards.map((stat) => (
              <Card key={stat.label} className="border-0 shadow-sm">
                <CardContent className="p-5">
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl ${stat.bg}`}>
                      <stat.icon className={`w-5 h-5 ${stat.color}`} />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                      <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Revenue Summary */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Revenue Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                {[
                  { icon: DollarSign, label: "Gross Revenue", value: formatCurrency(totalGross), color: "text-foreground" },
                  { icon: Receipt, label: "Platform Fees", value: `- ${formatCurrency(totalFees)}`, color: "text-red-600" },
                  { icon: Percent, label: "Tax Withheld", value: `- ${formatCurrency(totalTax)}`, color: "text-orange-600" },
                  { icon: TrendingUp, label: "Net Payout", value: formatCurrency(totalNet), color: "text-emerald-600" },
                ].map((item) => (
                  <div key={item.label} className="text-center">
                    <div className="flex justify-center mb-2">
                      <item.icon className={`w-5 h-5 ${item.color}`} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
                    <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Appointment Breakdown + Recent Feedback */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Appointment Breakdown */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <CalendarCheck className="w-5 h-5 text-primary" />
                  Appointment Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {Object.entries(statusCounts).length === 0 ? (
                  <p className="text-muted-foreground text-sm">No appointments yet.</p>
                ) : (
                  Object.entries(statusCounts).map(([status, count]) => {
                    const cfg = statusConfig[status] || { color: "bg-muted", bg: "bg-muted" };
                    const pct = allAppointments.length > 0 ? Math.round((count / allAppointments.length) * 100) : 0;
                    return (
                      <div key={status} className="space-y-1.5">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className={`capitalize text-xs ${cfg.bg}`}>
                              {status}
                            </Badge>
                          </div>
                          <span className="text-muted-foreground font-medium">
                            {count} ({pct}%)
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-muted overflow-hidden">
                          <div className={`h-full rounded-full ${cfg.color} transition-all`} style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Recent Feedback */}
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Star className="w-5 h-5 text-amber-500" />
                  Recent Feedback
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {allFeedbacks.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No feedback yet.</p>
                ) : (
                  allFeedbacks.slice(0, 5).map((fb) => {
                    const title = (fb.payload as Record<string, unknown>)?.title as string | undefined;
                    return (
                      <div key={fb.id} className="flex items-start gap-3">
                        <div className="flex items-center gap-0.5 mt-0.5 shrink-0">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${i < (fb.rating ?? 0) ? "text-amber-400 fill-amber-400" : "text-muted-foreground/30"}`}
                            />
                          ))}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm text-foreground line-clamp-2">{title ?? "Untitled"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">Rating: {fb.rating ?? 0}/5</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
