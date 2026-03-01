"use client";

import { useAuth } from "@/providers/AuthProvider";
import {
  getBusinessesByUserId,
  getServicesByBusinessId,
  getAppointmentsByServiceId,
  getServiceById,
  getUserById,
} from "@/lib/mock-data";
import { formatCurrency, formatDateTime, getStatusColor } from "@/lib/utils";
import { CalendarDays } from "lucide-react";

export default function OwnerAppointmentsPage() {
  const { user } = useAuth();
  if (!user) return null;

  const businesses = getBusinessesByUserId(user.id);
  const allServices = businesses.flatMap((b) => getServicesByBusinessId(b.id));
  const allAppointments = allServices
    .flatMap((s) => getAppointmentsByServiceId(s.id))
    .sort((a, b) => {
      if (!a.scheduledAt || !b.scheduledAt) return 0;
      return new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime();
    });

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">All Appointments</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Appointments across all your businesses and services.
        </p>
      </div>

      {allAppointments.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-100">
          <CalendarDays className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No appointments yet</h3>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="py-3 text-left font-medium text-gray-500">Service</th>
                <th className="py-3 text-left font-medium text-gray-500">Customer</th>
                <th className="py-3 text-left font-medium text-gray-500">Date</th>
                <th className="py-3 text-left font-medium text-gray-500">Amount</th>
                <th className="py-3 text-left font-medium text-gray-500">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {allAppointments.map((apt) => {
                const service = getServiceById(apt.serviceId);
                const customer = apt.userId ? getUserById(apt.userId) : null;
                return (
                  <tr key={apt.id} className="hover:bg-gray-50">
                    <td className="py-3">
                      <p className="font-medium text-gray-900">{service?.name ?? "—"}</p>
                    </td>
                    <td className="py-3 text-gray-600">
                      {customer ? `${customer.firstName} ${customer.lastName}` : "—"}
                    </td>
                    <td className="py-3 text-gray-600">
                      {apt.scheduledAt ? formatDateTime(apt.scheduledAt) : "—"}
                    </td>
                    <td className="py-3 font-medium text-gray-900">
                      {formatCurrency(apt.amount, apt.currency)}
                    </td>
                    <td className="py-3">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(apt.status)}`}
                      >
                        {apt.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
