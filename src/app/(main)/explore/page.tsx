"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useQuery, extractNodes } from "@/graphql/hooks";
import { GET_BUSINESSES, GET_SERVICES, GET_TAGS } from "@/graphql/queries";
import type { Business, Service, Tag, Connection } from "@/types";
import {
  Search, ArrowRight, X, Sparkles, Compass, Star, Zap,
  TrendingUp, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function ExplorePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [scrollY, setScrollY] = useState(0);
  const heroRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch tags
  const { data: tagsData } = useQuery<{ tags: Connection<Tag> }>(
    GET_TAGS, { first: 50 }
  );
  const tags = extractNodes(tagsData?.tags);

  // Fetch businesses
  const { data: bizData, loading: bizLoading } = useQuery<{ businesses: Connection<Business> }>(
    GET_BUSINESSES, { first: 50, search: debouncedSearch || undefined }
  );
  const businesses = extractNodes(bizData?.businesses);

  // Fetch services
  const { data: svcData, loading: svcLoading } = useQuery<{ services: Connection<Service> }>(
    GET_SERVICES, { first: 50, search: debouncedSearch || undefined }
  );
  const services = extractNodes(svcData?.services);

  const getBusinessName = (businessId: string) =>
    businesses.find(b => b.id === businessId)?.name ?? "Business";

  const stats = [
    { icon: Building2, label: "Businesses", value: businesses.length, color: "text-primary" },
    { icon: Zap, label: "Services", value: services.length, color: "text-primary/80" },
    { icon: Star, label: "Avg Rating", value: "4.9", color: "text-amber-400" },
    { icon: TrendingUp, label: "Bookings", value: "2.4k+", color: "text-green-400" },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Hero with parallax */}
      <div
        ref={heroRef}
className="relative bg-hero min-h-110 flex flex-col items-center justify-center px-4 pb-24 pt-16"
      style={{ backgroundPositionY: scrollY * 0.4 }}
    >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-10 left-10 w-72 h-72 bg-primary/20 rounded-full filter blur-3xl animate-blob" />
          <div className="absolute bottom-0 right-20 w-80 h-80 bg-primary/15 rounded-full filter blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 rounded-full filter blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
        </div>

        <div className="relative animate-fade-in">
          <Badge variant="secondary" className="bg-white/10 border-white/20 text-white/80 mb-5">
            <Compass className="w-4 h-4 animate-pulse-glow mr-2" />
            Discover amazing services near you
          </Badge>
        </div>

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
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors z-10" />
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search services, businesses…"
              className="w-full pl-14 pr-14 py-6 rounded-2xl text-foreground placeholder:text-gray-500 text-base shadow-2xl bg-white border-0 focus-visible:ring-2 focus-visible:ring-primary"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 z-10 h-8 w-8"
              >
                <X className="w-5 h-5" />
              </Button>
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
        <div className="absolute -bottom-0.5 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path d="M0 60L1440 60L1440 20C1200 60 900 0 720 20C540 40 240 0 0 20L0 60Z" className="fill-background" />
          </svg>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-4 pb-20">
        {/* Category pills */}
        <div className="flex flex-wrap gap-2 mb-10 animate-fade-in">
          <Button
            variant={!selectedTag ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTag(null)}
              className={`rounded-full ${!selectedTag ? "shadow-lg shadow-primary/30 scale-105" : ""}`}
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> All Services
          </Button>
          {tags.map((tag, i) => (
            <Button
              key={tag.id}
              variant={selectedTag === tag.name ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedTag(tag.name === selectedTag ? null : tag.name)}
              style={{ animationDelay: `${i * 0.04}s` }}
              className={`rounded-full animate-scale-in ${selectedTag === tag.name ? "shadow-lg shadow-primary/30 scale-105" : ""}`}
            >
              {tag.name}
            </Button>
          ))}
        </div>

        {/* Featured businesses */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-5">
            <Building2 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Featured Businesses</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {bizLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-36 rounded-2xl" />
              ))
            ) : businesses.length === 0 ? (
              <p className="col-span-full text-sm text-muted-foreground text-center py-8">No businesses found.</p>
            ) : businesses.slice(0, 6).map((biz, i) => (
              <Link
                key={biz.id}
                href={`/business/${biz.id}`}
                style={{ animationDelay: `${i * 0.1}s` }}
                className="group animate-fade-in relative rounded-2xl overflow-hidden h-36 bg-gray-800 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300"
              >
                {biz.bannerImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={biz.bannerImageUrl} alt={biz.name} className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                )}
                <div className="absolute inset-0 bg-linear-to-t from-gray-900/90 via-gray-900/40 to-transparent" />
                <div className="absolute inset-0 p-4 flex flex-col justify-end">
                  <p className="text-white font-bold leading-tight">{biz.name}</p>
                  <p className="text-white/60 text-xs mt-0.5 line-clamp-1">{biz.description}</p>
                  <span className="mt-2 inline-flex items-center gap-1 text-primary-foreground/70 text-xs font-medium group-hover:gap-2 transition-all">
                    View services <ArrowRight className="w-3 h-3" />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Services heading */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {debouncedSearch ? `Results for "${debouncedSearch}"` : "All Services"}
            </h2>
            <Badge variant="secondary" className="bg-primary/10 text-primary">
              {services.length}
            </Badge>
          </div>
        </div>

        {/* Service cards grid */}
        {svcLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden py-0 gap-0">
                <Skeleton className="h-44 w-full rounded-b-none" />
                <CardContent className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4 animate-float">
              <Search className="w-8 h-8 text-primary/40" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No services found</h3>
            <p className="text-muted-foreground mb-5">Try adjusting your search or browse all categories.</p>
            <Button
              onClick={() => { setSearchQuery(""); setSelectedTag(null); }}
              className="shadow-lg shadow-primary/30"
            >
              Clear search
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service, i) => {
              const bizName = getBusinessName(service.businessId);
              return (
                <Link
                  key={service.id}
                  href={`/service/${service.id}`}
                  style={{ animationDelay: `${i * 0.06}s` }}
                  className="group animate-scale-in block"
                >
                  <Card className="overflow-hidden hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 border-border">
                    <div className="relative h-44 bg-muted overflow-hidden">
                      {service.bannerImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={service.bannerImageUrl} alt={service.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                      )}
                      <div className="absolute inset-0 bg-linear-to-t from-black/30 to-transparent" />
                      <Badge className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-primary border-0">
                        {bizName}
                      </Badge>
                    </div>
                    <CardContent className="p-5">
                      <h3 className="text-base font-bold text-foreground group-hover:text-primary transition-colors leading-tight">
                        {service.name}
                      </h3>
                      <p className="mt-1.5 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                        {service.description}
                      </p>
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 rounded-full bg-linear-to-br from-primary to-primary/80 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">Z</span>
                          </div>
                          <span className="text-xs text-muted-foreground">Verified</span>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
                          Book Now <ArrowRight className="w-4 h-4" />
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
