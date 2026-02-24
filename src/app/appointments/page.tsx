"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { getAppointmentsByUserId, getServiceById, getBusinessById } from "@/lib/mock-data";
import { formatCurrency, formatDateTime, getStatusColor } from "@/lib/utils";
import { CalendarDays, ArrowRight, Clock, CheckCircle2, XCircle, Hourglass, Sparkles, CalendarCheck } from "lucide-react";

export default function AppointmentsPage() {
  const { user, isLoggedIn } = useAuth();
  const appointments = user ? getAppointmentsByUserId(user.id) : [];

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-hero flex items-center justify-center px-4">
        <div className="text-center animate-scale-in">
          <div className="w-24 h-24 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
            <CalendarDays className="w-10 h-10 text-white/70" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Your Appointments</h1>
          <p className="text-white/60 mb-8 text-lg">Sign in to view and manage your bookings.</p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:shadow-lg hover:shadow-white/20 transition-all hover:-translate-y-0.5"
          >
            Sign in to continue <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  const upcoming = appointments.filter(
    (a) => a.status === "confirmed" || a.status === "pending"
  );
  const past = appointments.filter(
    (a) => a.status === "completed" || a.status === "cancelled"
  );

  const statCards = [
    {
      label: "Total",
      value: appointments.length,
      icon: CalendarDays,
      gradient: "from-blue-500 to-blue-700",
      bg: "bg-blue-50",
      text: "text-blue-600",
    },
    {
      label: "Confirmed",
      value: appointments.filter((a) => a.status === "confirmed").length,
      icon: CheckCircle2,
      gradient: "from-green-500 to-emerald-600",
      bg: "bg-green-50",
      text: "text-green-600",
    },
    {
      label: "Pending",
      value: appointments.filter((a) => a.status === "pending").length,
      icon: Hourglass,
      gradient: "from-amber-500 to-orange-500",
      bg: "bg-amber-50",
      text: "text-amber-600",
    },
    {
      label: "Cancelled",
      value: appointments.filter((a) => a.status === "cancelled").length,
      icon: XCircle,
      gradient: "from-red-500 to-rose-600",
      bg: "bg-red-50",
      text: "text-red-600",
    },
  ];

  return (
    <div className="min-h-screen bg-[#f8faff]">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-hero px-4 pb-20 pt-12">
        {/* Blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400/20 rounded-full filter blur-3xl animate-blob pointer-events-none" />
        <div className="absolute bottom-0 left-20 w-64 h-64 bg-cyan-500/15 rounded-full filter blur-3xl animate-blob pointer-events-none" style={{ animationDelay: "3s" }} />

        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="animate-slide-up">
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white/70 text-xs font-medium mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                Your Schedule
              </span>
              <h1 className="text-4xl font-extrabold text-white leading-tight">
                My Appointments
              </h1>
              <p className="text-white/60 mt-2 text-base">
                Hello, <span className="text-white font-semibold">{user?.firstName}</span>! You have{" "}
                <span className="text-blue-300 font-semibold">{upcoming.length}</span> upcoming booking{upcoming.length !== 1 ? "s" : ""}.
              </p>
            </div>
            <Link
              href="/explore"
              className="animate-fade-in shrink-0 inline-flex items-center gap-2 px-5 py-3 bg-white/10 border border-white/20 text-white rounded-xl text-sm font-semibold hover:bg-white/20 transition-all"
            >
              <CalendarCheck className="w-4 h-4" />
              Book New Service
            </Link>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 20C1200 60 900 0 720 20C540 40 240 0 0 20L0 60Z" fill="#f8faff" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-16">

        {/* Stats row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
          {statCards.map((s, i) => (
            <div
              key={s.label}
              style={{ animationDelay: `${i * 0.08}s` }}
              className={`animate-scale-in relative overflow-hidden rounded-2xl ${s.bg} border border-white p-5 shadow-sm hover:shadow-md transition-shadow`}
            >
              <div className={`absolute top-0 right-0 w-16 h-16 rounded-full bg-linear-to-br ${s.gradient} opacity-10 blur-xl`} />
              <s.icon className={`w-6 h-6 ${s.text} mb-3`} />
              <p className="text-3xl font-extrabold text-gray-900">{s.value}</p>
              <p className={`text-sm font-medium ${s.text} mt-0.5`}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Upcoming */}
        <section className="mb-12">
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Upcoming</h2>
            <span className="px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">{upcoming.length}</span>
          </div>

          {upcoming.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-gray-100 shadow-sm animate-fade-in">
              <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                <CalendarDays className="w-9 h-9 text-blue-300" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">No upcoming appointments</h3>
              <p className="text-gray-500 mb-6">Ready to book something amazing?</p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
              >
                Explore Services <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {upcoming.map((apt, i) => {
                const service = getServiceById(apt.serviceId);
                const business = service ? getBusinessById(service.businessId) : null;
                return (
                  <div
                    key={apt.id}
                    style={{ animationDelay: `${i * 0.07}s` }}
                    className="animate-slide-up group bg-white rounded-2xl border border-gray-100 p-5 shadow-sm hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col sm:flex-row sm:items-center gap-4"
                  >
                    {/* Left accent */}
                    <div className={`w-1.5 h-16 rounded-full shrink-0 ${apt.status === "confirmed" ? "bg-green-500" : "bg-amber-400"} hidden sm:block`} />

                    {/* Calendar icon */}
                    <div className="w-14 h-14 bg-blue-50 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-blue-100">
                      <span className="text-xs font-bold text-blue-600 uppercase leading-none">
                        {apt.scheduledAt ? new Date(apt.scheduledAt).toLocaleString("default", { month: "short" }) : "—"}
                      </span>
                      <span className="text-2xl font-extrabold text-blue-700 leading-none">
                        {apt.scheduledAt ? new Date(apt.scheduledAt).getDate() : "—"}
                      </span>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 text-base group-hover:text-blue-600 transition-colors truncate">{service?.name ?? "Unknown Service"}</h3>
                      <p className="text-sm text-gray-500">{business?.name}</p>
                      {apt.scheduledAt && (
                        <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDateTime(apt.scheduledAt)}
                        </p>
                      )}
                    </div>

                    {/* Amount + CTA */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="text-right">
                        <p className="text-xs text-gray-400">Amount</p>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(apt.amount, apt.currency)}</p>
                      </div>
                      <Link
                        href={`/service/${apt.serviceId}`}
                        className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white hover:bg-blue-700 group-hover:shadow-lg group-hover:shadow-blue-500/30 transition-all"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Past */}
        <section>
          <div className="flex items-center gap-2.5 mb-6">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-gray-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Past</h2>
            <span className="px-2.5 py-0.5 bg-gray-100 text-gray-600 text-xs font-semibold rounded-full">{past.length}</span>
          </div>

          {past.length === 0 ? (
            <p className="text-gray-400 text-sm">No past appointments yet.</p>
          ) : (
            <div className="space-y-3">
              {past.map((apt, i) => {
                const service = getServiceById(apt.serviceId);
                const business = service ? getBusinessById(service.businessId) : null;
                return (
                  <div
                    key={apt.id}
                    style={{ animationDelay: `${i * 0.05}s` }}
                    className="animate-fade-in bg-white/60 rounded-2xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-4 opacity-70 hover:opacity-100 transition-opacity"
                  >
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex flex-col items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-gray-500 uppercase leading-none">
                        {apt.scheduledAt ? new Date(apt.scheduledAt).toLocaleString("default", { month: "short" }) : "—"}
                      </span>
                      <span className="text-xl font-extrabold text-gray-600 leading-none">
                        {apt.scheduledAt ? new Date(apt.scheduledAt).getDate() : "—"}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColor(apt.status)}`}>
                          {apt.status}
                        </span>
                      </div>
                      <h3 className="font-semibold text-gray-700 truncate">{service?.name ?? "Unknown Service"}</h3>
                      <p className="text-sm text-gray-400">{business?.name}</p>
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-base font-bold text-gray-600">{formatCurrency(apt.amount, apt.currency)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Bottom CTA if empty */}
        {appointments.length === 0 && (
          <div className="mt-10 rounded-3xl overflow-hidden relative bg-hero p-10 text-center animate-fade-in">
            <div className="absolute inset-0 bg-linear-to-br from-blue-600/80 to-blue-900/90" />
            <div className="relative">
              <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
                <Sparkles className="w-7 h-7 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Start Your Journey</h3>
              <p className="text-white/70 mb-6">Book your first appointment with one of our amazing services.</p>
              <Link
                href="/explore"
                className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:shadow-xl transition-all hover:-translate-y-0.5"
              >
                Browse Services <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
