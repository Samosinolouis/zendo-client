"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  getBusinessesByUserId,
  getServicesByBusinessId,
  getFieldsByServiceId,
  getOptionsByFieldId,
} from "@/lib/mock-data";
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, Wrench } from "lucide-react";

export default function OwnerServicesPage() {
  const { user } = useAuth();
  const businesses = user ? getBusinessesByUserId(user.id) : [];
  const [expandedService, setExpandedService] = useState<string | null>(null);
  const [showCreateService, setShowCreateService] = useState(false);
  const [newService, setNewService] = useState({ businessId: "", name: "", description: "" });

  const handleCreateService = () => {
    alert(`[Mock] Would create service: "${newService.name}" for business ${newService.businessId}`);
    setShowCreateService(false);
    setNewService({ businessId: "", name: "", description: "" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Manage Services</h2>
        <button
          onClick={() => setShowCreateService(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Service
        </button>
      </div>

      {businesses.map((biz) => {
        const services = getServicesByBusinessId(biz.id);
        return (
          <div key={biz.id} className="mb-8">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
              {biz.name}
            </h3>
            {services.length === 0 ? (
              <p className="text-sm text-gray-400 italic">No services yet.</p>
            ) : (
              <div className="space-y-3">
                {services.map((service) => {
                  const isExpanded = expandedService === service.id;
                  const fields = getFieldsByServiceId(service.id);

                  return (
                    <div
                      key={service.id}
                      className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                    >
                      <button
                        onClick={() => setExpandedService(isExpanded ? null : service.id)}
                        className="w-full flex items-center gap-3 p-4 text-left hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center shrink-0">
                          <Wrench className="w-5 h-5 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-900">{service.name}</p>
                          <p className="text-sm text-gray-500 truncate">{service.description}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-xs text-gray-400">{fields.length} fields</span>
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-gray-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                      </button>

                      {isExpanded && (
                        <div className="border-t border-gray-100 p-4 bg-gray-50">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-semibold text-gray-700">
                              Appointment Fields
                            </h4>
                            <div className="flex gap-2">
                              <button className="p-1.5 rounded-lg border border-gray-200 hover:bg-white transition-colors">
                                <Pencil className="w-3.5 h-3.5 text-gray-500" />
                              </button>
                              <button className="p-1.5 rounded-lg border border-gray-200 hover:bg-red-50 transition-colors">
                                <Trash2 className="w-3.5 h-3.5 text-red-500" />
                              </button>
                            </div>
                          </div>

                          {fields.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">No fields configured.</p>
                          ) : (
                            <div className="space-y-2">
                              {fields.map((field) => {
                                const options = getOptionsByFieldId(field.id);
                                return (
                                  <div
                                    key={field.id}
                                    className="bg-white rounded-lg border border-gray-100 p-3"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs font-medium rounded">
                                        {field.type}
                                      </span>
                                      <span className="text-sm font-medium text-gray-900">
                                        {field.name}
                                      </span>
                                    </div>
                                    {field.description && (
                                      <p className="text-xs text-gray-400 mt-1">{field.description}</p>
                                    )}
                                    {options.length > 0 && (
                                      <div className="mt-2 flex flex-wrap gap-1.5">
                                        {options.map((opt) => (
                                          <span
                                            key={opt.id}
                                            className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded"
                                          >
                                            {opt.name}
                                            {opt.amount ? ` ($${opt.amount})` : ""}
                                          </span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <button className="mt-3 flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                            <Plus className="w-4 h-4" /> Add Field
                          </button>
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

      {/* Create Service Modal */}
      {showCreateService && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Service</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business</label>
                <select
                  value={newService.businessId}
                  onChange={(e) => setNewService((p) => ({ ...p, businessId: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">Select business...</option>
                  {businesses.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Service Name</label>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. Premium Haircut"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newService.description}
                  onChange={(e) => setNewService((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Describe this service..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateService(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateService}
                disabled={!newService.name.trim() || !newService.businessId}
                className="flex-1 py-2.5 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
