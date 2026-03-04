"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, extractNodes } from "@/graphql/hooks";
import { GET_PAYOUT_STATEMENTS, GET_SERVICE_BILLINGS } from "@/graphql/queries";
import type { PayoutStatement, ServiceBilling, Connection } from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ChevronDown,
  ChevronUp,
  Wallet,
  DollarSign,
  Receipt,
  Percent,
  TrendingUp,
  Calendar,
} from "lucide-react";

/** Inline billings for a single payout */
function PayoutBillings({ payoutId }: { payoutId: string }) {
  const { data } = useQuery<{ serviceBillings: Connection<ServiceBilling> }>(
    GET_SERVICE_BILLINGS,
    { first: 50, filter: { payoutStatementId: payoutId } }
  );
  const billings = extractNodes(data?.serviceBillings);
  if (billings.length === 0) return null;

  return (
    <>
      <Separator />
      <div>
        <h4 className="text-sm font-semibold text-foreground mb-3">Service Billings</h4>
        <div className="space-y-2">
          {billings.map((billing) => (
            <div key={billing.id} className="p-3 rounded-lg bg-background border border-border">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap break-all">
                {JSON.stringify(billing.payload, null, 2)}
              </pre>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

export default function OwnerPayoutsPage() {
  const { user, businesses } = useAuth();
  const [expandedPayout, setExpandedPayout] = useState<string | null>(null);

  const bizIds = useMemo(() => businesses.map((b) => b.id), [businesses]);
  const bizNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const b of businesses) m[b.id] = b.name;
    return m;
  }, [businesses]);

  const { data: payData, loading } = useQuery<{ payoutStatements: Connection<PayoutStatement> }>(
    GET_PAYOUT_STATEMENTS, { first: 200 }, { skip: !user || bizIds.length === 0 }
  );
  const allPayouts = useMemo(() => {
    const all = extractNodes(payData?.payoutStatements);
    return all
      .filter((p) => bizIds.includes(p.businessId))
      .map((p) => ({ ...p, businessName: bizNameMap[p.businessId] ?? "Unknown" }));
  }, [payData, bizIds, bizNameMap]);

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Payouts</h1>
        <p className="text-muted-foreground mt-1">Review your payout statements and earnings</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-xl" />
            ))}
          </div>
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-xl" />
          ))}
        </div>
      ) : (
        <>
          {/* Summary Cards */}
          {allPayouts.length > 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                {
                  icon: DollarSign,
                  label: "Total Gross",
                  value: formatCurrency(allPayouts.reduce((s, p) => s + p.grossCollection, 0)),
                  color: "text-foreground",
                  bg: "bg-muted",
                },
                {
                  icon: Receipt,
                  label: "Total Fees",
                  value: formatCurrency(allPayouts.reduce((s, p) => s + p.totalFees, 0)),
                  color: "text-red-600",
                  bg: "bg-red-50 dark:bg-red-950/30",
                },
                {
                  icon: Percent,
                  label: "Tax Withheld",
                  value: formatCurrency(allPayouts.reduce((s, p) => s + p.withholdingTax, 0)),
                  color: "text-orange-600",
                  bg: "bg-orange-50 dark:bg-orange-950/30",
                },
                {
                  icon: TrendingUp,
                  label: "Net Payout",
                  value: formatCurrency(allPayouts.reduce((s, p) => s + p.netPayout, 0)),
                  color: "text-emerald-600",
                  bg: "bg-emerald-50 dark:bg-emerald-950/30",
                },
              ].map((stat) => (
                <Card key={stat.label} className="border-0 shadow-sm">
                  <CardContent className="p-4 text-center">
                    <div className={`inline-flex p-2 rounded-lg ${stat.bg} mb-2`}>
                      <stat.icon className={`w-4 h-4 ${stat.color}`} />
                    </div>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                    <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Payout Statements */}
          {allPayouts.length === 0 ? (
            <Card className="border-0 shadow-sm">
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Wallet className="w-12 h-12 text-muted-foreground/40 mb-4" />
                <p className="text-lg font-medium text-foreground mb-1">No payouts yet</p>
                <p className="text-sm text-muted-foreground">Payout statements will appear here after your first period.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {allPayouts.map((payout) => {
                const isExpanded = expandedPayout === payout.id;

                return (
                  <Card key={payout.id} className="border-0 shadow-sm overflow-hidden">
                    {/* Header row */}
                    <button
                      onClick={() => setExpandedPayout(isExpanded ? null : payout.id)}
                      className="w-full text-left"
                    >
                      <CardContent className="p-5">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 shrink-0">
                              <Wallet className="w-5 h-5 text-emerald-600" />
                            </div>
                            <div className="min-w-0">
                              <h3 className="text-base font-semibold text-foreground truncate">
                                {payout.businessName}
                              </h3>
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                <Calendar className="w-3 h-3" />
                                {formatDate(payout.periodStart)} — {formatDate(payout.periodEnd)}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-lg font-bold text-emerald-600">
                                {formatCurrency(payout.netPayout)}
                              </p>
                              <p className="text-xs text-muted-foreground">net</p>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </button>

                    {isExpanded && (
                      <>
                        <Separator />
                        <CardContent className="p-5 bg-muted/30 space-y-4">
                          {/* Breakdown */}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                            <div>
                              <p className="text-xs text-muted-foreground">Gross</p>
                              <p className="text-sm font-bold text-foreground">{formatCurrency(payout.grossCollection)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Fees</p>
                              <p className="text-sm font-bold text-red-600">- {formatCurrency(payout.totalFees)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Tax</p>
                              <p className="text-sm font-bold text-orange-600">- {formatCurrency(payout.withholdingTax)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">Net</p>
                              <p className="text-sm font-bold text-emerald-600">{formatCurrency(payout.netPayout)}</p>
                            </div>
                          </div>

                          {/* Service Billings — lazy loaded */}
                          <PayoutBillings payoutId={payout.id} />
                        </CardContent>
                      </>
                    )}
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
