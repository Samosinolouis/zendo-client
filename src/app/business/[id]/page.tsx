"use client";

import { use } from "react";
import Link from "next/link";
import { getBusinessById, getServicesByBusinessId, getUserById, getFeedbacksByServiceId } from "@/lib/mock-data";
import { ArrowRight, Star, ArrowLeft } from "lucide-react";

export default function BusinessProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const business = getBusinessById(id);
  const services = getServicesByBusinessId(id);
  const owner = business ? getUserById(business.userId) : null;

  if (!business) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-gray-900">Business not found</h1>
        <Link href="/explore" className="text-indigo-600 mt-4 inline-block hover:underline">
          Back to Explore
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Banner */}
      <div className="relative h-56 sm:h-72 bg-gray-200">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={business.bannerUrl}
          alt={business.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <Link
            href="/explore"
            className="inline-flex items-center gap-1 text-white/80 text-sm hover:text-white mb-3"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Explore
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">{business.name}</h1>
          {owner && (
            <p className="text-white/80 text-sm mt-1">
              by {owner.firstName} {owner.lastName}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Description */}
        <div className="mb-10">
          <p className="text-gray-600 leading-relaxed max-w-3xl">{business.description}</p>
        </div>

        {/* Services */}
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Services ({services.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => {
              const feedbacks = getFeedbacksByServiceId(service.id);
              const avgRating =
                feedbacks.length > 0
                  ? feedbacks.reduce((sum, f) => sum + (f.rating ?? 0), 0) / feedbacks.length
                  : null;

              return (
                <Link
                  key={service.id}
                  href={`/service/${service.id}`}
                  className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-indigo-200 transition-all"
                >
                  <div className="relative h-40 bg-gray-200 overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={service.bannerUrl}
                      alt={service.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                  <div className="p-5">
                    <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">
                      {service.name}
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 line-clamp-2">{service.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      {avgRating !== null && (
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          {avgRating.toFixed(1)} ({feedbacks.length})
                        </div>
                      )}
                      <span className="text-sm font-medium text-indigo-600 flex items-center gap-1 group-hover:gap-2 transition-all ml-auto">
                        Book <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
