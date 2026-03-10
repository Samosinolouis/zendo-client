"use client";

import { useCallback } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useAuth } from "@/providers/AuthProvider";
import { useInfiniteQuery } from "@/graphql/hooks";
import { GET_NOTIFICATIONS } from "@/graphql/queries";
import type { Notification, Connection } from "@/types";
import { InfiniteScrollTrigger } from "@/components/ui/infinite-scroll";
import { formatDateTime, formatCurrency } from "@/lib/utils";
import {
  Bell, CalendarDays, CalendarCheck, CalendarX, CreditCard,
  CheckCircle2, XCircle, Megaphone, ArrowRight, Sparkles, ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

// ── Payload type ──────────────────────────────────────────────
interface NotifPayload {
  event: string;
  subject: string;
  message: string;
  appointmentId?: string;
  serviceId?: string;
  amount?: number;
  currency?: string;
  completedProofUrl?: string;
}

function parsePayload(n: Notification): NotifPayload {
  const p = n.payload;
  return {
    event:             typeof p.event === "string"   ? p.event   : "GENERAL",
    subject:           typeof p.subject === "string" ? p.subject : "",
    message:           typeof p.message === "string" ? p.message : "You have a notification.",
    appointmentId:     typeof p.appointmentId === "string" ? p.appointmentId : undefined,
    serviceId:         typeof p.serviceId === "string"     ? p.serviceId     : undefined,
    amount:            typeof p.amount === "number"        ? p.amount        : undefined,
    currency:          typeof p.currency === "string"      ? p.currency      : undefined,
    completedProofUrl: typeof p.completedProofUrl === "string" ? p.completedProofUrl : undefined,
  };
}

// ── Event → icon / colour mapping ────────────────────────────
const EVENT_ICON: Record<string, React.ElementType> = {
  APPOINTMENT_CREATED:              CalendarDays,
  APPOINTMENT_PAID:                 CreditCard,
  APPOINTMENT_APPROVED:             CalendarCheck,
  APPOINTMENT_REJECTED:             CalendarX,
  APPOINTMENT_CANCELLED:            XCircle,
  APPOINTMENT_COMPLETED:            CheckCircle2,
  APPOINTMENT_COMPLETION_REQUESTED: CalendarCheck,
  GENERAL:                          Megaphone,
};

const EVENT_COLORS: Record<string, { icon: string; bg: string; leftBorder: string; dot: string }> = {
  APPOINTMENT_CREATED:              { icon: "text-blue-600",    bg: "bg-blue-50",    leftBorder: "border-l-blue-500",    dot: "bg-blue-500"    },
  APPOINTMENT_PAID:                 { icon: "text-emerald-600", bg: "bg-emerald-50", leftBorder: "border-l-emerald-500", dot: "bg-emerald-500"  },
  APPOINTMENT_APPROVED:             { icon: "text-green-600",   bg: "bg-green-50",   leftBorder: "border-l-green-500",   dot: "bg-green-500"   },
  APPOINTMENT_REJECTED:             { icon: "text-red-600",     bg: "bg-red-50",     leftBorder: "border-l-red-500",     dot: "bg-red-500"     },
  APPOINTMENT_CANCELLED:            { icon: "text-gray-500",    bg: "bg-gray-100",   leftBorder: "border-l-gray-400",    dot: "bg-gray-400"    },
  APPOINTMENT_COMPLETED:            { icon: "text-purple-600",  bg: "bg-purple-50",  leftBorder: "border-l-purple-500",  dot: "bg-purple-500"  },
  APPOINTMENT_COMPLETION_REQUESTED: { icon: "text-orange-600",  bg: "bg-orange-50",  leftBorder: "border-l-orange-500",  dot: "bg-orange-500"  },
  GENERAL:                          { icon: "text-gray-600",    bg: "bg-gray-50",    leftBorder: "border-l-gray-400",    dot: "bg-gray-400"    },
};

function getColors(event: string) {
  return EVENT_COLORS[event] ?? EVENT_COLORS.GENERAL;
}
function getIcon(event: string): React.ElementType {
  return EVENT_ICON[event] ?? Megaphone;
}
function isDelivered(n: Notification): boolean {
  return !!n.deliveredAt;
}

export default function NotificationsPage() {
  const { user, isLoggedIn } = useAuth();

  const {
    nodes: notifications,
    loading,
    loadingMore,
    hasNextPage,
    loadMore,
  } = useInfiniteQuery<Notification, { notifications: Connection<Notification> }>(
    GET_NOTIFICATIONS,
    { first: 20, filter: { userId: user?.id }, sort: { field: "CREATED_AT_DESC" } },
    (data) => data.notifications,
    { skip: !user }
  );

  const handleLoadMore = useCallback(() => loadMore(), [loadMore]);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-hero flex items-center justify-center px-4">
        <div className="text-center animate-scale-in">
          <div className="w-24 h-24 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
            <Bell className="w-10 h-10 text-white/70" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Notifications</h1>
          <p className="text-white/60 mb-8 text-lg">Sign in to see your notifications.</p>
          <Button
            onClick={() => signIn("keycloak", { callbackUrl: "/onboarding" })}
            variant="secondary"
            size="lg"
          >
            Sign in <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="bg-hero px-4 pb-24 pt-12"><div className="max-w-3xl mx-auto text-center"><Skeleton className="h-20 w-20 rounded-full mx-auto bg-white/10" /></div></div>
        <div className="max-w-3xl mx-auto px-4 -mt-4 pb-16 space-y-3">
          {[1, 2, 3, 4, 5].map((n) => <Skeleton key={n} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Sort is handled server-side via CREATED_AT_DESC
  const unreadCount = notifications.filter((n) => !n.deliveredAt).length;
  function heroSubtitle() {
    if (unreadCount > 0) {
      return (
        <span>
          You have{" "}
          <span className="text-primary-foreground/70 font-semibold">{unreadCount}</span>{" "}
          unread notification{unreadCount === 1 ? "" : "s"}
        </span>
      );
    }
    if (notifications.length > 0) {
      return <span className="flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> You&apos;re all caught up!</span>;
    }
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative bg-hero px-4 pb-24 pt-12">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full filter blur-3xl animate-blob" />
          <div className="absolute bottom-0 left-0 w-60 h-60 bg-primary/15 rounded-full filter blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
        </div>

        <div className="max-w-3xl mx-auto text-center">
          <div className="relative inline-flex mb-5 animate-slide-up">
            <div className="w-20 h-20 bg-white/10 border border-white/20 rounded-full flex items-center justify-center">
              <Bell className="w-9 h-9 text-white animate-float" />
            </div>
            {unreadCount > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white border-2 border-white/20">
                {unreadCount}
              </Badge>
            )}
          </div>

          <h1 className="text-4xl font-extrabold text-white mb-2 animate-slide-up">Notifications</h1>
          <p className="text-white/60 text-lg animate-fade-in">
            {heroSubtitle()}
          </p>
        </div>

        <div className="absolute -bottom-0.5 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block">
            <path d="M0 60L1440 60L1440 20C1200 60 900 0 720 20C540 40 240 0 0 20L0 60Z" className="fill-background" />
          </svg>
        </div>
      </div>

      {/* Notification list */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-4 pb-16">
        {notifications.length === 0 ? (
          <div className="text-center py-20 animate-scale-in">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5 animate-float">
              <Bell className="w-10 h-10 text-primary/30" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">We&apos;ll let you know when something important happens.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notif, i) => {
              const payload  = parsePayload(notif);
              const Icon     = getIcon(payload.event);
              const colors   = getColors(payload.event);
              const delivered = isDelivered(notif);
              const isCompletionRequest = payload.event === "APPOINTMENT_COMPLETION_REQUESTED";

              return (
                <Card
                  key={notif.id}
                  style={{ animationDelay: `${i * 0.04}s` }}
                  className={`animate-slide-up border-l-4 transition-all duration-200 hover:shadow-sm hover:-translate-y-0.5 ${
                    delivered ? "border-l-transparent" : colors.leftBorder
                  }`}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    {/* Icon */}
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${colors.bg}`}>
                      <Icon className={`w-4 h-4 ${colors.icon}`} />
                    </div>

                    {/* Body */}
                    <div className="flex-1 min-w-0 space-y-1">
                      {/* Header row: subject + timestamp */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {payload.subject && (
                            <span className={`text-xs font-semibold ${colors.icon}`}>
                              {payload.subject}
                            </span>
                          )}
                          {!delivered && (
                            <span className={`w-1.5 h-1.5 ${colors.dot} rounded-full`} />
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {formatDateTime(notif.createdAt ?? "")}
                        </span>
                      </div>

                      {/* Message */}
                      <p className={`text-sm leading-snug ${
                        delivered ? "text-muted-foreground" : "text-foreground"
                      }`}>
                        {payload.message}
                      </p>

                      {/* Amount */}
                      {payload.amount !== undefined && payload.currency && (
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(payload.amount, payload.currency)}
                        </p>
                      )}

                      {/* Completion proof */}
                      {isCompletionRequest && payload.completedProofUrl && (
                        <>
                          <Separator className="my-1.5" />
                          <div className="flex items-center justify-between gap-3">
                            <a
                              href={payload.completedProofUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2"
                            >
                              <ExternalLink className="w-3 h-3" /> View business proof
                            </a>
                            {payload.appointmentId && (
                              <Button size="sm" variant="outline" asChild
                                className="h-7 px-3 text-xs text-orange-700 border-orange-300 hover:bg-orange-50">
                                <Link href="/appointments">
                                  Confirm now <ArrowRight className="w-3 h-3 ml-1" />
                                </Link>
                              </Button>
                            )}
                          </div>
                        </>
                      )}

                      {/* Appointment deep-link */}
                      {payload.appointmentId && !isCompletionRequest && (
                        <Link
                          href="/appointments"
                          className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors pt-0.5"
                        >
                          View appointment <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {/* Loading more skeleton */}
            {loadingMore && (
              <>
                {[1, 2, 3].map((n) => (
                  <Skeleton key={n} className="h-20 rounded-xl" />
                ))}
              </>
            )}

            <InfiniteScrollTrigger onVisible={handleLoadMore} disabled={!hasNextPage || loadingMore} />
          </div>
        )}
      </div>
    </div>
  );
}
