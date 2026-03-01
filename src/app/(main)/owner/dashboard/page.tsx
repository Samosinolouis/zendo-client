"use client";

import { useAuth } from "@/providers/AuthProvider";
import {
  getBusinessesByUserId,
  getServicesByBusinessId,
  getAppointmentsByServiceId,
  getPayoutsByBusinessId,
  getFeedbacksByServiceId,
} from "@/lib/mock-data";
import { formatCurrency } from "@/lib/utils";
import {
  Store,
  Wrench,
  CalendarDays,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

export default function OwnerDashboardPage() {
  const { user } = useAuth();
  if (!user) return null;

  const businesses = getBusinessesByUserId(user.id);
  const allServices = businesses.flatMap((b) => getServicesByBusinessId(b.id));
  const allAppointments = allServices.flatMap((s) => getAppointmentsByServiceId(s.id));
  const allPayouts = businesses.flatMap((b) => getPayoutsByBusinessId(b.id));
  const allFeedbacks = allServices.flatMap((s) => getFeedbacksByServiceId(s.id));

  const totalRevenue = allPayouts.reduce((sum, p) => sum + p.grossCollection, 0);
  const totalNetPayout = allPayouts.reduce((sum, p) => sum + p.netPayout, 0);
  const confirmedCount = allAppointments.filter((a) => a.status === "confirmed").length;
  const pendingCount = allAppointments.filter((a) => a.status === "pending").length;
  const avgRating =
    allFeedbacks.length > 0
      ? allFeedbacks.reduce((sum, f) => sum + (f.rating ?? 0), 0) / allFeedbacks.length
      : 0;

  const statCards = [
    {
      label: "Businesses",
      value: businesses.length,
      icon: Store,
      color: "bg-purple-50 text-purple-600",
    },
    {
      label: "Services",
      value: allServices.length,
      icon: Wrench,
      color: "bg-blue-50 text-blue-600",
    },
    {
      label: "Appointments",
      value: allAppointments.length,
      icon: CalendarDays,
      color: "bg-green-50 text-green-600",
    },
    {
      label: "Avg. Rating",
      value: avgRating > 0 ? avgRating.toFixed(1) : "—",
      icon: Star,
      color: "bg-amber-50 text-amber-600",
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-500 mt-1">
          Welcome back, {user.firstName}. Here&apos;s a snapshot of your business.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {statCards.map((card) => (
          <div key={card.label} className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-gray-500">{card.label}</span>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                <card.icon className="w-4.5 h-4.5" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Revenue Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            Revenue Summary
          </h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Gross Collection</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatCurrency(totalRevenue)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Total Fees</span>
              <span className="text-sm text-red-500">
                -{formatCurrency(allPayouts.reduce((s, p) => s + p.totalFees, 0))}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Withholding Tax</span>
              <span className="text-sm text-red-500">
                -{formatCurrency(allPayouts.reduce((s, p) => s + p.withholdingTax, 0))}
              </span>
            </div>
            <div className="border-t border-gray-100 pt-4 flex justify-between items-center">
              <span className="text-sm font-semibold text-gray-900">Net Payout</span>
              <span className="text-xl font-bold text-green-600">
                {formatCurrency(totalNetPayout)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            Appointment Breakdown
          </h3>
          <div className="space-y-3">
            {[
              { status: "Confirmed", count: confirmedCount, color: "bg-green-500" },
              { status: "Pending", count: pendingCount, color: "bg-yellow-500" },
              {
                status: "Completed",
                count: allAppointments.filter((a) => a.status === "completed").length,
                color: "bg-blue-500",
              },
              {
                status: "Cancelled",
                count: allAppointments.filter((a) => a.status === "cancelled").length,
                color: "bg-red-500",
              },
            ].map((item) => (
              <div key={item.status} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${item.color}`} />
                <span className="text-sm text-gray-600 flex-1">{item.status}</span>
                <span className="text-sm font-semibold text-gray-900">{item.count}</span>
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${item.color}`}
                    style={{
                      width: `${allAppointments.length > 0 ? (item.count / allAppointments.length) * 100 : 0}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Feedback */}
      {allFeedbacks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Feedback</h3>
          <div className="space-y-3">
            {allFeedbacks.slice(0, 3).map((fb) => (
              <div key={fb.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center gap-2 mb-1">
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: fb.rating ?? 0 }).map((_, i) => (
                      <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400 ml-auto">{fb.createdAt.split("T")[0]}</span>
                </div>
                <p className="text-sm font-medium text-gray-900">{fb.title}</p>
                <p className="text-sm text-gray-500 mt-0.5">{fb.richText}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
