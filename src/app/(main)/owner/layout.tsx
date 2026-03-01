"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import {
  LayoutDashboard,
  Store,
  Wrench,
  CalendarDays,
  DollarSign,
  MessageSquare,
  AlertCircle,
} from "lucide-react";

const ownerNav = [
  { href: "/owner/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/owner/businesses", label: "Businesses", icon: Store },
  { href: "/owner/services", label: "Services", icon: Wrench },
  { href: "/owner/appointments", label: "Appointments", icon: CalendarDays },
  { href: "/owner/payouts", label: "Payouts", icon: DollarSign },
  { href: "/owner/feedbacks", label: "Feedbacks", icon: MessageSquare },
];

export default function OwnerLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoggedIn, isOwner } = useAuth();
  const pathname = usePathname();

  if (!isLoggedIn || !isOwner) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-gray-900">Business Owner Access Required</h1>
        <p className="text-gray-500 mt-2">
          Switch to a business owner account using the user switcher in the navbar.
        </p>
        <p className="text-gray-400 text-sm mt-1">
          Try switching to <strong>Carlos Rivera</strong> or <strong>Aisha Khan</strong>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Sidebar */}
        <aside className="lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-24">
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Business Owner
              </p>
              <p className="text-sm font-medium text-gray-900 mt-1">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <nav className="flex lg:flex-col gap-1 overflow-x-auto">
              {ownerNav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                      active
                        ? "bg-indigo-50 text-indigo-700 font-semibold"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}
                  >
                    <item.icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
