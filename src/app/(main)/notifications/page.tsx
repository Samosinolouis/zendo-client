"use client";

import { signIn } from "next-auth/react";
import { useAuth } from "@/providers/AuthProvider";
import { useQuery, extractNodes } from "@/graphql/hooks";
import { GET_NOTIFICATIONS } from "@/graphql/queries";
import type { Notification, Connection } from "@/types";
import { formatDateTime } from "@/lib/utils";
import {
  Bell, CalendarDays, CreditCard, Star,
  Megaphone, ArrowRight, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

const typeIcons: Record<string, React.ElementType> = {
  appointment_confirmed: CalendarDays,
  appointment_reminder: CalendarDays,
  payment_received: CreditCard,
  payout_ready: CreditCard,
  feedback_received: Star,
  general: Megaphone,
};

const typeColors: Record<string, { icon: string; bg: string; border: string; dot: string }> = {
  appointment_confirmed: { icon: "text-green-600", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
  appointment_reminder: { icon: "text-primary", bg: "bg-primary/10", border: "border-primary/20", dot: "bg-primary" },
  payment_received: { icon: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-200", dot: "bg-emerald-500" },
  payout_ready: { icon: "text-violet-600", bg: "bg-violet-50", border: "border-violet-200", dot: "bg-violet-500" },
  feedback_received: { icon: "text-amber-600", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
  general: { icon: "text-gray-600", bg: "bg-gray-50", border: "border-gray-200", dot: "bg-gray-400" },
};

function getNotifType(n: Notification): string {
  return (n.payload as Record<string, string>)?.type ?? "general";
}
function getNotifMessage(n: Notification): string {
  return (n.payload as Record<string, string>)?.message ?? "You have a notification.";
}
function isDelivered(n: Notification): boolean {
  return !!n.deliveredAt;
}

export default function NotificationsPage() {
  const { user, isLoggedIn } = useAuth();

  const { data, loading } = useQuery<{ notifications: Connection<Notification> }>(
    GET_NOTIFICATIONS,
    { first: 100, filter: { userId: user?.id } },
    { skip: !user }
  );
  const notifications = extractNodes(data?.notifications);

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
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}
        </div>
      </div>
    );
  }

  // Use deliveredAt as a proxy for "read": recently delivered = unread-ish.
  // We'll show all notifications sorted by date, newer first.
  const sorted = [...notifications].sort(
    (a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime()
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden bg-hero px-4 pb-24 pt-12">
        <div className="absolute top-0 right-0 w-80 h-80 bg-primary/20 rounded-full filter blur-3xl animate-blob pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-primary/15 rounded-full filter blur-3xl animate-blob pointer-events-none" style={{ animationDelay: "2s" }} />

        <div className="max-w-3xl mx-auto text-center">
          <div className="relative inline-flex mb-5 animate-slide-up">
            <div className="w-20 h-20 bg-white/10 border border-white/20 rounded-full flex items-center justify-center">
              <Bell className="w-9 h-9 text-white animate-float" />
            </div>
            {notifications.length > 0 && (
              <Badge className="absolute -top-1 -right-1 bg-red-500 text-white border-2 border-white/20">
                {notifications.length}
              </Badge>
            )}
          </div>

          <h1 className="text-4xl font-extrabold text-white mb-2 animate-slide-up">Notifications</h1>
          <p className="text-white/60 text-lg animate-fade-in">
            {notifications.length > 0 ? (
              <span>
                You have <span className="text-primary-foreground/70 font-semibold">{notifications.length}</span> notification{notifications.length !== 1 ? "s" : ""}
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> You&apos;re all caught up!</span>
            )}
          </p>
        </div>

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 20C1200 60 900 0 720 20C540 40 240 0 0 20L0 60Z" className="fill-background" />
          </svg>
        </div>
      </div>

      {/* Notification list */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-4 pb-16">
        {sorted.length === 0 ? (
          <div className="text-center py-20 animate-scale-in">
            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-5 animate-float">
              <Bell className="w-10 h-10 text-primary/30" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No notifications yet</h3>
            <p className="text-muted-foreground">We&apos;ll let you know when something important happens.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {sorted.map((notif, i) => {
              const type = getNotifType(notif);
              const Icon = typeIcons[type] ?? Megaphone;
              const colors = typeColors[type] ?? typeColors.general;
              const message = getNotifMessage(notif);
              const delivered = isDelivered(notif);

              return (
                <Card
                  key={notif.id}
                  style={{ animationDelay: `${i * 0.04}s` }}
                  className={`animate-slide-up ${delivered ? "opacity-60 hover:opacity-100 transition-opacity" : `border-2 ${colors.bg} ${colors.border} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}`}
                >
                  <CardContent className="p-4 flex items-start gap-4">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${delivered ? colors.bg : "bg-white shadow-sm"}`}>
                      <Icon className={`w-5 h-5 ${colors.icon}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm leading-snug ${delivered ? "text-foreground" : "font-semibold text-foreground"}`}>
                        {message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">{formatDateTime(notif.createdAt ?? "")}</p>
                    </div>
                    {!delivered && (
                      <div className={`w-2.5 h-2.5 ${colors.dot} rounded-full shrink-0 mt-1.5 animate-pulse`} />
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
