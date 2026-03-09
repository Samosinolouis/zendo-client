"use client";

// ================================================================
// Owner Payments — /owner/payments
//
// Read-only list of payments received by the owner's businesses.
// Each row opens a Sheet showing sales invoices for that payment.
// Business owner can resolve a pending invoice by uploading a
// signed PDF receipt via Cloudinary.
// ================================================================

import { useState, useMemo, useRef, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import { GET_PAYMENTS, GET_SALES_INVOICES } from "@/graphql/queries";
import { RESOLVE_SALES_INVOICE } from "@/graphql/mutations";
import type { Payment, SalesInvoice, Connection } from "@/types";
import { useToast } from "@/providers/ToastProvider";
import type { GraphQLError } from "@/lib/graphql-client";
import { uploadPdfToCloudinary, isCloudinaryConfigured } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import {
  CreditCard,
  FileText,
  Upload,
  Loader2,
  ExternalLink,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  Receipt,
} from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────

function resolveGqlError(err: GraphQLError): string {
  const code = err.extensions?.code;
  const messages: Record<string, string> = {
    NOT_FOUND:        "Resource not found.",
    UNAUTHORIZED:     "You are not authorised to do that.",
    FORBIDDEN:        "You are not allowed to do that.",
    VALIDATION_ERROR: "Invalid input.",
  };
  return (code && messages[String(code)]) ?? err.message ?? "Something went wrong.";
}

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

function fmtDateTime(iso?: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function fmtAmount(amount: string, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency", currency, minimumFractionDigits: 2,
    }).format(Number(amount));
  } catch {
    return `${currency} ${amount}`;
  }
}

// ─── Payment status badge ──────────────────────────────────────

function PaymentStatusBadge({ payment }: { readonly payment: Payment }) {
  if (payment.refundedAt) {
    return (
      <Badge variant="secondary" className="gap-1 text-orange-600 bg-orange-50 border-orange-200">
        <RefreshCw className="w-3 h-3" /> Refunded
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1 text-green-600 bg-green-50 border-green-200">
      <CheckCircle className="w-3 h-3" /> Paid
    </Badge>
  );
}

// ─── Invoice status badge ──────────────────────────────────────

function InvoiceStatusBadge({ invoice }: { readonly invoice: SalesInvoice }) {
  if (invoice.resolvedAt) {
    return (
      <Badge variant="secondary" className="gap-1 text-green-600 bg-green-50 border-green-200">
        <CheckCircle className="w-3 h-3" /> Resolved
      </Badge>
    );
  }
  return (
    <Badge variant="secondary" className="gap-1 text-yellow-600 bg-yellow-50 border-yellow-200">
      <Clock className="w-3 h-3" /> Pending
    </Badge>
  );
}

// ─── Resolve invoice form ──────────────────────────────────────

function ResolveInvoiceForm({
  invoice,
  onResolved,
}: {
  readonly invoice: SalesInvoice;
  readonly onResolved: () => void;
}) {
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { showSuccess, showError } = useToast();

  const { mutate: resolve } = useMutation<{
    resolveSalesInvoice: { salesInvoice: SalesInvoice };
  }>(RESOLVE_SALES_INVOICE, {
    onError: (err) => showError(resolveGqlError(err)),
  });

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.type !== "application/pdf") {
        showError("Please select a PDF file.");
        return;
      }
      setUploading(true);
      try {
        const uploaded = await uploadPdfToCloudinary(file, "zendo/invoices");
        const result = await resolve({
          input: { id: invoice.id, attachmentUrl: uploaded.secure_url },
        });
        if (result) {
          showSuccess("Invoice resolved — receipt uploaded.");
          onResolved();
        }
      } catch (err) {
        showError((err as Error).message ?? "Upload failed.");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [invoice.id, resolve, showSuccess, showError, onResolved],
  );

  if (!isCloudinaryConfigured()) {
    return (
      <p className="text-xs text-destructive flex items-center gap-1">
        <AlertCircle className="w-3.5 h-3.5" />
        Cloudinary is not configured — cannot upload PDFs.
      </p>
    );
  }

  return (
    <div>
      <input
        ref={fileRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleFileChange}
        disabled={uploading}
      />
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 text-xs"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
      >
        {uploading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…
          </>
        ) : (
          <>
            <Upload className="w-3.5 h-3.5" /> Upload Receipt (PDF)
          </>
        )}
      </Button>
    </div>
  );
}

// ─── Invoices sheet ────────────────────────────────────────────

