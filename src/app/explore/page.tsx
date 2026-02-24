"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { mockBusinesses, mockServices, mockServiceTags } from "@/lib/mock-data";
import { Search, ArrowRight, X, Sparkles, Compass, Star, Zap, TrendingUp, Building2 } from "lucide-react";

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredServices = mockServices.filter((service) => {
    const matchSearch =
      !searchQuery ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.description.toLowerCase().includes(searchQuery.toLowerCase());
    const business = mockBusinesses.find((b) => b.id === service.businessId);
    const matchBusiness =
      !searchQuery || business?.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchSearch || matchBusiness;
  });

  const stats = [
    { icon: Building2, label: "Businesses", value: mockBusinesses.length, color: "text-blue-400" },
    { icon: Zap, label: "Services", value: mockServices.length, color: "text-cyan-400" },
    { icon: Star, label: "Avg Rating", value: "4.9", color: "text-amber-400" },
    { icon: TrendingUp, label: "Bookings", value: "2.4k+", color: "text-green-400" },
  ];

  return (
    <div className="min-h-screen bg-[#f8faff]">
      {/* ── Hero with parallax ── */}
      <div
        ref={heroRef}
        className="relative overflow-hidden bg-hero min-h-110 flex flex-col items-center justify-center px-4 pb-24 pt-16"
        style={{ backgroundPositionY: scrollY * 0.4 }}
      >
        {/* Animated blobs */}
        <div className="absolute top-10 left-10 w-72 h-72 bg-blue-500/20 rounded-full filter blur-3xl animate-blob pointer-events-none" />
        <div className="absolute bottom-0 right-20 w-80 h-80 bg-cyan-500/15 rounded-full filter blur-3xl animate-blob pointer-events-none" style={{ animationDelay: "2s" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/10 rounded-full filter blur-3xl animate-blob pointer-events-none" style={{ animationDelay: "4s" }} />

        {/* Badge */}
        <div className="relative animate-fade-in">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-sm font-medium mb-5">
            <Compass className="w-4 h-4 animate-pulse-glow" />
            Discover amazing services near you
          </span>
        </div>

        {/* Title */}
        <h1 className="relative text-4xl md:text-6xl font-extrabold text-white text-center mb-4 animate-slide-up leading-tight">
          Find Your Perfect
          <br />
          <span className="gradient-text-blue">Service Match</span>
        </h1>
        <p className="relative text-white/60 text-lg text-center mb-8 animate-fade-in max-w-md">
          Browse hundreds of top-rated services from trusted local businesses.
        </p>

        {/* Floating search bar */}
        <div className="relative w-full max-w-2xl animate-slide-up z-10" style={{ animationDelay: "0.2s" }}>
          <div className="relative group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors z-10" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services, businesses…"
              className="w-full pl-14 pr-14 py-4 rounded-2xl text-gray-900 placeholder-gray-400 text-base focus:outline-none focus:ring-2 focus:ring-blue-400 shadow-2xl bg-white"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div className="relative flex items-center gap-8 mt-8 animate-fade-in" style={{ animationDelay: "0.4s" }}>
          {stats.map((s) => (
            <div key={s.label} className="text-center hidden sm:block">
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-white/50 text-xs">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Wave bottom */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 20C1200 60 900 0 720 20C540 40 240 0 0 20L0 60Z" fill="#f8faff" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">

        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-10 animate-fade-in">
          <button
            onClick={() => setSelectedTag(null)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              !selectedTag
                ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:shadow-md"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" /> All Services
          </button>
          {mockServiceTags.map((tag, i) => (
            <button
              key={tag.id}
              onClick={() => setSelectedTag(tag.name === selectedTag ? null : tag.name)}
              style={{ animationDelay: `${i * 0.04}s` }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 animate-scale-in ${
                selectedTag === tag.name
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-600 hover:shadow-md"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>

        {/* Featured businesses */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">Featured Businesses</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {mockBusinesses.map((biz, i) => (
              <Link
                key={biz.id}
                href={`/business/${biz.id}`}
                style={{ animationDelay: `${i * 0.1}s` }}
                className="group animate-fade-in relative rounded-2xl overflow-hidden h-36 bg-gray-800 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300"
              >
                {biz.bannerUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={biz.bannerUrl}
                    alt={biz.name}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <p className="text-white font-bold leading-tight">{biz.name}</p>
                  <p className="text-white/60 text-xs mt-0.5 line-clamp-1">{biz.description}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-blue-300 text-xs font-medium group-hover:gap-2 transition-all">
                    View services <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
                <div className="absolute top-3 right-3 bg-white/15 backdrop-blur-sm rounded-full px-2 py-0.5 border border-white/20">
                  <span className="text-white text-xs font-medium flex items-center gap-1">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" /> 4.9
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Services heading */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-gray-900">
              {searchQuery ? `Results for "${searchQuery}"` : "All Services"}
            </h2>
            <span className="ml-1 px-2.5 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
              {filteredServices.length}
            </span>
          </div>
        </div>

        {/* Service cards grid */}
        {filteredServices.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
              <Search className="w-8 h-8 text-blue-300" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No services found</h3>
            <p className="text-gray-500 mb-5">Try adjusting your search or browse all categories.</p>
            <button
              onClick={() => { setSearchQuery(""); setSelectedTag(null); }}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-500/30"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredServices.map((service, i) => {
              const business = mockBusinesses.find((b) => b.id === service.businessId);
              return (
                <Link
                  key={service.id}
                  href={`/service/${service.id}`}
                  style={{ animationDelay: `${i * 0.06}s` }}
                  className="group animate-scale-in block bg-white rounded-2xl overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border border-gray-100"
                >
                  {/* Image */}
                  <div className="relative h-44 bg-gray-200 overflow-hidden">
                    {service.bannerUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={service.bannerUrl}
                        alt={service.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    )}
                    <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
                    {/* Business chip */}
                    <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-lg px-2.5 py-1">
                      <p className="text-xs font-semibold text-blue-700 truncate max-w-35">{business?.name}</p>
                    </div>
                    {/* Stars */}
                    <div className="absolute top-3 right-3 flex items-center gap-1 bg-white/90 backdrop-blur-sm rounded-lg px-2 py-1">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs font-semibold text-gray-800">4.9</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-blue-600 transition-colors leading-tight">
                      {service.name}
                    </h3>
                    <p className="mt-1.5 text-sm text-gray-500 line-clamp-2 leading-relaxed">{service.description}</p>

                    {/* CTA row */}
                    <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-4">
                      <div className="flex items-center gap-1.5">
                        <div className="w-5 h-5 rounded-full bg-linear-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                          <span className="text-white text-xs font-bold">Z</span>
                        </div>
                        <span className="text-xs text-gray-400">Verified</span>
                      </div>
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-blue-600 group-hover:gap-2 transition-all">
                        Book Now <ArrowRight className="w-4 h-4" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
