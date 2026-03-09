"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useAuth } from "@/providers/AuthProvider";
import { useToast } from "@/providers/ToastProvider";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import { GET_SERVICE_APPOINTMENTS, GET_SERVICES, GET_BUSINESSES } from "@/graphql/queries";
import {
  COMPLETE_SERVICE_APPOINTMENT,
  CREATE_PAYMENT_LINK,
  CREATE_SERVICE_FEEDBACK,
  CANCEL_SERVICE_APPOINTMENT,
} from "@/graphql/mutations";
import type { ServiceAppointment, Service, Business, Connection } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import {
  CalendarDays, ArrowRight, Clock, CheckCircle2, XCircle,
  Hourglass, Sparkles, CalendarCheck, CheckCheck, MoreHorizontal, Eye,
  Star, Loader2, Plus, X as XIcon,
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
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ParagraphNode, GalleryNode } from "@/graphql/page-nodes";
import { uid } from "@/graphql/page-nodes";
import { ImageUpload } from "@/components/ui/image-upload";

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
  if (value === null || value === undefined) return "—";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "string") return value || "—";
  if (typeof value === "number") return String(value);
  return "—";
}

// â”€â”€ Per-card action cell â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// ── Review editor state updaters (pure — outside component to limit nesting depth) ──
type ReviewDocNode = ParagraphNode | GalleryNode;

function applyParagraphText(nodes: ReviewDocNode[], id: string, text: string): ReviewDocNode[] {
  return nodes.map((n) => (n.id === id ? { id, type: "paragraph" as const, attrs: { text } } : n));
}

function applyGalleryItemUrl(nodes: ReviewDocNode[], nodeId: string, itemId: string, url: string): ReviewDocNode[] {
  return nodes.map((n) => {
    if (n.id !== nodeId) return n;
    const g = n as GalleryNode;
    const items = g.attrs.items.map((it) => (it.id === itemId ? { ...it, url } : it));
    return { ...g, attrs: { ...g.attrs, items } };
  });
}

function applyRemoveGalleryItem(nodes: ReviewDocNode[], nodeId: string, itemId: string): ReviewDocNode[] {
  return nodes.map((n) => {
    if (n.id !== nodeId) return n;
    const g = n as GalleryNode;
    return { ...g, attrs: { ...g.attrs, items: g.attrs.items.filter((it) => it.id !== itemId) } };
  });
}

function applyAddGalleryItem(nodes: ReviewDocNode[], nodeId: string): ReviewDocNode[] {
  return nodes.map((n) => {
    if (n.id !== nodeId) return n;
    const g = n as GalleryNode;
    return { ...g, attrs: { ...g.attrs, items: [...g.attrs.items, { id: uid(), url: "", caption: "" }] } };
  });
}

