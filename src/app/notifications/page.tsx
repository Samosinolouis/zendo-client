"use client";

import { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { getNotificationsByUserId } from "@/lib/mock-data";
import { formatDateTime } from "@/lib/utils";
import { Bell, CheckCheck, CalendarDays, CreditCard, Star, Megaphone, ArrowRight, Sparkles } from "lucide-react";

const typeIcons: Record<string, React.ElementType> = {
  appointment_confirmed: CalendarDays,
  appointment_reminder: CalendarDays,
  payment_received: CreditCard,
  payout_ready: CreditCard,
  feedback_received: Star,
  general: Megaphone,
};

const typeColors: Record<string, { icon: string; bg: string; border: string; dot: string }> = {
  appointment_confirmed: { icon: "text-green-600", bg: "bg-green-50", border: "border-green-100", dot: "bg-green-500" },
  appointment_reminder: { icon: "text-blue-600", bg: "bg-blue-50", border: "border-blue-100", dot: "bg-blue-500" },
  payment_received: { icon: "text-emerald-600", bg: "bg-emerald-50", border: "border-emerald-100", dot: "bg-emerald-500" },
  payout_ready: { icon: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100", dot: "bg-violet-500" },
  feedback_received: { icon: "text-amber-600", bg: "bg-amber-50", border: "border-amber-100", dot: "bg-amber-500" },
  general: { icon: "text-gray-600", bg: "bg-gray-50", border: "border-gray-100", dot: "bg-gray-400" },
};

export default function NotificationsPage() {
  const { user, isLoggedIn } = useAuth();
  const allNotifications = user ? getNotificationsByUserId(user.id) : [];
  const [notifications, setNotifications] = useState(allNotifications);

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-hero flex items-center justify-center px-4">
        <div className="text-center animate-scale-in">
          <div className="w-24 h-24 bg-white/10 border border-white/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-float">
            <Bell className="w-10 h-10 text-white/70" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">Notifications</h1>
          <p className="text-white/60 mb-8 text-lg">Sign in to see your notifications.</p>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-semibold rounded-xl hover:shadow-lg hover:shadow-white/20 transition-all hover:-translate-y-0.5"
          >
            Sign in <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  return (
    <div className="min-h-screen bg-[#f8faff]">
      {/* ── Hero ── */}
      <div className="relative overflow-hidden bg-hero px-4 pb-24 pt-12">
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/20 rounded-full filter blur-3xl animate-blob pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-cyan-400/15 rounded-full filter blur-3xl animate-blob pointer-events-none" style={{ animationDelay: "2s" }} />

        <div className="max-w-3xl mx-auto text-center">
          {/* Animated bell */}
          <div className="relative inline-flex mb-5 animate-slide-up">
            <div className="w-20 h-20 bg-white/10 border border-white/20 rounded-full flex items-center justify-center">
              <Bell className="w-9 h-9 text-white animate-float" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold animate-pulse-glow border-2 border-white/20">
                {unreadCount}
              </span>
            )}
          </div>

          <h1 className="text-4xl font-extrabold text-white mb-2 animate-slide-up">
            Notifications
          </h1>
          <p className="text-white/60 text-lg animate-fade-in">
            {unreadCount > 0
              ? <span>You have <span className="text-blue-300 font-semibold">{unreadCount} unread</span> notification{unreadCount !== 1 ? "s" : ""}</span>
              : <span className="flex items-center justify-center gap-2"><Sparkles className="w-4 h-4" /> You&apos;re all caught up!</span>
            }
          </p>

          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-white/10 border border-white/20 text-white rounded-xl text-sm font-semibold hover:bg-white/20 transition-all animate-fade-in"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all as read
            </button>
          )}
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60L1440 60L1440 20C1200 60 900 0 720 20C540 40 240 0 0 20L0 60Z" fill="#f8faff" />
          </svg>
        </div>
      </div>

      {/* Notification list */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6 -mt-4 pb-16">
        {notifications.length === 0 ? (
          <div className="text-center py-20 animate-scale-in">
            <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-5 animate-float">
              <Bell className="w-10 h-10 text-blue-200" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">No notifications yet</h3>
            <p className="text-gray-500">We&apos;ll let you know when something important happens.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Unread section */}
            {notifications.some((n) => !n.read) && (
              <div className="mb-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">Unread</p>
                <div className="space-y-2">
                  {notifications
                    .filter((n) => !n.read)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((notif, i) => {
                      const Icon = typeIcons[notif.type] ?? Megaphone;
                      const colors = typeColors[notif.type] ?? typeColors.general;
                      const message = (notif.payload as Record<string, string>)?.message ?? "You have a notification.";
                      return (
                        <button
                          key={notif.id}
                          onClick={() => markRead(notif.id)}
                          style={{ animationDelay: `${i * 0.06}s` }}
                          className={`w-full text-left animate-slide-up flex items-start gap-4 p-4 rounded-2xl border-2 ${colors.bg} ${colors.border} hover:shadow-md hover:-translate-y-0.5 transition-all duration-200`}
                        >
                          {/* Icon */}
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 bg-white shadow-sm`}>
                            <Icon className={`w-5 h-5 ${colors.icon}`} />
                          </div>
                          {/* Text */}
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-sm font-semibold text-gray-900 leading-snug">{message}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatDateTime(notif.createdAt)}</p>
                          </div>
                          {/* Unread dot */}
                          <div className={`w-2.5 h-2.5 ${colors.dot} rounded-full shrink-0 mt-1.5 animate-pulse`} />
                        </button>
                      );
                    })}
                </div>
              </div>
            )}

            {/* Read section */}
            {notifications.some((n) => n.read) && (
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1 mt-6">Earlier</p>
                <div className="space-y-2">
                  {notifications
                    .filter((n) => n.read)
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((notif, i) => {
                      const Icon = typeIcons[notif.type] ?? Megaphone;
                      const colors = typeColors[notif.type] ?? typeColors.general;
                      const message = (notif.payload as Record<string, string>)?.message ?? "You have a notification.";
                      return (
                        <div
                          key={notif.id}
                          style={{ animationDelay: `${i * 0.04}s` }}
                          className="animate-fade-in flex items-start gap-4 p-4 rounded-2xl bg-white border border-gray-100 opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${colors.bg}`}>
                            <Icon className={`w-4.5 h-4.5 ${colors.icon}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-gray-700 leading-snug">{message}</p>
                            <p className="text-xs text-gray-400 mt-1">{formatDateTime(notif.createdAt)}</p>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