function InvoicesSheet({
  payment,
  open,
  onClose,
}: {
  readonly payment: Payment | null;
  readonly open: boolean;
  readonly onClose: () => void;
}) {
  const { data, loading, refetch } = useQuery<{
    salesInvoices: Connection<SalesInvoice>;
  }>(
    GET_SALES_INVOICES,
    payment ? { first: 50, filter: { paymentId: payment.id } } : undefined,
    { skip: !payment },
  );

  const invoices = useMemo(
    () => extractNodes(data?.salesInvoices),
    [data],
  );

  if (!payment) return null;

  function renderInvoices() {
    if (loading) {
      return (
        <div className="space-y-3">
          {[0, 1, 2].map((n) => (
            <Skeleton key={n} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      );
    }

    if (invoices.length === 0) {
      return (
        <div className="text-center py-12">
          <FileText className="w-8 h-8 text-muted-foreground/25 mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">No invoice requests yet.</p>
          <p className="text-xs text-muted-foreground/60 mt-1">
            The customer has not requested a sales invoice for this payment.
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {invoices.map((inv) => (
          <div
            key={inv.id}
            className="border border-border rounded-xl p-3 space-y-2.5 bg-card"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs text-muted-foreground">Requested</p>
                <p className="text-sm font-medium">{fmtDateTime(inv.requestedAt)}</p>
              </div>
              <InvoiceStatusBadge invoice={inv} />
            </div>

            {inv.resolvedAt && (
              <div>
                <p className="text-xs text-muted-foreground">Resolved</p>
                <p className="text-sm">{fmtDateTime(inv.resolvedAt)}</p>
              </div>
            )}

            {inv.attachmentUrl && (
              <a
                href={inv.attachmentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
              >
                <ExternalLink className="w-3 h-3" />
                View PDF Receipt
              </a>
            )}

            {!inv.resolvedAt && (
              <ResolveInvoiceForm invoice={inv} onResolved={refetch} />
            )}
          </div>
        ))}
      </div>
    );
  }

  return (
    <Sheet open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        <SheetHeader className="mb-4">
          <SheetTitle className="flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Sales Invoices
          </SheetTitle>
        </SheetHeader>

        {/* Payment summary card */}
        <div className="rounded-xl border border-border bg-muted/30 p-3 space-y-1 mb-4">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-foreground">
              {fmtAmount(payment.amount, payment.currency)}
            </span>
            <PaymentStatusBadge payment={payment} />
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
            <span>{payment.method}</span>
            <span>·</span>
            <span>{payment.provider}</span>
            <span>·</span>
            <span>{fmtDateTime(payment.paidAt)}</span>
          </div>
        </div>

        <Separator className="mb-4" />

        {renderInvoices()}
      </SheetContent>
    </Sheet>
  );
}

// ─── Main page ─────────────────────────────────────────────────

export default function OwnerPayments() {
  const { user, businesses } = useAuth();
  const [selectedBizId, setSelectedBizId] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  const bizId = selectedBizId || businesses[0]?.id;

  const { data, loading } = useQuery<{ payments: Connection<Payment> }>(
    GET_PAYMENTS,
    { first: 50, filter: { businessId: bizId }, sort: { field: "PAID_AT_DESC" } },
    { skip: !bizId },
  );

  const payments = useMemo(() => extractNodes(data?.payments), [data]);

  if (!user) return null;

  function renderContent() {
    if (loading) {
      return (
        <div className="space-y-2">
          {[0, 1, 2, 3, 4].map((n) => (
            <Skeleton key={n} className="h-12 w-full rounded-lg" />
          ))}
        </div>
      );
    }

    if (payments.length === 0) {
      return (
        <div className="text-center py-20">
          <CreditCard className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground font-medium">No payments yet</p>
          <p className="text-sm text-muted-foreground/60 mt-1">
            Payments will appear here once customers complete a booking.
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date Paid</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Invoices</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {payments.map((pmt) => (
              <TableRow
                key={pmt.id}
                className="cursor-pointer hover:bg-muted/40"
                onClick={() => setSelectedPayment(pmt)}
              >
                <TableCell className="text-sm">{fmtDate(pmt.paidAt)}</TableCell>
                <TableCell className="font-semibold text-sm">
                  {fmtAmount(pmt.amount, pmt.currency)}
                </TableCell>
                <TableCell className="text-sm">{pmt.method}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {pmt.provider}
                </TableCell>
                <TableCell>
                  <PaymentStatusBadge payment={pmt} />
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1.5 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedPayment(pmt);
                    }}
                  >
                    <Receipt className="w-3.5 h-3.5" />
                    Invoices
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Payments</h1>
        <p className="text-muted-foreground mt-1">
          Read-only record of all payments received. Click a row to view and
          manage sales invoice requests.
        </p>
      </div>

      {businesses.length > 1 && (
        <Select
          value={bizId ?? ""}
          onValueChange={setSelectedBizId}
        >
          <SelectTrigger className="w-56">
            <SelectValue placeholder="Select business" />
          </SelectTrigger>
          <SelectContent>
            {businesses.map((b) => (
              <SelectItem key={b.id} value={b.id}>
                {b.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {renderContent()}

      <InvoicesSheet
        payment={selectedPayment}
        open={selectedPayment !== null}
        onClose={() => setSelectedPayment(null)}
      />
    </div>
  );
}
