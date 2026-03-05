"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useAuth } from "@/providers/AuthProvider";
import {
  Menu, Home, Search, CalendarDays, Bell, LayoutDashboard,
  LogOut, ChevronDown, UserCircle, Settings, User,
} from "lucide-react";
import { cn, getInitials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Navbar() {
  const { user, isLoggedIn, isOwner, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

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
    setMobileOpen(false);
    router.push("/");
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-50 transition-all duration-300 border-b bg-background/95 backdrop-blur-md supports-backdrop-filter:bg-background/60",
        scrolled && "shadow-sm"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <span className="text-lg font-black tracking-tighter gradient-text-blue">
              ZENDO
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const active = pathname === link.href;
              return (
                <Button
                  key={link.href}
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  asChild
                >
                  <Link href={link.href} className="gap-1.5">
                    <link.icon className="size-4" />
                    {link.label}
                  </Link>
                </Button>
              );
            })}
          </nav>

          {/* Desktop right */}
          <div className="hidden md:flex items-center gap-2">
            {isLoggedIn && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2 pl-1.5 pr-3 rounded-full border">
                    <Avatar className="size-7">
                      <AvatarImage src={user.profilePictureUrl ?? undefined} alt={user.firstName} />
                      <AvatarFallback className="text-xs">{getInitials(user?.firstName, user?.lastName)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium">{user.firstName}</span>
                    <ChevronDown className="size-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col gap-1">
                      <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                      <Badge variant="secondary" className="w-fit mt-1 text-xs">
                        {isOwner ? "Business Owner" : "Customer"}
                      </Badge>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/profile"><UserCircle className="size-4 mr-2" /> My Profile</Link>
                  </DropdownMenuItem>
                  {isOwner && (
                    <DropdownMenuItem asChild className="cursor-pointer">
                      <Link href="/owner/dashboard"><LayoutDashboard className="size-4 mr-2" /> Owner Dashboard</Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild className="cursor-pointer">
                    <Link href="/settings"><Settings className="size-4 mr-2" /> Settings</Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                    <LogOut className="size-4 mr-2" /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => signIn("keycloak", { callbackUrl: "/onboarding" })}
                  className="px-4 py-1.5 text-sm font-medium text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Sign in
                </button>
                <button
                  onClick={() => signIn("keycloak", { callbackUrl: "/onboarding" })}
                  className="px-4 py-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors shadow-sm shadow-blue-500/20"
                >
                  Get started
                </button>
              </div>
            )}
          </div>

          {/* Mobile menu */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 p-0">
              <SheetHeader className="px-4 pt-4 pb-2">
                <SheetTitle className="text-left text-lg font-black tracking-tighter gradient-text-blue">
                  ZENDO
                </SheetTitle>
              </SheetHeader>
              <div className="flex flex-col gap-1 px-4 pb-4">
                {navLinks.map((link) => {
                  const active = pathname === link.href;
                  return (
                    <Button
                      key={link.href}
                      variant={active ? "secondary" : "ghost"}
                      className="justify-start gap-2"
                      asChild
                      onClick={() => setMobileOpen(false)}
                    >
                      <Link href={link.href}>
                        <link.icon className="size-4" />
                        {link.label}
                      </Link>
                    </Button>
                  );
                })}

                <Separator className="my-2" />

                {isLoggedIn && user ? (
                  <>
                    <div className="flex items-center gap-3 px-3 py-2">
                      <Avatar className="size-9">
                          <AvatarImage src={user.profilePictureUrl ?? undefined} />
                          <AvatarFallback>{getInitials(user?.firstName, user?.lastName)}</AvatarFallback>
                        </Avatar>
                      <div>
                        <p className="text-sm font-semibold">{user.firstName} {user.lastName}</p>
                        <p className="text-xs text-muted-foreground">{isOwner ? "Business Owner" : "Customer"}</p>
                      </div>
                    </div>
                    <Button variant="ghost" className="justify-start gap-2" asChild onClick={() => setMobileOpen(false)}>
                      <Link href="/profile"><User className="size-4" /> Profile</Link>
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2" asChild onClick={() => setMobileOpen(false)}>
                      <Link href="/settings"><Settings className="size-4" /> Settings</Link>
                    </Button>
                    <Button variant="ghost" className="justify-start gap-2 text-destructive hover:text-destructive" onClick={handleLogout}>
                      <LogOut className="size-4" /> Sign Out
                    </Button>
                  </>
                ) : (
                  <div className="flex flex-col gap-2">
                    <Button variant="outline" onClick={() => { setMobileOpen(false); signIn("keycloak", { callbackUrl: "/onboarding" }); }}>
                      Sign in
                    </Button>
                    <Button onClick={() => { setMobileOpen(false); signIn("keycloak", { callbackUrl: "/onboarding" }); }}>
                      Get started free
                    </Button>
                  </div>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
