"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import {
  LayoutDashboard, Store, Wrench, CalendarDays, DollarSign, MessageSquare, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";

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
        <AlertCircle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-foreground">Business Owner Access Required</h1>
        <p className="text-muted-foreground mt-2">
          You need a business owner account to access this area.
        </p>
        <p className="text-muted-foreground/60 text-sm mt-1">
          Register as a business owner or create a business from your profile.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-24">
            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Business Owner
              </p>
              <p className="text-sm font-medium text-foreground mt-1">
                {user?.firstName} {user?.lastName}
              </p>
            </div>
            <nav className="flex lg:flex-col gap-1 overflow-x-auto">
              {ownerNav.map((item) => {
                const active = pathname === item.href;
                return (
                  <Button
                    key={item.href}
                    variant={active ? "secondary" : "ghost"}
                    size="sm"
                    asChild
                    className={`justify-start gap-2 whitespace-nowrap ${active ? "font-semibold" : ""}`}
                  >
                    <Link href={item.href}>
                      <item.icon className="w-4 h-4 shrink-0" />
                      {item.label}
                    </Link>
                  </Button>
                );
              })}
            </nav>
          </div>
        </aside>
        <div className="flex-1 min-w-0">{children}</div>
      </div>
    </div>
  );
}
