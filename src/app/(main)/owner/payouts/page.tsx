"use client";

// ================================================================
// Owner Payouts â€” /owner/payouts
//
// Shows payout statements for all of the owner's businesses.
// Expanding a statement reveals its service billings.
// Each service billing renders a printable BIR-compliant invoice.
// ================================================================

import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, extractNodes } from "@/graphql/hooks";
import { GET_PAYOUT_STATEMENTS, GET_SERVICE_BILLINGS } from "@/graphql/queries";
import type {
  PayoutStatement,
  ServiceBilling,
  InvoiceData,
  InvoiceLineItem,
  SpecialBuyerInfo,
  Connection,
} from "@/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  ChevronDown,
  ChevronUp,
  Wallet,
  DollarSign,
  Receipt,
  Percent,
  TrendingUp,
  Calendar,
  Printer,
  FileText,
} from "lucide-react";

// â”€â”€â”€ Special buyer label map â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function specialBuyerLabel(type: SpecialBuyerInfo["type"]): string {
  if (type === "SC")      return "Senior Citizen";
  if (type === "PWD")     return "Person with Disability";
  if (type === "Athlete") return "National Athlete/Coach";
  if (type === "SP")      return "Solo Parent";
  return "Medal of Valor Awardee/Dependent";
}

// â”€â”€â”€ BIR Invoice Renderer â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// Renders a printable BIR-compliant service invoice from InvoiceData.

