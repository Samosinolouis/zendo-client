"use client";

import { useMemo, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, useInfiniteQuery, extractNodes } from "@/graphql/hooks";
import { InfiniteScrollTrigger } from "@/components/ui/infinite-scroll";
import { GET_SERVICES, GET_SERVICE_FEEDBACKS, GET_USER } from "@/graphql/queries";
import type { PageNode } from "@/graphql/page-nodes";
import type { Service, ServiceFeedback, User, Connection } from "@/types";
import { formatDate, getInitials } from "@/lib/utils";
import { NodePreview } from "@/app/(main)/owner/pages/page";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquare } from "lucide-react";

/** Lazy-loads reviewer user info */
function ReviewerRow({ userId, createdAt }: { readonly userId: string; readonly createdAt?: string }) {
  const { data } = useQuery<{ user: User }>(GET_USER, { id: userId });
  const reviewer = data?.user ?? null;

  return (
    <div className="flex items-center gap-3 min-w-0">
      <Avatar className="h-10 w-10">
        <AvatarImage src={reviewer?.profilePictureUrl ?? undefined} />
        <AvatarFallback className="text-sm">
          {reviewer ? getInitials(reviewer.firstName, reviewer.lastName) : "?"}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-foreground truncate">
          {reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : "Anonymous"}
        </p>
        {createdAt && <p className="text-xs text-muted-foreground">{formatDate(createdAt)}</p>}
      </div>
    </div>
  );
}

export default function OwnerFeedbacksPage() {
  const { user, businesses } = useAuth();

  const bizIds = useMemo(() => businesses.map((b) => b.id), [businesses]);

  // Fetch services for name lookup
  const { data: svcData, loading: svcLoading } = useQuery<{ services: Connection<Service> }>(
    GET_SERVICES, { first: 200 }, { skip: !user }
  );
  const allServicesRaw = extractNodes(svcData?.services);
  const ownerServices = useMemo(
    () => allServicesRaw.filter((s) => bizIds.includes(s.businessId)),
    [allServicesRaw, bizIds]
  );
  const svcMap = useMemo(() => {
    const m: Record<string, Service> = {};
    for (const s of ownerServices) m[s.id] = s;
    return m;
  }, [ownerServices]);
  const serviceIds = useMemo(() => ownerServices.map((s) => s.id), [ownerServices]);

  // Fetch feedbacks
  const {
    nodes: fbNodes,
    loading: fbLoading,
    loadingMore: fbLoadingMore,
    hasNextPage: fbHasMore,
    loadMore: fbLoadMore,
  } = useInfiniteQuery<ServiceFeedback, { serviceFeedbacks: Connection<ServiceFeedback> }>(
    GET_SERVICE_FEEDBACKS,
    { first: 20 },
    (data) => data.serviceFeedbacks,
    { skip: serviceIds.length === 0 }
  );
  const handleFbLoadMore = useCallback(() => fbLoadMore(), [fbLoadMore]);
  const isPageLoading = svcLoading || (serviceIds.length > 0 && fbLoading);

  const allFeedbacks = useMemo(
    () => fbNodes.filter((f) => serviceIds.includes(f.serviceId)),
    [fbNodes, serviceIds]
  );

  if (!user) return null;

  const avgRating =
    allFeedbacks.length > 0
      ? (allFeedbacks.reduce((s, f) => s + (f.rating ?? 0), 0) / allFeedbacks.length).toFixed(1)
      : "—";

  let feedbackContent: React.ReactNode;
  if (isPageLoading) {
    feedbackContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {["feedback-skel-1", "feedback-skel-2", "feedback-skel-3", "feedback-skel-4"].map((key) => (
          <Skeleton key={key} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  } else if (allFeedbacks.length === 0) {
    feedbackContent = (
      <Card className="border-0 shadow-sm">
        <CardContent className="flex flex-col items-center justify-center py-16 text-center">
          <MessageSquare className="w-12 h-12 text-muted-foreground/40 mb-4" />
          <p className="text-lg font-medium text-foreground mb-1">No feedback yet</p>
          <p className="text-sm text-muted-foreground">Customer reviews will appear here.</p>
        </CardContent>
      </Card>
    );
  } else {
    feedbackContent = (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {allFeedbacks.map((fb) => {
          const svc = svcMap[fb.serviceId];
          const payload = fb.payload as Record<string, unknown> | null;
          const title = (payload as { title?: string } | null)?.title;
          const body = (payload as { body?: string } | null)?.body;

          return (
            <Card key={fb.id} className="border-0 shadow-sm">
              <CardContent className="p-5 space-y-4">
                {/* Reviewer row */}
                <div className="flex items-center justify-between gap-3">
                  <ReviewerRow userId={fb.userId} createdAt={fb.createdAt} />
                  <div className="flex items-center gap-0.5 shrink-0">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star
                        key={n}
                        className={`w-4 h-4 ${
                          n <= (fb.rating ?? 0)
                            ? "text-amber-400 fill-amber-400"
                            : "text-muted-foreground/30"
                        }`}
                      />
                    ))}
                  </div>
                </div>

                {/* Service badge */}
                {svc && (
                  <Badge variant="secondary" className="text-xs">
                    {svc.name}
                  </Badge>
                )}

                {/* Content */}
                {payload?.type === "doc" && Array.isArray(payload.content) ? (
                  <div className="space-y-2">
                    {(payload.content as PageNode[]).map((node) => (
                      <NodePreview key={node.id} node={node} />
                    ))}
                  </div>
                ) : (
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">{title ?? "Untitled"}</h4>
                    {body && <p className="text-sm text-muted-foreground mt-1 line-clamp-3">{body}</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        {fbLoadingMore && [0, 1].map((n) => (
          <Skeleton key={`fb-skel-${n}`} className="h-48 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Feedback</h1>
          <p className="text-muted-foreground mt-1">Customer reviews across all your services</p>
        </div>
        {allFeedbacks.length > 0 && (
          <Card className="border-0 shadow-sm">
            <CardContent className="flex items-center gap-3 p-4">
              <div className="flex items-center gap-1">
                <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                <span className="text-xl font-bold text-foreground">{avgRating}</span>
              </div>
              <Separator orientation="vertical" className="h-6" />
              <div className="text-sm text-muted-foreground">
                {allFeedbacks.length} review{allFeedbacks.length !== 1 && "s"}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Feedback list */}
      {feedbackContent}
      <InfiniteScrollTrigger onVisible={handleFbLoadMore} disabled={!fbHasMore || fbLoadingMore} />
    </div>
  );
}
