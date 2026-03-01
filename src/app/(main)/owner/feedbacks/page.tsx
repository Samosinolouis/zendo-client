"use client";

import { useAuth } from "@/providers/AuthProvider";
import {
  getBusinessesByUserId,
  getServicesByBusinessId,
  getFeedbacksByServiceId,
  getUserById,
} from "@/lib/mock-data";
import { formatDate } from "@/lib/utils";
import { Star, MessageSquare } from "lucide-react";

export default function OwnerFeedbacksPage() {
  const { user } = useAuth();
  if (!user) return null;

  const businesses = getBusinessesByUserId(user.id);
  const allServices = businesses.flatMap((b) => getServicesByBusinessId(b.id));
  const allFeedbacks = allServices
    .flatMap((s) => {
      const fbs = getFeedbacksByServiceId(s.id);
      return fbs.map((fb) => ({ ...fb, serviceName: s.name }));
    })
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const avgRating =
    allFeedbacks.length > 0
      ? allFeedbacks.reduce((sum, f) => sum + (f.rating ?? 0), 0) / allFeedbacks.length
      : 0;

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Customer Feedback</h2>
        <p className="text-gray-500 mt-1 text-sm">
          {allFeedbacks.length} review{allFeedbacks.length !== 1 ? "s" : ""} across all services
          {avgRating > 0 && ` · Avg rating: ${avgRating.toFixed(1)}/5`}
        </p>
      </div>

      {allFeedbacks.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-xl border border-gray-100">
          <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900">No feedback yet</h3>
          <p className="text-gray-500 mt-1">Reviews from customers will appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {allFeedbacks.map((fb) => {
            const reviewer = getUserById(fb.userId);
            return (
              <div
                key={fb.id}
                className="bg-white rounded-xl border border-gray-200 p-5"
              >
                <div className="flex items-start gap-4">
                  {reviewer?.profilePictureUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={reviewer.profilePictureUrl}
                      alt=""
                      className="w-10 h-10 rounded-full bg-gray-200 shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">
                          {reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : "Anonymous"}
                        </p>
                        <p className="text-xs text-indigo-600">{fb.serviceName}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: fb.rating ?? 0 }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                        <span className="text-xs text-gray-400">{formatDate(fb.createdAt)}</span>
                      </div>
                    </div>
                    <h4 className="font-medium text-gray-900 mt-2">{fb.title}</h4>
                    <p className="text-sm text-gray-500 mt-1">{fb.richText}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
