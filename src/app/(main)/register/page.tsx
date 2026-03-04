"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAuth } from "@/providers/AuthProvider";
import {
  Check, Sparkles, Users, Briefcase, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default function RegisterPage() {
  const { isLoggedIn } = useAuth();
  const router = useRouter();

  // If already logged in, redirect to home
  useEffect(() => {
    if (isLoggedIn) router.replace("/");
  }, [isLoggedIn, router]);

  const handleGetStarted = () => {
    signIn("keycloak", { callbackUrl: "/onboarding" });
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-hero flex-col justify-between p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-primary/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }} />
        </div>

        <div className="relative z-10">
          <Link href="/"><span className="text-white text-xl font-bold tracking-tight">Zendo</span></Link>
        </div>

        <div className="relative z-10">
          <Badge variant="secondary" className="bg-white/10 border-white/20 text-white/80 mb-6">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Free to get started
          </Badge>
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6">
            Your bookings,<br />
            <span className="text-primary-foreground/75">your rules.</span>
          </h1>
          <p className="text-primary-foreground/80 leading-relaxed text-lg max-w-sm">
            Whether you&apos;re managing appointments or booking your next session — Zendo has you covered.
          </p>
        </div>

        <div className="relative z-10 space-y-3">
          {["Book appointments in seconds", "Manage your business schedule", "Smart reminders & notifications", "Secure online payments"].map((feat) => (
            <div key={feat} className="flex items-center gap-3 text-primary-foreground/80 text-sm">
              <div className="w-5 h-5 rounded-full bg-primary/40 border border-primary/40 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-primary-foreground" />
              </div>
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-background overflow-y-auto py-10">
        <div className="max-w-md w-full mx-auto">
          <div className="lg:hidden mb-8">
            <Link href="/"><span className="text-xl font-bold text-foreground">Zendo</span></Link>
          </div>

          <div className="animate-slide-up">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-foreground">Create your account</h2>
              <p className="text-muted-foreground mt-2">
                Already have an account?{" "}
                <button onClick={() => signIn("keycloak", { callbackUrl: "/" })} className="text-primary font-medium hover:underline">
                  Sign in
                </button>
              </p>
            </div>

            <p className="text-sm font-semibold text-foreground mb-5">Zendo supports two types of accounts</p>

            <div className="grid gap-4 mb-8">
              <div className="flex items-start gap-4 p-5 rounded-2xl border-2 border-border text-left">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <Users className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-base">Customer</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    Browse businesses, book appointments, manage your schedule and payments.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4 p-5 rounded-2xl border-2 border-border text-left">
                <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                  <Briefcase className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-foreground text-base">Business Owner</p>
                  <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">
                    List your business, manage services & availability, get paid automatically.
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-6">
              You&apos;ll choose your account type during onboarding after signing up.
            </p>

            <Button onClick={handleGetStarted} className="w-full" size="lg">
              Get started free <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-xs text-muted-foreground text-center mt-8">
              By continuing, you agree to our{" "}
              <a href="#" className="underline hover:text-foreground">Terms</a> and{" "}
              <a href="#" className="underline hover:text-foreground">Privacy Policy</a>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
