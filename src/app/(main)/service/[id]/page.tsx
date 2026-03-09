"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import {
  GET_SERVICE, GET_BUSINESS, GET_SERVICE_FEEDBACKS, GET_USER,
  GET_SERVICE_PAGE, GET_SERVICE_FORM, GET_SERVICE_AVAILABILITIES,
} from "@/graphql/queries";
import {
  CREATE_SERVICE_APPOINTMENT,
  CREATE_PAYMENT_LINK,
  CREATE_SERVICE_FEEDBACK,
} from "@/graphql/mutations";
import type {
  Service, Business, ServiceFeedback, ServiceForm,
  ServicePage, ServiceAvailability, Connection,
} from "@/types";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import {
  ArrowLeft, Star, CalendarDays, CheckCircle2,
  AlertCircle, BookOpen, MessageCircle, Loader2, Clock,
} from "lucide-react";
import { parsePagePayload } from "@/graphql/page-nodes";
import { parseFormPayload, isOptionsField, isBooleanField } from "@/graphql/form";
import type { FormField } from "@/graphql/form";
import { NodePreview } from "@/app/(main)/owner/pages/page";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";

type BookingStep = "details" | "review" | "payment" | "confirmed";

function FormFieldInput({
  field,
  value,
  onChange,
}: {
  readonly field: FormField;
  readonly value: string;
  readonly onChange: (v: string) => void;
}) {
  if (isOptionsField(field)) {
    if (field.type === "select") {
      return (
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder={field.placeholder ?? "Select..."} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }
    return (
      <div className="space-y-1">
        {field.options.map((opt) => (
          <label key={opt.value} className="flex items-center gap-2 cursor-pointer text-sm">
            <input
              type="radio"
              name={field.name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="accent-primary"
            />
            {opt.label}
          </label>
        ))}
      </div>
    );
  }
  if (isBooleanField(field)) {
    return (
      <div className="flex items-center gap-2">
        <Checkbox
          id={`field-${field.name}`}
          checked={value === "true"}
          onCheckedChange={(checked) => onChange(checked ? "true" : "false")}
        />
        <Label htmlFor={`field-${field.name}`} className="font-normal">{field.label}</Label>
      </div>
    );
  }
  if (field.type === "date") {
    return <Input type="date" value={value || ""} onChange={(e) => onChange(e.target.value)} />;
  }
  if (field.type === "textarea") {
    return (
      <Textarea
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
        rows={(field as { rows?: number }).rows ?? 3}
      />
    );
  }
  if (field.type === "number") {
    return (
      <Input
        type="number"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    );
  }
  if (field.type === "file") {
    return (
      <Input
        type="file"
        accept={(field as { accept?: string }).accept}
        onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")}
      />
    );
  }
  if (field.type === "password") {
    return (
      <Input
        type="password"
        value={value || ""}
        onChange={(e) => onChange(e.target.value)}
        placeholder={field.placeholder}
      />
    );
  }
  return (
    <Input
      type="text"
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
    />
  );
}

interface BookingFormStepsProps {
  readonly service: Service;
  readonly business: Business;
  readonly fields: readonly FormField[];
  readonly formValues: Record<string, string>;
  readonly formCurrency: string;
  readonly availableSlots: readonly ServiceAvailability[];
  readonly selectedSlotId: string | null;
  readonly setSelectedSlotId: (id: string | null) => void;
  readonly handleFieldChange: (name: string, value: string) => void;
  readonly computeAmount: () => number;
  readonly bookingStep: BookingStep;
  readonly setBookingStep: (step: BookingStep) => void;
  readonly handleConfirmBooking: () => Promise<void>;
  readonly bookingLoading: boolean;
  readonly paymentLoading: boolean;
  readonly paymentError: string | null;
  readonly setFormValues: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  readonly setPaymentError: (err: string | null) => void;
  readonly isLoggedIn: boolean;
}

function BookingFormSteps({
  service,
  business,
  fields,
  formValues,
  formCurrency,
  availableSlots,
  selectedSlotId,
  setSelectedSlotId,
  handleFieldChange,
  computeAmount,
  bookingStep,
  setBookingStep,
  handleConfirmBooking,
  bookingLoading,
  paymentLoading,
  paymentError,
  setFormValues,
  setPaymentError,
  isLoggedIn,
}: BookingFormStepsProps) {
  if (bookingStep === "details") {
    return (
      <div className="space-y-5">
        {isLoggedIn ? (
          <>
            {availableSlots.length > 0 && (
              <div className="space-y-2">
                <Label>Choose a Time Slot</Label>
                <div className="grid gap-2">
                  {availableSlots.map((slot) => {
                    const date = new Date(slot.scheduledAt);
                    const isSelected = selectedSlotId === slot.id;
                    return (
                      <button
                        key={slot.id}
                        type="button"
                        onClick={() => setSelectedSlotId(isSelected ? null : slot.id)}
                        className={`flex items-center justify-between rounded-lg border p-3 text-sm transition-colors text-left ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border hover:border-primary/50 hover:bg-muted"
                        }`}
                      >
                        <span className="font-medium">
                          {date.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })}{" "}
                          {date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {slot.durationMinutes} min
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {fields.map((field) => (
              <div key={field.name} className="space-y-2">
                <Label>
                  {field.label}
                  {field.required && <span className="text-destructive ml-0.5">*</span>}
                </Label>
                {field.tooltip && (
                  <p className="text-xs text-muted-foreground">{field.tooltip}</p>
                )}
                <FormFieldInput
                  field={field}
                  value={formValues[field.name] ?? ""}
                  onChange={(v) => handleFieldChange(field.name, v)}
                />
              </div>
            ))}

            {fields.length === 0 && availableSlots.length === 0 && (
              <div className="text-center py-4">
                <CalendarDays className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No additional details needed. Click below to proceed.
                </p>
              </div>
            )}

            <Button onClick={() => setBookingStep("review")} className="w-full">
              Continue to Review
            </Button>
          </>
        ) : (
          <div className="text-center py-4">
            <AlertCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">
              Sign in to book an appointment
            </p>
            <Button variant="outline" size="sm" onClick={() => signIn("keycloak")}>
              Sign in
            </Button>
          </div>
        )}
      </div>
    );
  }

  if (bookingStep === "review") {
    return (
      <div className="space-y-5">
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">Booking Summary</h4>
          <div className="bg-muted rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Service</span>
              <span className="font-medium text-foreground">{service.name}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Business</span>
              <span className="text-foreground">{business.name}</span>
            </div>
            {selectedSlotId && (() => {
              const slot = availableSlots.find((s) => s.id === selectedSlotId);
              if (!slot) return null;
              const d = new Date(slot.scheduledAt);
              return (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Time Slot</span>
                  <span className="text-foreground">
                    {d.toLocaleDateString(undefined, { month: "short", day: "numeric" })}{" "}
                    {d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
              );
            })()}
            {Object.entries(formValues).map(([fieldName, val]) => {
              const field = fields.find((f) => f.name === fieldName);
              if (!val || !field) return null;
              return (
                <div key={fieldName} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{field.label}</span>
                  <span className="text-foreground">{val}</span>
                </div>
              );
            })}
            {computeAmount() > 0 && (
              <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                <span>Total</span>
                <span>{formatCurrency(computeAmount(), formCurrency)}</span>
              </div>
            )}
          </div>
        </div>

        {paymentError && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <p>{paymentError}</p>
          </div>
        )}

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setBookingStep("details")} className="flex-1">
            Back
          </Button>
          <Button
            onClick={handleConfirmBooking}
            disabled={bookingLoading || paymentLoading}
            className="flex-1"
          >
            {(bookingLoading || paymentLoading) && (
              <Loader2 className="w-4 h-4 mr-1 animate-spin" />
            )}
            Confirm & Pay
          </Button>
        </div>
      </div>
    );
  }

  if (bookingStep === "payment") {
    return (
      <div className="text-center py-6">
        <Loader2 className="w-12 h-12 text-primary mx-auto mb-4 animate-spin" />
        <h4 className="font-semibold text-foreground">Redirecting to payment...</h4>
        <p className="text-sm text-muted-foreground mt-2">
          Please wait while we set up your secure payment.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4 py-4">
      <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
      <div>
        <h4 className="text-lg font-semibold text-foreground">Booking Confirmed!</h4>
        <p className="text-sm text-muted-foreground mt-1">
          Your appointment has been booked successfully.
        </p>
      </div>
      <div className="flex flex-col gap-2">
        <Button asChild className="w-full">
          <Link href="/appointments">View My Appointments</Link>
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setBookingStep("details");
            setFormValues({});
            setPaymentError(null);
          }}
          className="w-full"
        >
          Book Another
        </Button>
      </div>
    </div>
  );
}

export default function ServiceDetailPage({
  params,
}: {
  readonly params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { isLoggedIn } = useAuth();

  const { data: svcData, loading: svcLoading } = useQuery<{ service: Service }>(
    GET_SERVICE, { id }
  );
  const service = svcData?.service ?? null;

  const { data: bizData } = useQuery<{ business: Business }>(
    GET_BUSINESS, { id: service?.businessId ?? "" }, { skip: !service }
  );
  const business = bizData?.business ?? null;

  const { data: formData } = useQuery<{ serviceFormByService: ServiceForm | null }>(
    GET_SERVICE_FORM, { serviceId: id }
  );
  const parsedForm = parseFormPayload(
    formData?.serviceFormByService?.payload as Record<string, unknown> | null
  );
  const fields = parsedForm.fields;
  const formCurrency = parsedForm.currency;

  const { data: pageData } = useQuery<{ servicePageByService: ServicePage | null }>(
    GET_SERVICE_PAGE, { serviceId: id }
  );
  const blogPayload = parsePagePayload(
    pageData?.servicePageByService?.payload as Record<string, unknown> | null,
    service?.name ?? "",
  );
  const blogNodes    = blogPayload.content;
  const blogTitle    = blogPayload.title;
  const blogSubtitle = blogPayload.subtitle;
  const blogTags     = blogPayload.tags;
  const blogBanner   = blogPayload.bannerImageUrl;

  const hasInlineForm = blogNodes.some((n) => n.type === "serviceForm");

  const { data: availData } = useQuery<{ serviceAvailabilities: ServiceAvailability[] }>(
    GET_SERVICE_AVAILABILITIES, { serviceId: id, includeAll: false }, { skip: !id }
  );
  const availableSlots = availData?.serviceAvailabilities?.filter((s) => !s.isFull) ?? [];

  const { data: fbData, refetch: refetchFeedbacks } = useQuery<{
    serviceFeedbacks: Connection<ServiceFeedback>;
  }>(GET_SERVICE_FEEDBACKS, { first: 100, filter: { serviceId: id } });
  const feedbacks = extractNodes(fbData?.serviceFeedbacks);

  const { mutate: createAppointment, loading: bookingLoading } = useMutation<{
    createServiceAppointment: { serviceAppointment: { id: string } };
  }>(CREATE_SERVICE_APPOINTMENT, { throwOnError: true });

  const { mutate: createPaymentLink, loading: paymentLoading } = useMutation<{
    createPaymentLink: { paymentLink: { id: string; redirectUrl: string | null } };
  }>(CREATE_PAYMENT_LINK, { throwOnError: true });

  const { mutate: submitReview, loading: reviewLoading } = useMutation<{
    createServiceFeedback: { serviceFeedback: { id: string } };
  }>(CREATE_SERVICE_FEEDBACK, { onCompleted: refetchFeedbacks });

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [selectedSlotId, setSelectedSlotId] = useState<string | null>(null);
  const [bookingStep, setBookingStep] = useState<BookingStep>("details");
  const [paymentError, setPaymentError] = useState<string | null>(null);

  const [reviewRating, setReviewRating] = useState(0);
  const [reviewTitle, setReviewTitle]   = useState("");
  const [reviewBody, setReviewBody]     = useState("");
  const [reviewDone, setReviewDone]     = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);

  if (svcLoading) {
    return (
      <div>
        <Skeleton className="h-48 sm:h-64 w-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <Skeleton className="h-6 w-72" />
          <Skeleton className="h-4 w-full max-w-3xl" />
          <Skeleton className="h-80 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!service || !business) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Service not found</h1>
        <Button variant="link" asChild className="mt-4">
          <Link href="/explore">Back to Explore</Link>
        </Button>
      </div>
    );
  }

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldName]: value }));
  };

  const computeAmount = (): number => parsedForm.totalAmount;

  const handleConfirmBooking = async () => {
    setPaymentError(null);
    try {
      const appointmentPayload = {
        version: 1,
        currency: formCurrency,
        totalAmount: computeAmount(),
        fields: fields.map((f) => ({
          name: f.name,
          label: f.label,
          type: f.type,
          value: isBooleanField(f)
            ? formValues[f.name] === "true"
            : (formValues[f.name] ?? ""),
          amount: f.amount,
        })),
        meta: {
          submittedAt: new Date().toISOString(),
          clientVersion: "web-1.0.0",
          ...(selectedSlotId ? { availabilityId: selectedSlotId } : {}),
        },
      };

      const result = await createAppointment({
        input: {
          serviceId: id,
          businessId: service.businessId,
          amount: computeAmount(),
          currency: formCurrency,
          payload: appointmentPayload,
          ...(selectedSlotId ? { availabilityId: selectedSlotId } : {}),
        },
      });

      const aptId = result?.createServiceAppointment?.serviceAppointment?.id;
      if (!aptId) throw new Error("Failed to create appointment.");

      setBookingStep("payment");

      const payResult = await createPaymentLink({
        input: { serviceAppointmentsId: aptId },
      });
      const link = payResult?.createPaymentLink?.paymentLink;
      if (link?.redirectUrl) {
        globalThis.location.href = link.redirectUrl;
      } else {
        throw new Error("Payment provider did not return a redirect URL.");
      }
    } catch (err) {
      setPaymentError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      );
      setBookingStep("review");
    }
  };

  const avgRating =
    feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + (f.rating ?? 0), 0) / feedbacks.length
      : null;

  const bookingProps: BookingFormStepsProps = {
    service,
    business,
    fields,
    formValues,
    formCurrency,
    availableSlots,
    selectedSlotId,
    setSelectedSlotId,
    handleFieldChange,
    computeAmount,
    bookingStep,
    setBookingStep,
    handleConfirmBooking,
    bookingLoading,
    paymentLoading,
    paymentError,
    setFormValues,
    setPaymentError,
    isLoggedIn,
  };

  return (
    <div>
      <div className="relative h-48 sm:h-64 bg-muted">
        {service.bannerImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={service.bannerImageUrl}
            alt={service.name}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="text-white/80 hover:text-white hover:bg-white/10 mb-2 -ml-2"
          >
            <Link href={`/business/${business.id}`}>
              <ArrowLeft className="w-4 h-4 mr-1" /> {business.name}
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{service.name}</h1>
          {(service.minPrice ?? service.maxPrice) && (
            <p className="mt-1 text-lg font-semibold text-green-300">
              Starting at{" "}
              {formatCurrency(
                Number.parseFloat((service.minPrice ?? service.maxPrice ?? 0).toString()),
                "PHP"
              )}
            </p>
          )}
          {service.description && (
            <p className="mt-1 text-sm text-white/80 max-w-xl">
              {descExpanded || service.description.length <= 120
                ? service.description
                : `${service.description.slice(0, 120)}...`}
              {service.description.length > 120 && (
                <button
                  type="button"
                  onClick={() => setDescExpanded((v) => !v)}
                  className="ml-1 text-white/60 hover:text-white underline underline-offset-2 text-xs"
                >
                  {descExpanded ? "see less" : "see more"}
                </button>
              )}
            </p>
          )}
          {avgRating !== null && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Star
                    key={n}
                    className={`w-4 h-4 ${
                      n <= Math.round(avgRating)
                        ? "fill-amber-400 text-amber-400"
                        : "text-white/30"
                    }`}
                  />
                ))}
              </div>
              <span className="text-white/80 text-sm">
                {avgRating.toFixed(1)} ({feedbacks.length}{" "}
                {feedbacks.length === 1 ? "review" : "reviews"})
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            <Tabs defaultValue="about" className="w-full">
              <TabsList className="mb-6">
                <TabsTrigger value="about" className="gap-1.5">
                  <BookOpen className="w-4 h-4" /> About
                </TabsTrigger>
                <TabsTrigger value="reviews" className="gap-1.5">
                  <MessageCircle className="w-4 h-4" /> Reviews ({feedbacks.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="about" className="space-y-6">
                {(blogTitle || blogSubtitle || blogBanner || blogTags.length > 0) && (
                  <Card>
                    <CardContent className="p-6 space-y-3">
                      {blogBanner && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={blogBanner} alt="" className="w-full rounded-lg object-cover max-h-60" />
                      )}
                      {blogTitle && <h2 className="text-2xl font-bold text-foreground">{blogTitle}</h2>}
                      {blogSubtitle && <p className="text-muted-foreground">{blogSubtitle}</p>}
                      {blogTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {blogTags.map((tag) => (
                            <span key={tag} className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {blogNodes.map((node) =>
                  node.type === "serviceForm" ? (
                    <Card key={node.id} className="shadow-sm border-primary/20">
                      <CardHeader className="border-b border-border pb-4">
                        <CardTitle className="text-xl">Book This Service</CardTitle>
                        <p className="text-sm text-muted-foreground">{business.name}</p>
                        {computeAmount() > 0 && (
                          <p className="text-xl font-bold text-primary mt-1">
                            {formatCurrency(computeAmount(), formCurrency)}
                          </p>
                        )}
                      </CardHeader>
                      <CardContent className="p-6">
                        <BookingFormSteps {...bookingProps} />
                      </CardContent>
                    </Card>
                  ) : (
                    <NodePreview key={node.id} node={node} />
                  )
                )}

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-blue-700 font-bold text-lg">{business.name[0]}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-foreground">{business.name}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">{business.description}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/business/${business.id}`}>View Business</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="reviews" className="space-y-4">
                {feedbacks.length === 0 ? (
                  <Card>
                    <CardContent className="p-12 text-center">
                      <MessageCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="font-semibold text-foreground">No reviews yet</p>
                      <p className="text-sm text-muted-foreground mt-1">Be the first to leave a review!</p>
                    </CardContent>
                  </Card>
                ) : (
                  feedbacks.map((fb) => {
                    const payload = fb.payload as { title?: string; body?: string } | null;
                    return <FeedbackCard key={fb.id} feedback={fb} payload={payload} />;
                  })
                )}

                {isLoggedIn && !reviewDone && (
                  <Card>
                    <CardContent className="p-6 space-y-4">
                      <h3 className="text-base font-semibold text-foreground">Write a Review</h3>
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
                          <span className="text-sm text-muted-foreground ml-2">
                            {["Terrible", "Poor", "Average", "Good", "Excellent"][reviewRating - 1]}
                          </span>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label>Title</Label>
                        <Input
                          placeholder="Summarise your experience"
                          value={reviewTitle}
                          onChange={(e) => setReviewTitle(e.target.value)}
                          maxLength={120}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Review</Label>
                        <Textarea
                          placeholder="Tell others what you thought of this service..."
                          value={reviewBody}
                          onChange={(e) => setReviewBody(e.target.value)}
                          rows={4}
                          maxLength={1000}
                        />
                      </div>
                      <Button
                        onClick={async () => {
                          if (reviewRating === 0) return;
                          const ok = await submitReview({
                            input: {
                              serviceId: id,
                              rating: reviewRating,
                              payload: { title: reviewTitle.trim(), body: reviewBody.trim() },
                            },
                          });
                          if (ok) {
                            setReviewDone(true);
                            setReviewRating(0);
                            setReviewTitle("");
                            setReviewBody("");
                          }
                        }}
                        disabled={reviewRating === 0 || reviewLoading}
                        className="w-full"
                      >
                        {reviewLoading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                        Submit Review
                      </Button>
                    </CardContent>
                  </Card>
                )}
                {isLoggedIn && reviewDone && (
                  <Card>
                    <CardContent className="p-6 text-center space-y-2">
                      <CheckCircle2 className="w-8 h-8 text-green-500 mx-auto" />
                      <p className="font-semibold text-foreground">Review submitted!</p>
                      <p className="text-sm text-muted-foreground">Thank you for your feedback.</p>
                    </CardContent>
                  </Card>
                )}
                {!isLoggedIn && (
                  <Card>
                    <CardContent className="p-6 text-center">
                      <p className="text-sm text-muted-foreground mb-3">Sign in to leave a review</p>
                      <Button variant="outline" size="sm" onClick={() => signIn("keycloak")}>
                        Sign in
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </div>

          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-lg">
              <CardHeader className="border-b border-border">
                <CardTitle>Book This Service</CardTitle>
                <p className="text-sm text-muted-foreground">{business.name}</p>
                {(service.minPrice ?? service.maxPrice) && (
                  <p className="text-xl font-bold text-primary">
                    {formatCurrency(
                      Number.parseFloat((service.minPrice ?? service.maxPrice ?? 0).toString()),
                      "PHP"
                    )}
                  </p>
                )}
              </CardHeader>

              {hasInlineForm ? (
                <CardContent className="p-6 text-center space-y-3 text-muted-foreground">
                  <CalendarDays className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-sm">
                    Scroll up to find the booking form in the page content.
                  </p>
                </CardContent>
              ) : (
                <CardContent className="p-6">
                  <BookingFormSteps {...bookingProps} />
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function FeedbackCard({
  feedback,
  payload,
}: {
  readonly feedback: ServiceFeedback;
  readonly payload: { readonly title?: string; readonly body?: string } | null;
}) {
  const { data: userData } = useQuery<{
    user: {
      id: string;
      firstName: string;
      lastName: string;
      profilePictureUrl: string | null;
    };
  }>(GET_USER, { id: feedback.userId });
  const reviewer = userData?.user ?? null;

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center gap-3 mb-3">
          <Avatar className="w-9 h-9">
            <AvatarImage src={reviewer?.profilePictureUrl ?? undefined} />
            <AvatarFallback>{getInitials(reviewer?.firstName, reviewer?.lastName)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">
              {reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : "Loading..."}
            </p>
            <p className="text-xs text-muted-foreground">{formatDate(feedback.createdAt ?? "")}</p>
          </div>
          <div className="flex items-center gap-0.5">
            {Array.from({ length: feedback.rating ?? 0 }, (_, i) => i + 1).map((n) => (
              <Star key={n} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>
        {payload?.title && <h4 className="font-medium text-foreground text-sm">{payload.title}</h4>}
        {payload?.body && <p className="text-sm text-muted-foreground mt-1">{payload.body}</p>}
      </CardContent>
    </Card>
  );
}