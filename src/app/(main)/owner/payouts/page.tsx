"use client";

import { useAuth } from "@/providers/AuthProvider";
import { getBusinessesByUserId, getPayoutsByBusinessId, getBillingsByPayoutId } from "@/lib/mock-data";
import { formatCurrency, formatDate } from "@/lib/utils";
import { DollarSign, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

export default function OwnerPayoutsPage() {
  const { user } = useAuth();
  const businesses = user ? getBusinessesByUserId(user.id) : [];
  const [expandedPayout, setExpandedPayout] = useState<string | null>(null);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Payout Statements</h2>
        <p className="text-gray-500 mt-1 text-sm">
          Review your earnings, fees, and net payouts by period.
        </p>
      </div>

      {businesses.map((biz) => {
        const payouts = getPayoutsByBusinessId(biz.id);
        return (
          <div key={biz.id} className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {biz.name}
            </h3>

            {payouts.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No payout statements yet.</p>
            ) : (
              <div className="space-y-3">
                {payouts.map((payout) => {
                  const isExpanded = expandedPayout === payout.id;
                  const billings = getBillingsByPayoutId(payout.id);
                  return (
                    <div
                      key={payout.id}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedPayout(isExpanded ? null : payout.id)}
                        className="w-full flex items-center gap-4 p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center shrink-0">
                          <DollarSign className="w-5 h-5 text-green-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">
                            {formatDate(payout.periodStart)} — {formatDate(payout.periodEnd)}
                          </p>
                          <p className="text-sm text-gray-500">
                            Net: {formatCurrency(payout.netPayout)}
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-lg font-bold text-green-600">
                            {formatCurrency(payout.netPayout)}
                          </p>
                        </div>
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                        ) : (
                          <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                        )}
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-100 p-4 bg-gray-50 space-y-4">
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            <div>
                              <p className="text-xs text-gray-500">Gross</p>
                              <p className="text-sm font-semibold">{formatCurrency(payout.grossCollection)}</p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Fees</p>
                              <p className="text-sm font-semibold text-red-500">
                                -{formatCurrency(payout.totalFees)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Tax</p>
                              <p className="text-sm font-semibold text-red-500">
                                -{formatCurrency(payout.withholdingTax)}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs text-gray-500">Net Payout</p>
                              <p className="text-sm font-bold text-green-600">
                                {formatCurrency(payout.netPayout)}
                              </p>
                            </div>
                          </div>

                          {billings.length > 0 && (
                            <div>
                              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                                Service Breakdown
                              </h4>
                              <div className="space-y-1.5">
                                {billings.map((billing) => {
                                  const payload = billing.payload as Record<string, unknown>;
                                  return (
                                    <div
                                      key={billing.id}
                                      className="flex items-center justify-between bg-white rounded-lg border border-gray-100 px-3 py-2"
                                    >
                                      <span className="text-sm text-gray-700">
                                        {String(payload.serviceName ?? "—")}
                                      </span>
                                      <div className="text-sm text-gray-500 flex gap-4">
                                        <span>{String(payload.count ?? 0)} bookings</span>
                                        <span className="font-medium text-gray-900">
                                          {formatCurrency(Number(payload.subtotal ?? 0))}
                                        </span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
