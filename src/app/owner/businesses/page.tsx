"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { getBusinessesByUserId, getServicesByBusinessId } from "@/lib/mock-data";
import { Store, Plus, Pencil, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function OwnerBusinessesPage() {
  const { user } = useAuth();
  const businesses = user ? getBusinessesByUserId(user.id) : [];
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBiz, setNewBiz] = useState({ name: "", description: "" });

  const handleCreate = () => {
    // Mock mutation — normally would call GraphQL
    alert(`[Mock] Would create business: "${newBiz.name}"`);
    setShowCreateModal(false);
    setNewBiz({ name: "", description: "" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-900">My Businesses</h2>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus className="w-4 h-4" /> New Business
        </button>
      </div>

      {businesses.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-100">
          <Store className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No businesses yet</h3>
          <p className="text-gray-500 mt-1">Create your first business to get started.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {businesses.map((biz) => {
            const services = getServicesByBusinessId(biz.id);
            return (
              <div key={biz.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="h-32 bg-gray-200 relative">
                  {biz.bannerUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={biz.bannerUrl} alt={biz.name} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900">{biz.name}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{biz.description}</p>
                  <div className="flex items-center justify-between mt-4">
                    <span className="text-xs text-gray-400">
                      {services.length} service{services.length !== 1 ? "s" : ""}
                    </span>
                    <div className="flex gap-2">
                      <button className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                        <Pencil className="w-4 h-4 text-gray-500" />
                      </button>
                      <Link
                        href={`/business/${biz.id}`}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        <ArrowRight className="w-4 h-4 text-gray-500" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Create New Business</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Business Name</label>
                <input
                  type="text"
                  value={newBiz.name}
                  onChange={(e) => setNewBiz((p) => ({ ...p, name: e.target.value }))}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g. My Salon"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newBiz.description}
                  onChange={(e) => setNewBiz((p) => ({ ...p, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  placeholder="Describe your business..."
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!newBiz.name.trim()}
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
