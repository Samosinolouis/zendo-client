"use client";

import { use } from "react";
import Link from "next/link";
import { useQuery, extractNodes } from "@/graphql/hooks";
import { GET_BUSINESS, GET_SERVICES, GET_USER, GET_SERVICE_FEEDBACKS } from "@/graphql/queries";
import type { Business, Service, User as AppUser, ServiceFeedback, Connection } from "@/types";
import { ArrowRight, Star, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

export default function BusinessProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: bizData, loading: bizLoading } = useQuery<{ business: Business }>(
    GET_BUSINESS, { id }
  );
  const business = bizData?.business ?? null;

  const { data: svcData, loading: svcLoading } = useQuery<{ services: Connection<Service> }>(
    GET_SERVICES, { first: 50, filter: { businessId: id } }
  );
  const services = extractNodes(svcData?.services);

  const { data: ownerData } = useQuery<{ user: AppUser }>(
    GET_USER, { id: business?.userId ?? "" }, { skip: !business?.userId }
  );
  const owner = ownerData?.user ?? null;

  // Aggregate feedbacks for all services
  const { data: fbData } = useQuery<{ serviceFeedbacks: Connection<ServiceFeedback> }>(
    GET_SERVICE_FEEDBACKS, { first: 100, filter: { businessId: id } }, { skip: !id }
  );
  const allFeedbacks = extractNodes(fbData?.serviceFeedbacks);

  if (bizLoading || svcLoading) {
    return (
      <div>
        <Skeleton className="h-56 sm:h-72 w-full" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
          <Skeleton className="h-6 w-96" />
          <Skeleton className="h-4 w-full max-w-3xl" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-64 rounded-xl" />)}
          </div>
        </div>
      </div>
    );
  }

  if (!business) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-foreground">Business not found</h1>
        <Button variant="link" asChild className="mt-4">
          <Link href="/explore">Back to Explore</Link>
        </Button>
      </div>
    );
  }

  const getFeedbacksForService = (serviceId: string) =>
    allFeedbacks.filter((f) => f.serviceId === serviceId);

  return (
    <div>
      {/* Banner */}
      <div className="relative h-56 sm:h-72 bg-muted">
        {business.bannerImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={business.bannerImageUrl} alt={business.name} className="w-full h-full object-cover" />
        )}
        <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6">
          <Button variant="ghost" size="sm" asChild className="text-white/80 hover:text-white hover:bg-white/10 mb-3 -ml-2">
            <Link href="/explore">
              <ArrowLeft className="w-4 h-4 mr-1" /> Back to Explore
            </Link>
          </Button>
          <h1 className="text-3xl sm:text-4xl font-bold text-white">{business.name}</h1>
          {owner && (
            <div className="flex items-center gap-2 mt-2">
              <Avatar className="w-6 h-6">
                <AvatarImage src={owner.profilePictureUrl ?? undefined} />
                <AvatarFallback className="text-xs">{getInitials(owner.firstName, owner.lastName)}</AvatarFallback>
              </Avatar>
              <p className="text-white/80 text-sm">
                by {owner.firstName} {owner.lastName}
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Description */}
        <div className="mb-10">
          <p className="text-muted-foreground leading-relaxed max-w-3xl">{business.description}</p>
        </div>

        <Separator className="mb-10" />

        {/* Services */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Services ({services.length})
          </h2>
          {services.length === 0 ? (
            <p className="text-muted-foreground text-sm">No services listed yet.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service) => {
                const feedbacks = getFeedbacksForService(service.id);
                const avgRating =
                  feedbacks.length > 0
                    ? feedbacks.reduce((sum, f) => sum + (f.rating ?? 0), 0) / feedbacks.length
                    : null;

                return (
                  <Link key={service.id} href={`/service/${service.id}`} className="group block">
                    <Card className="overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all">
                      <div className="relative h-40 bg-muted overflow-hidden">
                        {service.bannerImageUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={service.bannerImageUrl} alt={service.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        )}
                      </div>
                      <CardContent className="p-5">
                        <h3 className="font-semibold text-foreground group-hover:text-blue-600 transition-colors">
                          {service.name}
                        </h3>
                        <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{service.description}</p>
                        <div className="mt-4 flex items-center justify-between">
                          {avgRating !== null && (
                            <Badge variant="secondary" className="gap-1">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              {avgRating.toFixed(1)} ({feedbacks.length})
                            </Badge>
                          )}
                          <span className="text-sm font-medium text-blue-600 flex items-center gap-1 group-hover:gap-2 transition-all ml-auto">
                            Book <ArrowRight className="w-4 h-4" />
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
    </div>
  );
}