function InvoicePDF({ data }: { readonly data: InvoiceData }) {
  const handlePrint = useCallback(() => {
    globalThis.print();
  }, []);

  const fmtDate = (d?: string | null) =>
    d ? new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" }) : "â€”";

  const fmtMoney = (n: number) =>
    new Intl.NumberFormat("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" className="gap-1.5 print:hidden" onClick={handlePrint}>
          <Printer className="w-3.5 h-3.5" />
          Print / Save as PDF
        </Button>
      </div>

      {/* â”€â”€ Invoice document â”€â”€ */}
      <div
        id="invoice-print"
        className="bg-white text-gray-900 border border-gray-300 rounded-lg p-8 text-sm font-sans print:border-0 print:rounded-none print:shadow-none"
        style={{ fontFamily: "Arial, sans-serif" }}
      >
        {/* Header */}
        <div className="text-center mb-6 border-b border-gray-300 pb-4">
          <h1 className="text-lg font-bold uppercase tracking-wide">
            {data.sellerRegisteredName}
          </h1>
          {data.sellerTradeName && (
            <p className="text-sm text-gray-600">{data.sellerTradeName}</p>
          )}
          <p className="text-xs text-gray-600 mt-0.5">{data.sellerAddress}</p>
          <p className="text-xs text-gray-600">
            TIN: {data.sellerTIN}
            {data.sellerBranchCode && ` â€” Branch Code: ${data.sellerBranchCode}`}
          </p>
        </div>

        {/* Document title */}
        <div className="text-center mb-4">
          <h2 className="text-base font-bold uppercase border border-gray-900 inline-block px-6 py-1">
            Service Invoice
          </h2>
          <p className="text-xs text-gray-500 mt-1">(Non-VAT)</p>
        </div>

        {/* Invoice meta */}
        <div className="grid grid-cols-2 gap-x-8 mb-4 text-xs">
          <div className="space-y-0.5">
            <div className="flex gap-2">
              <span className="font-semibold w-28 shrink-0">Invoice No.:</span>
              <span>{data.invoiceNumber}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold w-28 shrink-0">Serial No.:</span>
              <span>{data.serialNumber}</span>
            </div>
            <div className="flex gap-2">
              <span className="font-semibold w-28 shrink-0">Date:</span>
              <span>{fmtDate(data.invoiceDate)}</span>
            </div>
            {data.dueDate && (
              <div className="flex gap-2">
                <span className="font-semibold w-28 shrink-0">Due Date:</span>
                <span>{fmtDate(data.dueDate)}</span>
              </div>
            )}
            {(data.startDate || data.endDate) && (
              <div className="flex gap-2">
                <span className="font-semibold w-28 shrink-0">Period:</span>
                <span>{fmtDate(data.startDate)} â€“ {fmtDate(data.endDate)}</span>
              </div>
            )}
          </div>
          <div className="space-y-0.5">
            <div className="flex gap-2">
              <span className="font-semibold w-24 shrink-0">Buyer:</span>
              <span className="font-semibold">{data.buyerName}</span>
            </div>
            {data.buyerTIN && (
              <div className="flex gap-2">
                <span className="font-semibold w-24 shrink-0">TIN:</span>
                <span>{data.buyerTIN}</span>
              </div>
            )}
            {data.buyerAddress && (
              <div className="flex gap-2">
                <span className="font-semibold w-24 shrink-0">Address:</span>
                <span>{data.buyerAddress}</span>
              </div>
            )}
          </div>
        </div>

        {/* Special buyer */}
        {data.specialBuyer && (
          <div className="border border-gray-300 rounded p-2 mb-4 text-xs bg-gray-50">
            <span className="font-semibold">Special Buyer: </span>
            {specialBuyerLabel(data.specialBuyer.type)}
            {data.specialBuyer.name && ` â€” ${data.specialBuyer.name}`}
            {` (ID No. ${data.specialBuyer.idNumber})`}
          </div>
        )}

        {/* Line items */}
        <table className="w-full border-collapse text-xs mb-4">
          <thead>
            <tr className="border border-gray-900 bg-gray-100">
              <th className="border border-gray-300 px-2 py-1.5 text-left font-semibold">Description</th>
              <th className="border border-gray-300 px-2 py-1.5 text-center font-semibold w-16">Qty</th>
              <th className="border border-gray-300 px-2 py-1.5 text-right font-semibold w-28">Unit Price</th>
              <th className="border border-gray-300 px-2 py-1.5 text-right font-semibold w-28">Amount</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item: InvoiceLineItem, idx: number) => (
              <tr key={`item-${item.description}-${idx}`} className="border border-gray-200">
                <td className="border border-gray-200 px-2 py-1.5">{item.description}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-center">{item.quantity}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-right">{fmtMoney(item.unitPrice)}</td>
                <td className="border border-gray-200 px-2 py-1.5 text-right">{fmtMoney(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div className="flex justify-end mb-6">
          <div className="w-56 text-xs space-y-0.5">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>{fmtMoney(data.subtotal)}</span>
            </div>
            {data.discount != null && data.discount > 0 && (
              <div className="flex justify-between text-red-700">
                <span>{data.discountDescription ?? "Discount"}</span>
                <span>â€“ {fmtMoney(data.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-bold border-t border-gray-900 pt-1 text-sm">
              <span>TOTAL</span>
              <span>{fmtMoney(data.total)}</span>
            </div>
          </div>
        </div>

        {/* BIR permit details */}
        {(data.atpNumber || data.ptuNumber || data.birPermitNumber) && (
          <div className="border-t border-gray-200 pt-3 text-[10px] text-gray-500 grid grid-cols-2 gap-x-6 gap-y-0.5">
            {data.atpNumber && (
              <span>ATP No.: {data.atpNumber}{data.atpDateIssued && ` (${fmtDate(data.atpDateIssued)})`}</span>
            )}
            {data.ptuNumber && (
              <span>PTU No.: {data.ptuNumber}{data.ptuDateIssued && ` (${fmtDate(data.ptuDateIssued)})`}</span>
            )}
            {data.birPermitNumber && (
              <span>BIR Permit No.: {data.birPermitNumber}</span>
            )}
            {data.approvedSerialNumbers && (
              <span>Approved Serial Nos.: {data.approvedSerialNumbers}</span>
            )}
          </div>
        )}

        {/* Footer note */}
        <p className="text-[10px] text-gray-400 text-center mt-4 border-t border-gray-100 pt-2">
          This document is system-generated and serves as an official receipt.
        </p>
      </div>
    </div>
  );
}

// â”€â”€â”€ Billing sheet â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function BillingSheet({
  payoutId,
  open,
  onClose,
}: {
  readonly payoutId: string | null;
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  const [activeBillingId, setActiveBillingId] = useState<string | null>(null);

  const { data, loading } = useQuery<{ serviceBillings: Connection<ServiceBilling> }>(
    GET_SERVICE_BILLINGS,
    payoutId ? { first: 50, filter: { payoutStatementId: payoutId } } : undefined,
    { skip: !payoutId },
  );

  const billings = useMemo(() => extractNodes(data?.serviceBillings), [data]);
  const activeBilling = billings.find((b) => b.id === activeBillingId) ?? null;

  function renderContent() {
    if (loading) {
      return (
        <div className="space-y-3">
          {[0, 1].map((n) => (
            <Skeleton key={n} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      );
    }

    if (billings.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="w-8 h-8 text-muted-foreground/25 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No service billings yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            BIR invoices will appear here once Zendo issues them for this payout.
          </p>
        </div>
      );
    }

    if (activeBilling) {
      return (
        <div className="space-y-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-xs text-muted-foreground hover:text-foreground px-0"
            onClick={() => setActiveBillingId(null)}
          >
            â† All Billings
          </Button>
          <InvoicePDF data={activeBilling.payload} />
        </div>
      );
    }

    return (
      <div className="space-y-2">
        {billings.map((b) => (
          <button
            key={b.id}
            type="button"
            onClick={() => setActiveBillingId(b.id)}
            className="w-full text-left border border-border rounded-xl px-4 py-3 hover:bg-muted/40 transition-colors"
          >
            <div className="flex items-center justify-between gap-2">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {b.payload.invoiceNumber ?? "Invoice"}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {b.payload.invoiceDate ? formatDate(b.payload.invoiceDate) : "â€”"}
                  {" Â· "}
                  {b.payload.buyerName ?? "â€”"}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm font-bold text-foreground">
                  {formatCurrency(b.payload.total ?? 0)}
                </p>
                <Badge variant="outline" className="text-[10px] mt-0.5">BIR Invoice</Badge>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) { setActiveBillingId(null); onClose(); } }}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto print:fixed print:inset-0 print:w-full print:max-w-none print:overflow-visible">
        <SheetHeader className="mb-4 print:hidden">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Service Billings
          </SheetTitle>
        </SheetHeader>
        {renderContent()}
      </SheetContent>
    </Sheet>
  );
}

// â”€â”€â”€ Payout card â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

interface PayoutWithMeta extends PayoutStatement {
  businessName: string;
}

function PayoutCard({
  payout,
  expanded,
  onToggle,
  onViewBillings,
}: {
  readonly payout: PayoutWithMeta;
  readonly expanded: boolean;
  readonly onToggle: () => void;
  readonly onViewBillings: () => void;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card shadow-sm">
      {/* Header row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left px-5 py-4 hover:bg-muted/30 transition-colors"
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 shrink-0">
              <Wallet className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">
                {payout.businessName}
              </p>
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                <Calendar className="w-3 h-3" />
                {formatDate(payout.periodStart)} â€” {formatDate(payout.periodEnd)}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <div className="text-right">
              <p className="text-base font-bold text-emerald-600">
                {formatCurrency(payout.netPayout)}
              </p>
              <p className="text-[10px] text-muted-foreground">net payout</p>
            </div>
            {expanded
              ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
              : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
          </div>
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <>
          <Separator />
          <div className="px-5 py-4 bg-muted/20 space-y-4">
            {/* Breakdown */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="bg-background rounded-lg p-3 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Gross</p>
                <p className="text-sm font-bold text-foreground mt-0.5">{formatCurrency(payout.grossCollection)}</p>
              </div>
              <div className="bg-background rounded-lg p-3 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Fees</p>
                <p className="text-sm font-bold text-red-600 mt-0.5">âˆ’ {formatCurrency(payout.totalFees)}</p>
              </div>
              <div className="bg-background rounded-lg p-3 border border-border">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Tax</p>
                <p className="text-sm font-bold text-orange-600 mt-0.5">âˆ’ {formatCurrency(payout.withholdingTax)}</p>
              </div>
              <div className="rounded-lg p-3 border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/20 dark:border-emerald-800">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Net</p>
                <p className="text-sm font-bold text-emerald-600 mt-0.5">{formatCurrency(payout.netPayout)}</p>
              </div>
            </div>

            {/* View billings */}
            <div className="flex justify-end">
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs"
                onClick={(e) => { e.stopPropagation(); onViewBillings(); }}
              >
                <FileText className="w-3.5 h-3.5" />
                View Service Billings
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// â”€â”€â”€ Main page â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export default function OwnerPayoutsPage() {
  const { user, businesses } = useAuth();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [billingPayoutId, setBillingPayoutId] = useState<string | null>(null);

  const bizIds = useMemo(() => businesses.map((b) => b.id), [businesses]);
  const bizNameMap = useMemo(() => {
    const m: Record<string, string> = {};
    for (const b of businesses) m[b.id] = b.name;
    return m;
  }, [businesses]);

  const { data: payData, loading } = useQuery<{
    payoutStatements: Connection<PayoutStatement>;
  }>(
    GET_PAYOUT_STATEMENTS,
    { first: 200 },
    { skip: !user || bizIds.length === 0 },
  );

  const allPayouts: PayoutWithMeta[] = useMemo(() => {
    return extractNodes(payData?.payoutStatements)
      .filter((p) => bizIds.includes(p.businessId))
      .map((p) => ({ ...p, businessName: bizNameMap[p.businessId] ?? "Unknown" }));
  }, [payData, bizIds, bizNameMap]);

  const totals = useMemo(
    () => ({
      gross: allPayouts.reduce((s, p) => s + p.grossCollection, 0),
      fees:  allPayouts.reduce((s, p) => s + p.totalFees, 0),
      tax:   allPayouts.reduce((s, p) => s + p.withholdingTax, 0),
      net:   allPayouts.reduce((s, p) => s + p.netPayout, 0),
    }),
    [allPayouts],
  );

  if (!user) return null;

  function renderContent() {
    if (loading) {
      return (
        <div className="space-y-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      );
    }

    if (allPayouts.length === 0) {
      return (
        <div className="text-center py-20">
          <Wallet className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No payouts yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Payout statements will appear here after your first billing period.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {allPayouts.map((payout) => (
          <PayoutCard
            key={payout.id}
            payout={payout}
            expanded={expandedId === payout.id}
            onToggle={() => setExpandedId(expandedId === payout.id ? null : payout.id)}
            onViewBillings={() => setBillingPayoutId(payout.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-foreground">Payouts</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Review your payout statements and BIR-compliant service billings.
        </p>
      </header>

      {/* Summary cards â€” only when data is loaded */}
      {!loading && allPayouts.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(
            [
              { icon: DollarSign, label: "Total Gross",  value: totals.gross, color: "text-foreground",     bg: "bg-muted" },
              { icon: Receipt,    label: "Total Fees",   value: totals.fees,  color: "text-red-600",        bg: "bg-red-50 dark:bg-red-950/30" },
              { icon: Percent,    label: "Tax Withheld", value: totals.tax,   color: "text-orange-600",     bg: "bg-orange-50 dark:bg-orange-950/30" },
              { icon: TrendingUp, label: "Net Payout",   value: totals.net,   color: "text-emerald-600",    bg: "bg-emerald-50 dark:bg-emerald-950/30" },
            ] as const
          ).map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4 text-center shadow-sm">
              <div className={`inline-flex p-2 rounded-lg ${s.bg} mb-2`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-base font-bold mt-0.5 ${s.color}`}>{formatCurrency(s.value)}</p>
            </div>
          ))}
        </div>
      )}

      {renderContent()}

      <BillingSheet
        payoutId={billingPayoutId}
        open={billingPayoutId !== null}
        onClose={() => setBillingPayoutId(null)}
      />
    </div>
  );
}
