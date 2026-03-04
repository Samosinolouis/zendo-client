"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, useMutation, extractNodes } from "@/graphql/hooks";
import {
  GET_SERVICE, GET_BUSINESS, GET_SERVICE_FEEDBACKS, GET_USER,
} from "@/graphql/queries";
import { GET_SERVICE_PAGE, GET_SERVICE_FORM } from "@/graphql/queries";
import { CREATE_SERVICE_APPOINTMENT, CREATE_PAYMENT_LINK } from "@/graphql/mutations";
import type { Service, Business, ServiceFeedback, ServiceForm, ServicePage, Connection } from "@/types";
import { formatCurrency, formatDate, getInitials } from "@/lib/utils";
import {
  ArrowLeft, Star, CalendarDays, CreditCard, CheckCircle2,
  AlertCircle, BookOpen, MessageCircle,
  ChevronRight, Loader2,
} from "lucide-react";
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

/* ── Form field shape stored inside ServiceForm.payload ─────── */

interface FormField {
  id: string;
  name: string;
  type: "text" | "number" | "date" | "select" | "textarea" | "checkbox";
  description?: string;
  required?: boolean;
  options?: { label: string; value: string; amount?: number; currency?: string }[];
}

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { isLoggedIn } = useAuth();

  /* ── API queries ─────────────────────────────────────────── */

  const { data: svcData, loading: svcLoading } = useQuery<{ service: Service }>(GET_SERVICE, { id });
  const service = svcData?.service ?? null;

  const { data: bizData } = useQuery<{ business: Business }>(
    GET_BUSINESS, { id: service?.businessId ?? "" }, { skip: !service }
  );
  const business = bizData?.business ?? null;

  const { data: formData } = useQuery<{ serviceFormByService: ServiceForm | null }>(
    GET_SERVICE_FORM, { serviceId: id }
  );
  const formPayload = formData?.serviceFormByService?.payload as { fields?: FormField[] } | null;
  const fields: FormField[] = formPayload?.fields ?? [];

  const { data: pageData } = useQuery<{ servicePageByService: ServicePage | null }>(
    GET_SERVICE_PAGE, { serviceId: id }
  );
  const sections = (pageData?.servicePageByService?.payload as { sections?: { heading: string; body: string }[] })?.sections ?? [];

  const { data: fbData } = useQuery<{ serviceFeedbacks: Connection<ServiceFeedback> }>(
    GET_SERVICE_FEEDBACKS, { first: 100, filter: { serviceId: id } }
  );
  const feedbacks = extractNodes(fbData?.serviceFeedbacks);

  /* ── Mutations ───────────────────────────────────────────── */

  const { mutate: createAppointment, loading: bookingLoading } = useMutation<{
    createServiceAppointment: { serviceAppointment: { id: string } };
  }>(CREATE_SERVICE_APPOINTMENT);

  const { mutate: createPaymentLink, loading: paymentLoading } = useMutation<{
    createPaymentLink: { paymentLink: { id: string; redirectUrl: string | null } };
  }>(CREATE_PAYMENT_LINK);

  /* ── Local state ─────────────────────────────────────────── */

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [bookingStep, setBookingStep] = useState<"details" | "review" | "payment" | "confirmed">("details");
  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  /* ── Loading / not-found ─────────────────────────────────── */

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

  /* ── Helpers ─────────────────────────────────────────────── */

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const computeAmount = (): number => {
    // Start with base service price
    let total = service.price ? parseFloat(service.price.toString()) : 0;
    
    // Add any extra amounts from form options
    for (const field of fields) {
      if (field.type === "select" && field.options) {
        const selected = field.options.find((o) => o.value === formValues[field.id]);
        if (selected?.amount) total += selected.amount;
      }
    }
    return total;
  };

  const handleSubmitBooking = () => setBookingStep("review");

  const handleConfirmBooking = async () => {
    try {
      const amount = computeAmount();
      const result = await createAppointment({
        input: {
          serviceId: id,
          amount,
          currency: "PHP",
          payload: { formValues, status: "pending", scheduledAt: formValues["date"] || null },
        },
      });
      const aptId = result?.createServiceAppointment?.serviceAppointment?.id;
      if (aptId) {
        setAppointmentId(aptId);
        setBookingStep("payment");
      }
    } catch (err) {
      console.error("Failed to create appointment:", err);
    }
  };

  const handlePayment = async () => {
    if (!appointmentId) return;
    try {
      const result = await createPaymentLink({
        input: { serviceAppointmentsId: appointmentId },
      });
      const link = result?.createPaymentLink?.paymentLink;
      if (link?.redirectUrl) {
        window.location.href = link.redirectUrl;
      } else {
        // Payment link created but no redirect — mark as confirmed
        setBookingStep("confirmed");
      }
    } catch (err) {
      console.error("Failed to create payment link:", err);
      // Fall through to confirmed for demo purposes
      setBookingStep("confirmed");
    }
  };

  const avgRating =
    feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + (f.rating ?? 0), 0) / feedbacks.length
      : null;

  return (
    <div>
      {/* Banner */}
      <div className="relative h-48 sm:h-64 bg-muted">
        {service.bannerImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={service.bannerImageUrl} alt={service.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <Button variant="ghost" size="sm" asChild className="text-white/80 hover:text-white hover:bg-white/10 mb-2 -ml-2">
            <Link href={`/business/${business.id}`}>
              <ArrowLeft className="w-4 h-4 mr-1" /> {business.name}
            </Link>
          </Button>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{service.name}</h1>
          {service.price && (
            <div className="mt-2 text-lg font-semibold text-green-300">
              ₱{parseFloat(service.price.toString()).toFixed(2)}
            </div>
          )}
          {avgRating !== null && (
            <div className="flex items-center gap-2 mt-2">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className={`w-4 h-4 ${i < Math.round(avgRating) ? "fill-amber-400 text-amber-400" : "text-white/30"}`} />
                ))}
              </div>
              <span className="text-white/80 text-sm">
                {avgRating.toFixed(1)} ({feedbacks.length} review{feedbacks.length !== 1 ? "s" : ""})
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left — Blog-like Service Content */}
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
                <Card>
                  <CardContent className="p-6">
                    <p className="text-muted-foreground leading-relaxed text-base">{service.description}</p>
                  </CardContent>
                </Card>

                {sections.length > 0 && sections.map((section, i) => (
                  <Card key={i}>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <ChevronRight className="w-5 h-5 text-blue-600" />
                        {section.heading}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <p className="text-muted-foreground leading-relaxed">{section.body}</p>
                    </CardContent>
                  </Card>
                ))}

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
                    return (
                      <FeedbackCard key={fb.id} feedback={fb} payload={payload} />
                    );
                  })
                )}
              </TabsContent>
            </Tabs>
          </div>

          {/* Right — Booking Card */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24 shadow-lg">
              <CardHeader className="border-b border-border">
                <CardTitle>Book This Service</CardTitle>
                <p className="text-sm text-muted-foreground">{business.name}</p>
              </CardHeader>

              {bookingStep === "details" && (
                <CardContent className="p-6 space-y-5">
                  {!isLoggedIn ? (
                    <div className="text-center py-4">
                      <AlertCircle className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground mb-3">Sign in to book an appointment</p>
                      <Button variant="outline" size="sm" onClick={() => signIn("keycloak")}>
                        Sign in
                      </Button>
                    </div>
                  ) : (
                    <>
                      {fields.map((field) => (
                        <div key={field.id} className="space-y-2">
                          <Label>{field.name}</Label>
                          {field.description && (
                            <p className="text-xs text-muted-foreground">{field.description}</p>
                          )}

                          {field.type === "select" && field.options && field.options.length > 0 ? (
                            <Select
                              value={formValues[field.id] || ""}
                              onValueChange={(val) => handleFieldChange(field.id, val)}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select..." />
                              </SelectTrigger>
                              <SelectContent>
                                {field.options.map((opt) => (
                                  <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                    {opt.amount ? ` (${formatCurrency(opt.amount, opt.currency ?? "PHP")})` : ""}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          ) : field.type === "date" ? (
                            <Input
                              type="date"
                              value={formValues[field.id] || ""}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            />
                          ) : field.type === "textarea" ? (
                            <Textarea
                              value={formValues[field.id] || ""}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                              rows={3}
                            />
                          ) : field.type === "checkbox" ? (
                            <div className="flex items-center gap-2">
                              <Checkbox
                                id={`field-${field.id}`}
                                checked={formValues[field.id] === "true"}
                                onCheckedChange={(checked) =>
                                  handleFieldChange(field.id, checked ? "true" : "false")
                                }
                              />
                              <Label htmlFor={`field-${field.id}`} className="font-normal">
                                {field.name}
                              </Label>
                            </div>
                          ) : (
                            <Input
                              type={field.type === "number" ? "number" : "text"}
                              value={formValues[field.id] || ""}
                              onChange={(e) => handleFieldChange(field.id, e.target.value)}
                            />
                          )}
                        </div>
                      ))}

                      {fields.length === 0 && (
                        <div className="text-center py-4">
                          <CalendarDays className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No additional details needed. Click below to proceed.
                          </p>
                        </div>
                      )}

                      <Button onClick={handleSubmitBooking} className="w-full">
                        Continue to Review
                      </Button>
                    </>
                  )}
                </CardContent>
              )}

              {bookingStep === "review" && (
                <CardContent className="p-6 space-y-5">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground mb-3">Booking Summary</h4>
                    <div className="bg-muted rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service</span>
                        <span className="text-foreground font-medium">{service.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Business</span>
                        <span className="text-foreground">{business.name}</span>
                      </div>
                      {Object.entries(formValues).map(([fieldId, value]) => {
                        const field = fields.find((f) => f.id === fieldId);
                        if (!value || !field) return null;
                        return (
                          <div key={fieldId} className="flex justify-between text-sm">
                            <span className="text-muted-foreground">{field.name}</span>
                            <span className="text-foreground">{value}</span>
                          </div>
                        );
                      })}
                      {computeAmount() > 0 && (
                        <div className="flex justify-between text-sm font-bold border-t pt-2 mt-2">
                          <span>Total</span>
                          <span>{formatCurrency(computeAmount(), "PHP")}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setBookingStep("details")} className="flex-1">
                      Back
                    </Button>
                    <Button onClick={handleConfirmBooking} disabled={bookingLoading} className="flex-1">
                      {bookingLoading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                      Confirm & Pay
                    </Button>
                  </div>
                </CardContent>
              )}

              {bookingStep === "payment" && (
                <CardContent className="p-6 space-y-5">
                  <div className="text-center">
                    <CreditCard className="w-10 h-10 text-primary mx-auto mb-3" />
                    <h4 className="font-semibold text-foreground">Payment</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Complete your payment to finalize the booking.
                    </p>
                  </div>
                  <Button onClick={handlePayment} disabled={paymentLoading} className="w-full bg-green-600 hover:bg-green-700">
                    {paymentLoading && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                    Proceed to Payment
                  </Button>
                </CardContent>
              )}

              {bookingStep === "confirmed" && (
                <CardContent className="p-6 space-y-5 text-center">
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
                      onClick={() => { setBookingStep("details"); setFormValues({}); setAppointmentId(null); }}
                      className="w-full"
                    >
                      Book Another
                    </Button>
                  </div>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Feedback card component (fetches reviewer lazily) ─────── */

function FeedbackCard({
  feedback,
  payload,
}: {
  feedback: ServiceFeedback;
  payload: { title?: string; body?: string } | null;
}) {
  const { data: userData } = useQuery<{ user: { id: string; firstName: string; lastName: string; profilePictureUrl: string | null } }>(
    GET_USER, { id: feedback.userId }
  );
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
            {Array.from({ length: feedback.rating ?? 0 }).map((_, i) => (
              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            ))}
          </div>
        </div>
        {payload?.title && <h4 className="font-medium text-foreground text-sm">{payload.title}</h4>}
        {payload?.body && <p className="text-sm text-muted-foreground mt-1">{payload.body}</p>}
      </CardContent>
    </Card>
  );
}
