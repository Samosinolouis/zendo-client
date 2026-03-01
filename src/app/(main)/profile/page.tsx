"use client";

import { useAuth } from "@/providers/AuthProvider";
import {
  getPaymentsByUserId,
  mockBillingAddresses,
  mockSalesInvoices,
} from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import {
  User,
  Mail,
  CreditCard,
  FileText,
  MapPin,
  Download,
  Sparkles,
  Shield,
  ArrowRight,
  Star,
  CalendarDays,
  TrendingUp,
} from "lucide-react";
import { signIn } from "next-auth/react";

export default function ProfilePage() {
  const { user, isLoggedIn, isOwner } = useAuth();

  if (!isLoggedIn || !user) {
    return (
      <div className="min-h-screen bg-hero flex items-center justify-center px-4">
        <div className="text-center animate-scale-in">
          <div className="w-24 h-24 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
            <User className="w-10 h-10 text-white/70" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">My Profile</h1>
          <p className="text-white/60 mb-8 text-lg">Sign in to view your profile.</p>
          <button
            onClick={() => signIn("keycloak", { callbackUrl: "/onboarding" })}
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:shadow-lg transition-all hover:-translate-y-0.5"
          >
            Sign in <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  const payments = getPaymentsByUserId(user.id);
  const billingAddress = mockBillingAddresses.find((ba) => ba.userId === user.id);
  const invoices = mockSalesInvoices.filter((inv) =>
    payments.some((p) => p.id === inv.paymentId)
  );

  const stats = [
    { icon: CalendarDays, label: "Appointments", value: payments.length, color: "text-blue-600", bg: "bg-blue-50" },
    { icon: TrendingUp, label: "Total Spent", value: formatCurrency(payments.reduce((s, p) => s + p.amount, 0)), color: "text-green-600", bg: "bg-green-50" },
    { icon: Star, label: "Reviews Given", value: 0, color: "text-amber-600", bg: "bg-amber-50" },
  ];

  return (
    <div className="min-h-screen bg-[#f8faff]">
      {/* ── Cover / Hero ── */}
      <div className="relative overflow-hidden">
        {/* Animated cover */}
        <div className="h-52 bg-hero relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full filter blur-3xl animate-blob pointer-events-none" />
          <div className="absolute bottom-0 left-20 w-64 h-64 bg-cyan-500/15 rounded-full filter blur-3xl animate-blob pointer-events-none" style={{ animationDelay: "2s" }} />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-5" />

          {/* Floating sparkles */}
          <div className="absolute top-6 left-1/4 animate-float" style={{ animationDelay: "1s" }}>
            <Sparkles className="w-5 h-5 text-blue-300/60" />
          </div>
          <div className="absolute bottom-8 right-1/3 animate-float" style={{ animationDelay: "3s" }}>
            <Star className="w-4 h-4 text-cyan-300/60" />
          </div>
        </div>

        {/* Avatar + name row */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="relative -mt-12 mb-6 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            {/* Avatar with ring */}
            <div className="flex items-end gap-4">
              <div className="relative animate-scale-in">
                <div className="w-24 h-24 rounded-2xl bg-linear-to-br from-blue-500 to-blue-700 shadow-xl shadow-blue-500/30 flex items-center justify-center border-4 border-white overflow-hidden">
                  {user.profilePictureUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.profilePictureUrl} alt={user.firstName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-3xl font-extrabold text-white">{user.firstName[0]}</span>
                  )}
                </div>
                {/* Online dot */}
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-white animate-pulse-glow" />
              </div>
              <div className="pb-1 animate-slide-up">
                <h1 className="text-2xl font-extrabold text-gray-900">
                  {user.firstName} {user.lastName}
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-gray-500 text-sm">@{user.username}</span>
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${isOwner ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>
                    {isOwner ? "Business Owner" : "Customer"}
                  </span>
                </div>
              </div>
            </div>

            {/* Edit profile placeholder */}
            <button className="animate-fade-in shrink-0 px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all bg-white shadow-sm">
              Edit Profile
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 pb-16">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {stats.map((s, i) => (
            <div
              key={s.label}
              style={{ animationDelay: `${i * 0.08}s` }}
              className={`animate-scale-in ${s.bg} rounded-2xl p-4 border border-white shadow-sm text-center hover:shadow-md transition-shadow`}
            >
              <s.icon className={`w-5 h-5 ${s.color} mx-auto mb-2`} />
              <p className="text-2xl font-extrabold text-gray-900">{s.value}</p>
              <p className={`text-xs font-medium ${s.color} mt-0.5`}>{s.label}</p>
            </div>
          ))}
        </div>

        <div className="space-y-6">

          {/* Personal Info card */}
          <div className="animate-slide-up bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50 bg-linear-to-r from-blue-50 to-transparent">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-blue-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Personal Information</h2>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Full Name</label>
                  <p className="text-sm font-semibold text-gray-900">
                    {user.firstName} {user.middleName ? `${user.middleName} ` : ""}{user.lastName}{user.suffix ? ` ${user.suffix}` : ""}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Username</label>
                  <p className="text-sm font-semibold text-gray-900">@{user.username}</p>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Email</label>
                  <div className="flex items-center gap-2 text-sm font-semibold text-gray-900">
                    <Mail className="w-4 h-4 text-blue-400 shrink-0" />
                    {user.email}
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Account Type</label>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-green-500" />
                    <p className="text-sm font-semibold text-gray-900 capitalize">{user.role}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Billing Address */}
          <div className="animate-slide-up bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ animationDelay: "0.1s" }}>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50 bg-linear-to-r from-green-50 to-transparent">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-4 h-4 text-green-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Billing Address</h2>
            </div>
            <div className="p-6">
              {billingAddress ? (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 text-sm text-gray-700 space-y-0.5">
                  <p className="font-semibold">{billingAddress.addressLine1}</p>
                  {billingAddress.addressLine2 && <p>{billingAddress.addressLine2}</p>}
                  <p>
                    {billingAddress.city}, {billingAddress.state} {billingAddress.postalCode}
                  </p>
                  <p className="text-gray-500">{billingAddress.country}</p>
                </div>
              ) : (
                <div className="text-center py-8">
                  <MapPin className="w-8 h-8 text-gray-200 mx-auto mb-3 animate-float" />
                  <p className="text-sm text-gray-500">No billing address on file.</p>
                  <button className="mt-3 text-sm font-semibold text-blue-600 hover:underline">+ Add address</button>
                </div>
              )}
            </div>
          </div>

          {/* Payment History */}
          <div className="animate-slide-up bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ animationDelay: "0.15s" }}>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50 bg-linear-to-r from-emerald-50 to-transparent">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-emerald-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Payment History</h2>
              <span className="ml-auto px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">{payments.length}</span>
            </div>
            <div className="p-6">
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="w-8 h-8 text-gray-200 mx-auto mb-3 animate-float" />
                  <p className="text-sm text-gray-500">No payments yet.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-50">
                        <th className="pb-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">ID</th>
                        <th className="pb-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Amount</th>
                        <th className="pb-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Method</th>
                        <th className="pb-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Date</th>
                        <th className="pb-3 text-left text-xs font-bold text-gray-400 uppercase tracking-wide">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {payments.map((p) => (
                        <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="py-3 text-gray-500 font-mono text-xs">{p.id}</td>
                          <td className="py-3 font-bold text-gray-900">{formatCurrency(p.amount, p.currency)}</td>
                          <td className="py-3 text-gray-600 capitalize">{p.method}</td>
                          <td className="py-3 text-gray-500 text-xs">{p.paidAt ? formatDate(p.paidAt) : "—"}</td>
                          <td className="py-3">
                            {p.refundedAt ? (
                              <span className="px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full">Refunded</span>
                            ) : p.paidAt ? (
                              <span className="px-2.5 py-1 bg-green-50 text-green-700 text-xs font-semibold rounded-full">Paid</span>
                            ) : (
                              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-semibold rounded-full">Pending</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Invoices */}
          <div className="animate-slide-up bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-50 bg-linear-to-r from-violet-50 to-transparent">
              <div className="w-8 h-8 bg-violet-100 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-violet-600" />
              </div>
              <h2 className="text-base font-bold text-gray-900">Invoices</h2>
              <span className="ml-auto px-2.5 py-0.5 bg-violet-100 text-violet-700 text-xs font-bold rounded-full">{invoices.length}</span>
            </div>
            <div className="p-6">
              {invoices.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="w-8 h-8 text-gray-200 mx-auto mb-3 animate-float" />
                  <p className="text-sm text-gray-500">No invoices yet.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {invoices.map((inv, i) => (
                    <div
                      key={inv.id}
                      style={{ animationDelay: `${i * 0.05}s` }}
                      className="animate-fade-in flex items-center justify-between bg-gray-50 rounded-xl p-4 border border-gray-100 hover:border-violet-200 hover:bg-violet-50/30 transition-all group"
                    >
                      <div>
                        <p className="text-sm font-bold text-gray-900 group-hover:text-violet-700 transition-colors">Invoice #{inv.id}</p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          Issued: {formatDate(inv.requestedAt)}
                          {inv.resolvedAt && ` · Resolved: ${formatDate(inv.resolvedAt)}`}
                        </p>
                      </div>
                      {inv.attachmentUrl && (
                        <a
                          href={inv.attachmentUrl}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-sm font-semibold text-violet-600 hover:border-violet-300 hover:shadow-sm transition-all"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