function ReviewNodeEditor({
  nodes,
  onChange,
}: {
  readonly nodes: ReviewDocNode[];
  readonly onChange: (updated: ReviewDocNode[]) => void;
}) {
  return (
    <div className="space-y-2 max-h-56 overflow-y-auto pr-0.5">
      {nodes.map((node) => (
        <div key={node.id} className="border border-border rounded-lg p-2.5 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {node.type === "paragraph" ? "Paragraph" : "Gallery"}
            </span>
            <button
              type="button"
              onClick={() => onChange(nodes.filter((n) => n.id !== node.id))}
              disabled={nodes.length <= 1}
              className="text-muted-foreground hover:text-destructive disabled:opacity-30 transition-colors"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          </div>
          {node.type === "paragraph" && (
            <Textarea
              placeholder="Write your paragraph..."
              value={node.attrs.text}
              onChange={(e) => onChange(applyParagraphText(nodes, node.id, e.target.value))}
              onKeyDown={(e) => e.stopPropagation()}
              rows={3}
              className="resize-none text-xs"
            />
          )}
          {node.type === "gallery" && (
            <div className="space-y-2">
              <div className="grid grid-cols-2 gap-1.5">
                {node.attrs.items.map((item) => (
                  <div key={item.id} className="relative">
                    <ImageUpload
                      value={item.url || undefined}
                      onChange={(url) => onChange(applyGalleryItemUrl(nodes, node.id, item.id, url))}
                      aspect="square"
                      folder="reviews/gallery"
                    />
                    <button
                      type="button"
                      onClick={() => onChange(applyRemoveGalleryItem(nodes, node.id, item.id))}
                      disabled={node.attrs.items.length <= 1}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center text-white disabled:opacity-30"
                    >
                      <XIcon className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onChange(applyAddGalleryItem(nodes, node.id))}
                className="w-full gap-1 border-dashed h-6 text-xs"
              >
                <Plus className="w-3 h-3" /> Add Image
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

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
  const { showError, showSuccess } = useToast();

  const { mutate: complete, loading } = useMutation<{
    completeServiceAppointment: { serviceAppointment: { id: string; completedAt: string } };
  }>(COMPLETE_SERVICE_APPOINTMENT, { onCompleted });

  const { mutate: createPaymentLink, loading: paymentLoading } = useMutation<{
    createPaymentLink: { paymentLink: { id: string; redirectUrl: string | null } };
  }>(CREATE_PAYMENT_LINK, { throwOnError: true });

  const { mutate: cancelAppointment, loading: cancelLoading } = useMutation<{
    cancelServiceAppointment: { serviceAppointment: { id: string; canceledAt: string } };
  }>(CANCEL_SERVICE_APPOINTMENT, { onCompleted, throwOnError: true });

  const canComplete = status === "approved" || status === "for_completion";
  const canPayAgain = !apt.paidAt && !apt.canceledAt && !apt.rejectedAt && !apt.completedAt;
  const canCancel = !apt.paidAt && !apt.canceledAt && !apt.completedAt;

  // Review state
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewDone, setReviewDone]     = useState(false);
  const [reviewNodes, setReviewNodes]   = useState<(ParagraphNode | GalleryNode)[]>(
    () => [{ id: uid(), type: "paragraph", attrs: { text: "" } }]
  );

  const { mutate: submitReview, loading: reviewLoading } = useMutation<{
    createServiceFeedback: { serviceFeedback: { id: string } };
  }>(CREATE_SERVICE_FEEDBACK);

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

          {canPayAgain && (
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              disabled={paymentLoading}
              onClick={async () => {
                try {
                  const payResult = await createPaymentLink({
                    input: { serviceAppointmentsId: apt.id },
                  });
                  const link = payResult?.createPaymentLink?.paymentLink;
                  if (!link?.redirectUrl) {
                    throw new Error("Payment provider did not return a redirect URL.");
                  }
                  globalThis.location.href = link.redirectUrl;
                } catch (err) {
                  showError(err instanceof Error ? err.message : "Failed to create payment link.");
                }
              }}
              className="flex items-center gap-2"
            >
              {paymentLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ArrowRight className="w-3.5 h-3.5" />}
              Pay Again
            </DropdownMenuItem>
          )}

          {canCancel && (
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="p-0"
            >
              <Dialog>
                <DialogTrigger asChild>
                  <button className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-red-600 focus:text-red-600">
                    <XCircle className="w-3.5 h-3.5" />
                    Cancel Appointment
                  </button>
                </DialogTrigger>
                <DialogContent className="max-w-sm">
                  <DialogHeader>
                    <DialogTitle>Cancel Appointment</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 text-sm">
                    <p className="text-muted-foreground">
                      This appointment has not been paid yet. Do you want to cancel it?
                    </p>
                    <Separator />
                    <Button
                      variant="destructive"
                      className="w-full"
                      disabled={cancelLoading}
                      onClick={async () => {
                        try {
                          const result = await cancelAppointment({ id: apt.id });
                          if (!result?.cancelServiceAppointment?.serviceAppointment?.id) {
                            throw new Error("Failed to cancel appointment.");
                          }
                          showSuccess("Appointment cancelled.");
                        } catch (err) {
                          showError(err instanceof Error ? err.message : "Failed to cancel appointment.");
                        }
                      }}
                    >
                      {cancelLoading ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Cancelling...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <XCircle className="w-4 h-4" /> Confirm Cancel
                        </span>
                      )}
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </DropdownMenuItem>
          )}

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
                            <CheckCheck className="w-4 h-4 animate-pulse" /> Processing…
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

          {status === "completed" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onSelect={(e) => e.preventDefault()}
                className="p-0"
              >
                <Dialog>
                  <DialogTrigger asChild>
                    <button className="flex w-full items-center gap-2 px-2 py-1.5 text-sm text-amber-600 focus:text-amber-600">
                      <Star className="w-3.5 h-3.5" />
                      {reviewDone ? "Review Submitted" : "Write a Review"}
                    </button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Write a Review</DialogTitle>
                    </DialogHeader>
                    {reviewDone ? (
                      <div className="text-center space-y-3 py-4">
                        <CheckCircle2 className="w-10 h-10 text-green-500 mx-auto" />
                        <p className="font-semibold text-foreground">Review submitted!</p>
                        <p className="text-sm text-muted-foreground">Thank you for your feedback.</p>
                      </div>
                    ) : (
                      <div className="space-y-4 text-sm">
                        {service && (
                          <p className="text-muted-foreground text-xs">
                            Reviewing: <span className="font-medium text-foreground">{service.name}</span>
                          </p>
                        )}
                        <div className="space-y-1.5">
                          <Label>Rating</Label>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <button
                                key={n}
                                type="button"
                                onClick={() => setReviewRating(n)}
                                className="focus:outline-none"
                              >
                                <Star
                                  className={`w-7 h-7 transition-colors ${
                                    n <= reviewRating
                                      ? "fill-amber-400 text-amber-400"
                                      : "text-muted-foreground/40 hover:text-amber-300"
                                  }`}
                                />
                              </button>
                            ))}
                            {reviewRating > 0 && (
                              <span className="text-xs text-muted-foreground ml-1">
                                {["Terrible", "Poor", "Average", "Good", "Excellent"][reviewRating - 1]}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label>Content</Label>
                          <ReviewNodeEditor nodes={reviewNodes} onChange={setReviewNodes} />
                          <div className="flex gap-2 pt-0.5">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setReviewNodes((prev) => [
                                  ...prev,
                                  { id: uid(), type: "paragraph" as const, attrs: { text: "" } },
                                ])
                              }
                              className="flex-1 gap-1 text-xs h-7"
                            >
                              <Plus className="w-3 h-3" /> Paragraph
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setReviewNodes((prev) => [
                                  ...prev,
                                  {
                                    id: uid(),
                                    type: "gallery" as const,
                                    attrs: { items: [{ id: uid(), url: "", caption: "" }], columns: 3 },
                                  },
                                ])
                              }
                              className="flex-1 gap-1 text-xs h-7"
                            >
                              <Plus className="w-3 h-3" /> Gallery
                            </Button>
                          </div>
                        </div>
                        <Separator />
                        <Button
                          className="w-full"
                          disabled={reviewRating === 0 || reviewLoading}
                          onClick={async () => {
                            const ok = await submitReview({
                              input: {
                                appointmentId: apt.id,
                                serviceId: apt.serviceId,
                                rating: reviewRating,
                                payload: { type: "doc", content: reviewNodes },
                              },
                            });
                            if (ok) setReviewDone(true);
                          }}
                        >
                          {reviewLoading ? (
                            <span className="flex items-center gap-2">
                              <Loader2 className="w-4 h-4 animate-spin" /> Submitting…
                            </span>
                          ) : "Submit Review"}
                        </Button>
                      </div>
                    )}
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

  const { data: svcData, loading: svcLoading } = useQuery<{ services: Connection<Service> }>(
    GET_SERVICES, { first: 200 }, { skip: !user }
  );
  const services = extractNodes(svcData?.services);

  const { data: bizData, loading: bizLoading } = useQuery<{ businesses: Connection<Business> }>(
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

  const isPageLoading = aptLoading || svcLoading || bizLoading;

  if (isPageLoading) {
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
                              {scheduled ? new Date(scheduled).toLocaleString("default", { month: "short" }) : "—"}
                            </span>
                            <span className="text-xl font-extrabold text-foreground leading-none">
                              {scheduled ? new Date(scheduled).getDate() : "—"}
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
                            <p className="text-xs text-muted-foreground truncate">{business?.name ?? "—"}</p>
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
                              {scheduled ? new Date(scheduled).toLocaleString("default", { month: "short" }) : "—"}
                            </span>
                            <span className="text-lg font-extrabold text-muted-foreground leading-none">
                              {scheduled ? new Date(scheduled).getDate() : "—"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <Badge variant="outline" className={`text-xs font-semibold px-2 py-0 mb-0.5 ${STATUS_BADGE[status]}`}>
                              {STATUS_LABEL[status]}
                            </Badge>
                            <p className="font-medium text-sm text-muted-foreground truncate">{service?.name ?? "Unknown Service"}</p>
                            <p className="text-xs text-muted-foreground truncate">{business?.name ?? "—"}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <p className="text-sm font-bold text-muted-foreground">{formatCurrency(apt.amount, apt.currency)}</p>
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
