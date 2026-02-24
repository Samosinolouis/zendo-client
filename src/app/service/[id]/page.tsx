"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  getServiceById,
  getBusinessById,
  getFieldsByServiceId,
  getOptionsByFieldId,
  getFeedbacksByServiceId,
  getUserById,
} from "@/lib/mock-data";
import { useAuth } from "@/providers/AuthProvider";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  ArrowLeft,
  Star,
  CalendarDays,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export default function ServiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const service = getServiceById(id);
  const business = service ? getBusinessById(service.businessId) : null;
  const fields = service ? getFieldsByServiceId(service.id) : [];
  const feedbacks = service ? getFeedbacksByServiceId(service.id) : [];
  const { isLoggedIn } = useAuth();

  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [bookingStep, setBookingStep] = useState<"details" | "review" | "payment" | "confirmed">("details");

  if (!service || !business) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Service not found</h1>
        <Link href="/explore" className="text-indigo-600 mt-4 inline-block hover:underline">
          Back to Explore
        </Link>
      </div>
    );
  }

  const handleFieldChange = (fieldId: string, value: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmitBooking = () => {
    setBookingStep("review");
  };

  const handleConfirmBooking = () => {
    setBookingStep("payment");
  };

  const handlePayment = () => {
    // Simulate payment link redirect
    setTimeout(() => setBookingStep("confirmed"), 1500);
  };

  const avgRating =
    feedbacks.length > 0
      ? feedbacks.reduce((sum, f) => sum + (f.rating ?? 0), 0) / feedbacks.length
      : null;

  return (
    <div>
      {/* Banner */}
      <div className="relative h-48 sm:h-64 bg-gray-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={service.bannerUrl} alt={service.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <Link
            href={`/business/${business.id}`}
            className="inline-flex items-center gap-1 text-white/80 text-sm hover:text-white mb-2"
          >
            <ArrowLeft className="w-4 h-4" /> {business.name}
          </Link>
          <h1 className="text-2xl sm:text-3xl font-bold text-white">{service.name}</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          {/* Left — Service Info & Reviews */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <p className="text-gray-600 leading-relaxed">{service.description}</p>
              {avgRating !== null && (
                <div className="flex items-center gap-2 mt-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < Math.round(avgRating)
                            ? "fill-amber-400 text-amber-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {avgRating.toFixed(1)} ({feedbacks.length} review
                    {feedbacks.length !== 1 ? "s" : ""})
                  </span>
                </div>
              )}
            </div>

            {/* Reviews */}
            {feedbacks.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Reviews</h3>
                <div className="space-y-4">
                  {feedbacks.map((fb) => {
                    const reviewer = getUserById(fb.userId);
                    return (
                      <div key={fb.id} className="bg-gray-50 rounded-xl p-5 border border-gray-100">
                        <div className="flex items-center gap-3 mb-2">
                          {reviewer?.profilePictureUrl && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={reviewer.profilePictureUrl}
                              alt=""
                              className="w-8 h-8 rounded-full bg-gray-200"
                            />
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {reviewer?.firstName} {reviewer?.lastName}
                            </p>
                            <p className="text-xs text-gray-400">{formatDate(fb.createdAt)}</p>
                          </div>
                          <div className="ml-auto flex items-center gap-1">
                            {Array.from({ length: fb.rating ?? 0 }).map((_, i) => (
                              <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                            ))}
                          </div>
                        </div>
                        <h4 className="font-medium text-gray-900 text-sm">{fb.title}</h4>
                        <p className="text-sm text-gray-500 mt-1">{fb.richText}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Right — Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900">Book This Service</h3>
                <p className="text-sm text-gray-500 mt-1">{business.name}</p>
              </div>

              {bookingStep === "details" && (
                <div className="p-6 space-y-5">
                  {!isLoggedIn ? (
                    <div className="text-center py-4">
                      <AlertCircle className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                      <p className="text-sm text-gray-600 mb-3">Sign in to book an appointment</p>
                      <p className="text-xs text-gray-400">
                        Use the user switcher in the navbar to sign in as a demo user
                      </p>
                    </div>
                  ) : (
                    <>
                      {fields.map((field) => {
                        const options = getOptionsByFieldId(field.id);
                        return (
                          <div key={field.id}>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                              {field.name}
                            </label>
                            {field.description && (
                              <p className="text-xs text-gray-400 mb-1.5">{field.description}</p>
                            )}

                            {field.type === "select" && options.length > 0 ? (
                              <select
                                value={formValues[field.id] || ""}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              >
                                <option value="">Select...</option>
                                {options.map((opt) => (
                                  <option key={opt.id} value={opt.name}>
                                    {opt.name}
                                    {opt.amount ? ` (${formatCurrency(opt.amount, opt.currency)})` : ""}
                                  </option>
                                ))}
                              </select>
                            ) : field.type === "date" ? (
                              <input
                                type="date"
                                value={formValues[field.id] || ""}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            ) : field.type === "textarea" ? (
                              <textarea
                                value={formValues[field.id] || ""}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                rows={3}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                              />
                            ) : field.type === "checkbox" ? (
                              <label className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={formValues[field.id] === "true"}
                                  onChange={(e) =>
                                    handleFieldChange(field.id, e.target.checked ? "true" : "false")
                                  }
                                  className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <span className="text-sm text-gray-600">{field.name}</span>
                              </label>
                            ) : (
                              <input
                                type={field.type === "number" ? "number" : "text"}
                                value={formValues[field.id] || ""}
                                onChange={(e) => handleFieldChange(field.id, e.target.value)}
                                className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                              />
                            )}
                          </div>
                        );
                      })}

                      {fields.length === 0 && (
                        <div className="text-center py-4">
                          <CalendarDays className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                          <p className="text-sm text-gray-500">
                            No additional details needed. Click below to proceed.
                          </p>
                        </div>
                      )}

                      <button
                        onClick={handleSubmitBooking}
                        className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                      >
                        Continue to Review
                      </button>
                    </>
                  )}
                </div>
              )}

              {bookingStep === "review" && (
                <div className="p-6 space-y-5">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-700 mb-3">Booking Summary</h4>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Service</span>
                        <span className="text-gray-900 font-medium">{service.name}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Business</span>
                        <span className="text-gray-900">{business.name}</span>
                      </div>
                      {Object.entries(formValues).map(([fieldId, value]) => {
                        const field = fields.find((f) => f.id === fieldId);
                        if (!value || !field) return null;
                        return (
                          <div key={fieldId} className="flex justify-between text-sm">
                            <span className="text-gray-500">{field.name}</span>
                            <span className="text-gray-900">{value}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setBookingStep("details")}
                      className="flex-1 py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleConfirmBooking}
                      className="flex-1 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors"
                    >
                      Confirm & Pay
                    </button>
                  </div>
                </div>
              )}

              {bookingStep === "payment" && (
                <div className="p-6 space-y-5">
                  <div className="text-center">
                    <CreditCard className="w-10 h-10 text-indigo-600 mx-auto mb-3" />
                    <h4 className="font-semibold text-gray-900">Payment</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      You would be redirected to the payment provider.
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4 text-center">
                    <p className="text-xs text-gray-400 mb-2">Mock Payment Link</p>
                    <p className="text-sm text-indigo-600 flex items-center justify-center gap-1">
                      <ExternalLink className="w-3.5 h-3.5" />
                      https://checkout.stripe.com/mock
                    </p>
                  </div>
                  <button
                    onClick={handlePayment}
                    className="w-full py-3 bg-green-600 text-white font-semibold rounded-xl hover:bg-green-700 transition-colors"
                  >
                    Simulate Payment Success
                  </button>
                </div>
              )}

              {bookingStep === "confirmed" && (
                <div className="p-6 space-y-5 text-center">
                  <CheckCircle2 className="w-14 h-14 text-green-500 mx-auto" />
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900">Booking Confirmed!</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Your appointment has been booked successfully.
                    </p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Link
                      href="/appointments"
                      className="w-full py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 transition-colors text-center"
                    >
                      View My Appointments
                    </Link>
                    <button
                      onClick={() => {
                        setBookingStep("details");
                        setFormValues({});
                      }}
                      className="w-full py-3 border border-gray-200 text-gray-700 font-medium rounded-xl hover:bg-gray-50 transition-colors"
                    >
                      Book Another
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
