"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { mockUsers } from "@/lib/mock-data";
import {
  Menu, X, Home, Search, CalendarDays, Bell, LayoutDashboard,
  LogOut, ChevronDown, UserCircle, Settings, FlaskConical, User,
} from "lucide-react";

export default function Navbar() {
  const { user, isLoggedIn, isOwner, logout, switchUser } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [devMenuOpen, setDevMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const devRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setUserMenuOpen(false);
      if (devRef.current && !devRef.current.contains(e.target as Node)) setDevMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const isActive = (path: string) =>
    pathname === path
      ? "text-blue-600 font-semibold bg-blue-50"
      : "text-gray-600 hover:text-blue-600 hover:bg-gray-50";

  const navLinks = [
    { href: "/", label: "Home", icon: Home },
    { href: "/explore", label: "Explore", icon: Search },
  ];

  if (isLoggedIn) {
    navLinks.push({ href: "/appointments", label: "Appointments", icon: CalendarDays });
    navLinks.push({ href: "/notifications", label: "Notifications", icon: Bell });
    if (isOwner) navLinks.push({ href: "/owner/dashboard", label: "Dashboard", icon: LayoutDashboard });
  }

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    router.push("/");
  };

  return (
    <header
      className={`sticky top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "bg-white/90 backdrop-blur-md shadow-sm border-b border-gray-200/80"
          : "bg-white border-b border-gray-200"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <span className="text-lg font-black bg-linear-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent tracking-tighter">ZENDO</span>
          </Link>

          <nav className="hidden md:flex items-center gap-0.5 min-w-0 overflow-hidden">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-all whitespace-nowrap ${isActive(link.href)}`}
              >
                <link.icon className="w-4 h-4 shrink-0" />
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            {/* Dev switcher */}
            <div className="relative" ref={devRef}>
              <button
                onClick={() => setDevMenuOpen(!devMenuOpen)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors border border-gray-200"
                title="Switch demo user"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Demo
                <ChevronDown className="w-3 h-3" />
              </button>
              {devMenuOpen && (
                <div className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50">
                  <p className="px-3 pt-1 pb-2 text-xs text-gray-400 font-semibold uppercase tracking-wide">
                    Switch demo account
                  </p>
                  {mockUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => { switchUser(u.id); setDevMenuOpen(false); }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 transition-colors ${u.id === user?.id ? "bg-blue-50" : ""}`}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u.profilePictureUrl || ""} alt={u.firstName} className="w-7 h-7 rounded-full bg-gray-200 shrink-0" />
                      <div className="text-left">
                        <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                        <p className="text-xs text-gray-400">{u.role === "owner" ? "Business Owner" : "Customer"}</p>
                      </div>
                      {u.id === user?.id && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isLoggedIn && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 pl-1.5 pr-3 py-1.5 rounded-full border border-gray-200 hover:border-blue-200 hover:bg-blue-50/50 transition-all"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={user.profilePictureUrl || ""} alt={user.firstName} className="w-7 h-7 rounded-full bg-gray-200" />
                  <span className="text-sm font-medium text-gray-700">{user.firstName}</span>
                  <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 py-1.5 z-50">
                    <div className="px-4 py-2.5 border-b border-gray-100">
                      <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-400">{user.email}</p>
                      <span className={`inline-flex mt-1.5 items-center px-2 py-0.5 rounded-full text-xs font-medium ${isOwner ? "bg-violet-100 text-violet-700" : "bg-blue-100 text-blue-700"}`}>
                        {isOwner ? "Business Owner" : "Customer"}
                      </span>
                    </div>
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <UserCircle className="w-4 h-4" /> My Profile
                    </Link>
                    {isOwner && (
                      <Link href="/owner/dashboard" onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <LayoutDashboard className="w-4 h-4" /> Owner Dashboard
                      </Link>
                    )}
                    <Link href="/profile" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                      <Settings className="w-4 h-4" /> Settings
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors rounded-b-xl"
                      >
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/login"
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm shadow-blue-500/20"
                >
                  Get started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <nav className="px-4 py-3 space-y-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm transition-colors ${isActive(link.href)}`}
              >
                <link.icon className="w-4 h-4" />
                {link.label}
              </Link>
            ))}

            <div className="border-t border-gray-100 pt-3 mt-2">
              {isLoggedIn && user ? (
                <>
                  <div className="flex items-center gap-3 px-3 py-2 mb-2">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={user.profilePictureUrl || ""} alt="" className="w-9 h-9 rounded-full" />
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-gray-400">{user.role === "owner" ? "Business Owner" : "Customer"}</p>
                    </div>
                  </div>
                  <Link href="/profile" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-50">
                    <User className="w-4 h-4" /> Profile
                  </Link>
                  <button onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50">
                    <LogOut className="w-4 h-4" /> Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link href="/login" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center px-4 py-1.5 rounded-lg text-sm font-medium text-blue-600 border border-blue-200 hover:bg-blue-50">
                    Sign in
                  </Link>
                  <Link href="/register" onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-center px-4 py-1.5 rounded-lg text-sm font-semibold text-white bg-blue-600">
                    Get started free
                  </Link>
                </div>
              )}
            </div>

            <div className="border-t border-gray-100 pt-3 mt-2">
              <p className="px-3 text-xs text-gray-400 font-semibold uppercase tracking-wide mb-2">Demo accounts</p>
              {mockUsers.map((u) => (
                <button
                  key={u.id}
                  onClick={() => { switchUser(u.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-50 ${u.id === user?.id ? "bg-blue-50" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={u.profilePictureUrl || ""} alt={u.firstName} className="w-8 h-8 rounded-full bg-gray-200" />
                  <div className="text-left">
                    <p className="text-sm font-medium text-gray-900">{u.firstName} {u.lastName}</p>
                    <p className="text-xs text-gray-400">{u.role === "owner" ? "Business Owner" : "Customer"}</p>
                  </div>
                </button>
              ))}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
