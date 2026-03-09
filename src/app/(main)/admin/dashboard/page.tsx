"use client";

import { useMemo } from "react";
import { useQuery, extractNodes } from "@/graphql/hooks";
import { GET_BUSINESSES, GET_PAYMENTS, GET_SERVICES } from "@/graphql/queries";
import type { Business, Connection, Payment, Service } from "@/types";
import { formatCurrency } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, CreditCard, LineChart, Wrench } from "lucide-react";

type MonthlyPoint = { label: string; total: number };

function getMonthlySeries(payments: Payment[]): MonthlyPoint[] {
  const now = new Date();
  const months: Date[] = [];
  for (let i = 5; i >= 0; i -= 1) {
    months.push(new Date(now.getFullYear(), now.getMonth() - i, 1));
  }

  return months.map((monthStart) => {
    const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
    const total = payments
      .filter((p) => {
        if (!p.paidAt) return false;
        const date = new Date(p.paidAt);
        return date >= monthStart && date < monthEnd;
      })
      .reduce((sum, p) => sum + Number.parseFloat(p.amount || "0"), 0);

    const label = monthStart.toLocaleDateString("en-US", { month: "short" });
    return { label, total };
  });
}

function PaymentLineChart({ data }: Readonly<{ data: MonthlyPoint[] }>) {
  const max = Math.max(...data.map((d) => d.total), 1);
  const points = data
    .map((d, i) => {
      const x = (i / Math.max(data.length - 1, 1)) * 100;
      const y = 100 - (d.total / max) * 100;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="space-y-3">
      <div className="h-52 rounded-xl border bg-card p-3">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full">
          {[0, 25, 50, 75, 100].map((y) => (
            <line key={y} x1="0" y1={y} x2="100" y2={y} stroke="rgba(148,163,184,0.25)" strokeWidth="0.6" />
          ))}
          <polyline
            fill="none"
            stroke="hsl(var(--primary))"
            strokeWidth="2"
            points={points}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      <div className="grid grid-cols-6 gap-2 text-xs text-muted-foreground text-center">
        {data.map((d) => (
          <div key={d.label}>{d.label}</div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data: paymentData, loading: paymentLoading } = useQuery<{ payments: Connection<Payment> }>(
    GET_PAYMENTS,
    { first: 500, sort: { field: "PAID_AT_DESC" } }
  );
  const { data: businessData, loading: businessLoading } = useQuery<{ businesses: Connection<Business> }>(
    GET_BUSINESSES,
    { first: 500 }
  );
  const { data: serviceData, loading: serviceLoading } = useQuery<{ services: Connection<Service> }>(
    GET_SERVICES,
    { first: 1000 }
  );

  const payments = extractNodes(paymentData?.payments).filter((p) => !!p.paidAt);
  const businesses = extractNodes(businessData?.businesses);
  const services = extractNodes(serviceData?.services);

  const monthlySeries = useMemo(() => getMonthlySeries(payments), [payments]);
  const totalPaymentsValue = payments.reduce((sum, p) => sum + Number.parseFloat(p.amount || "0"), 0);

  const isLoading = paymentLoading || businessLoading || serviceLoading;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Platform-wide payment and catalog summary.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {isLoading ? (
          ["s1", "s2", "s3"].map((key) => <Skeleton key={key} className="h-30 rounded-xl" />)
        ) : (
          <>
            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Payments</p>
                    <p className="text-2xl font-bold mt-1">{formatCurrency(totalPaymentsValue)}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <CreditCard className="w-5 h-5 text-primary" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Businesses</p>
                    <p className="text-2xl font-bold mt-1">{businesses.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-emerald-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">Services</p>
                    <p className="text-2xl font-bold mt-1">{services.length}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Wrench className="w-5 h-5 text-amber-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <LineChart className="w-5 h-5 text-primary" />
            Payments Trend (Last 6 Months)
          </CardTitle>
          <Badge variant="secondary">{payments.length} paid transactions</Badge>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 rounded-xl" />
          ) : (
            <PaymentLineChart data={monthlySeries} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
