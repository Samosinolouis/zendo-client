"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuth } from "@/providers/AuthProvider";
import { graphqlClient } from "@/lib/graphql-client";
import {
  GET_CURRENT_USER,
  GET_BILLING_ADDRESSES,
  GET_BUSINESSES,
  PROCESS_ONBOARDING,
} from "@/graphql/onboarding";
import type {
  User as GqlUser,
  BillingAddress,
  Business,
  BillingAddressConnection,
  BusinessConnection,
} from "@/graphql/types";
import {
  ArrowRight,
  ArrowLeft,
  User,
  MapPin,
  Building2,
  Check,
  Sparkles,
  Loader2,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Step = "role" | "profile" | "billing" | "business" | "submitting";

interface ProfileForm {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  profilePictureUrl: string;
}

interface BillingForm {
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

interface BusinessForm {
  name: string;
  description: string;
  bannerImageUrl: string;
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export default function OnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const { status, accessToken } = useAuth();

  const redirectTo = searchParams.get("r") || "/";

  // --- State ---
  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<Step>("role");
  const [wantsBusiness, setWantsBusiness] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [profile, setProfile] = useState<ProfileForm>({
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    profilePictureUrl: "",
  });

  const [billing, setBilling] = useState<BillingForm>({
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
  });

  const [business, setBusiness] = useState<BusinessForm>({
    name: "",
    description: "",
    bannerImageUrl: "",
  });

  const updateProfile = (field: keyof ProfileForm, value: string) =>
    setProfile((prev) => ({ ...prev, [field]: value }));

  const updateBilling = (field: keyof BillingForm, value: string) =>
    setBilling((prev) => ({ ...prev, [field]: value }));

  const updateBusiness = (field: keyof BusinessForm, value: string) =>
    setBusiness((prev) => ({ ...prev, [field]: value }));

  // --- Pre-check: redirect if already onboarded ---
  const checkOnboardingStatus = useCallback(async () => {
    if (status !== "authenticated" || !accessToken) return;

    try {
      // We need the user's Keycloak sub to query. We can get it from the session.
      // The `user` query uses the Keycloak sub as the ID.
      // We'll use the session user id from AuthProvider context.
      const { data: session } = await import("next-auth/react").then((m) =>
        m.getSession().then((s) => ({ data: s }))
      );
      const userId = session?.user?.id;
      if (!userId) return;

      const [userRes, billingRes, businessRes] = await Promise.all([
        graphqlClient<{ user: GqlUser | null }>(GET_CURRENT_USER, { id: userId }),
        graphqlClient<{ billingAddresses: BillingAddressConnection }>(GET_BILLING_ADDRESSES, {
          first: 1,
          filter: { userId },
        }),
        graphqlClient<{ businesses: BusinessConnection }>(GET_BUSINESSES, {
          first: 1,
          filter: { userId },
        }),
      ]);

      const hasUser = !!userRes.data?.user;
      const hasBilling =
        (billingRes.data?.billingAddresses?.edges?.length ?? 0) > 0;
      const hasBusiness =
        (businessRes.data?.businesses?.edges?.length ?? 0) > 0;

      // If any of the core records already exist, user is already onboarded
      if (hasUser || hasBilling || hasBusiness) {
        router.replace(redirectTo);
        return;
      }
    } catch (err) {
      console.error("Failed to check onboarding status:", err);
      // On error, still show the onboarding form
    } finally {
      setChecking(false);
    }
  }, [status, accessToken, router, redirectTo]);

  useEffect(() => {
    if (status === "unauthenticated") {
      // Not logged in — shouldn't be here
      router.replace("/");
      return;
    }
    if (status === "authenticated") {
      checkOnboardingStatus();
    }
  }, [status, checkOnboardingStatus, router]);

  // --- Submit ---
  const handleSubmit = async () => {
    setError("");
    setLoading(true);
    setStep("submitting");

    const input: Record<string, unknown> = {
      user: {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        ...(profile.middleName.trim() && { middleName: profile.middleName.trim() }),
        ...(profile.suffix.trim() && { suffix: profile.suffix.trim() }),
        ...(profile.profilePictureUrl.trim() && {
          profilePictureUrl: profile.profilePictureUrl.trim(),
        }),
      },
      billingAddress: {
        addressLine1: billing.addressLine1.trim(),
        country: billing.country.trim(),
        ...(billing.addressLine2.trim() && { addressLine2: billing.addressLine2.trim() }),
        ...(billing.city.trim() && { city: billing.city.trim() }),
        ...(billing.state.trim() && { state: billing.state.trim() }),
        ...(billing.postalCode.trim() && { postalCode: billing.postalCode.trim() }),
      },
    };

    if (wantsBusiness && business.name.trim()) {
      input.business = {
        name: business.name.trim(),
        ...(business.description.trim() && { description: business.description.trim() }),
        ...(business.bannerImageUrl.trim() && {
          bannerImageUrl: business.bannerImageUrl.trim(),
        }),
      };
    }

    const res = await graphqlClient<{
      processOnboarding: {
        user: GqlUser;
        billingAddress: BillingAddress;
        business: Business | null;
      };
    }>(PROCESS_ONBOARDING, { input });

    setLoading(false);

    if (res.errors?.length) {
      const gqlErr = res.errors[0];
      const fieldName = gqlErr.extensions?.details?.field as string | undefined;
      setError(fieldName ? `${gqlErr.message} (${fieldName})` : gqlErr.message);
      // Go back to profile step so user can fix errors
      setStep("profile");
      return;
    }

    // Success — update the session so it fetches the new appUser from the DB
    await updateSession();
    router.replace(redirectTo);
  };

  // --- Helpers ---
  const canProceedProfile =
    profile.firstName.trim().length > 0 && profile.lastName.trim().length > 0;
  const canProceedBilling =
    billing.addressLine1.trim().length > 0 && billing.country.trim().length > 0;
  const canProceedBusiness = !wantsBusiness || business.name.trim().length > 0;

  // --- Loading states ---
  if (status === "loading" || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f8faff]">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <p className="text-gray-500 text-sm font-medium">Checking your account…</p>
        </div>
      </div>
    );
  }

  // --- Steps indicators ---
  const steps = [
    { key: "role", label: "Role", icon: User },
    { key: "profile", label: "Profile", icon: User },
    { key: "billing", label: "Address", icon: MapPin },
    ...(wantsBusiness
      ? [{ key: "business", label: "Business", icon: Building2 }]
      : []),
  ] as const;

  const currentStepIdx = steps.findIndex((s) => s.key === step);

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden bg-hero flex-col justify-between p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-blob" />
          <div
            className="absolute top-1/2 right-1/4 w-80 h-80 bg-violet-400/15 rounded-full blur-3xl animate-blob"
            style={{ animationDelay: "2s" }}
          />
          <div
            className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-cyan-400/20 rounded-full blur-3xl animate-blob"
            style={{ animationDelay: "4s" }}
          />
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10">
          <span className="text-white text-xl font-bold tracking-tight">Zendo</span>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-xs font-medium mb-6 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            Almost there!
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6">
            Let&apos;s set up
            <br />
            <span className="text-blue-300">your account.</span>
          </h1>
          <p className="text-blue-200 leading-relaxed text-lg max-w-sm">
            Tell us a little about yourself so we can personalize your Zendo
            experience.
          </p>
        </div>

        {/* Progress indicators */}
        <div className="relative z-10 space-y-3">
          {steps.map((s, i) => {
            const done = i < currentStepIdx;
            const active = s.key === step;
            return (
              <div key={s.key} className="flex items-center gap-3 text-sm">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    done
                      ? "bg-blue-400 border-blue-300 text-white"
                      : active
                      ? "bg-white/20 border-white/40 text-white"
                      : "bg-white/5 border-white/15 text-white/40"
                  }`}
                >
                  {done ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    <s.icon className="w-3.5 h-3.5" />
                  )}
                </div>
                <span
                  className={`${
                    done
                      ? "text-blue-300"
                      : active
                      ? "text-white font-semibold"
                      : "text-white/40"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-white overflow-y-auto py-10">
        <div className="max-w-lg w-full mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <span className="text-xl font-bold text-gray-900">Zendo</span>
          </div>

          {/* Error banner */}
          {error && (
            <div className="mb-6 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-scale-in">
              {error}
            </div>
          )}

          {/* ── STEP: Role Selection ── */}
          {step === "role" && (
            <div className="animate-slide-up">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  Welcome to Zendo!
                </h2>
                <p className="text-gray-500 mt-2">
                  First, tell us how you'll be using the platform.
                </p>
              </div>

              <p className="text-sm font-semibold text-gray-700 mb-5">
                I&apos;m joining Zendo as a…
              </p>

              <div className="grid gap-4">
                <button
                  onClick={() => {
                    setWantsBusiness(false);
                    setStep("profile");
                  }}
                  className="group relative flex items-start gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                    <User className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-900 mb-1">
                      Customer
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      I want to discover businesses and book appointments.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </button>

                <button
                  onClick={() => {
                    setWantsBusiness(true);
                    setStep("profile");
                  }}
                  className="group relative flex items-start gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-violet-500 hover:bg-violet-50/40 transition-all text-left"
                >
                  <div className="w-12 h-12 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                    <Building2 className="w-6 h-6 text-violet-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-900 mb-1">
                      Business Owner
                    </p>
                    <p className="text-sm text-gray-500 leading-relaxed">
                      I want to list my services and manage appointments.
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: Profile ── */}
          {step === "profile" && (
            <div className="animate-slide-up">
              <button
                onClick={() => setStep("role")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Back
              </button>

              <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                  <User className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your Profile
                  </h2>
                  <p className="text-sm text-gray-500">
                    Tell us your name.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className="block text-xs font-semibold text-gray-600 mb-1.5">
                      First name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      value={profile.firstName}
                      onChange={(e) => updateProfile("firstName", e.target.value)}
                      placeholder="Juan"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Last name <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      value={profile.lastName}
                      onChange={(e) => updateProfile("lastName", e.target.value)}
                      placeholder="Dela Cruz"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="middleName" className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Middle name
                    </label>
                    <input
                      id="middleName"
                      type="text"
                      value={profile.middleName}
                      onChange={(e) => updateProfile("middleName", e.target.value)}
                      placeholder="Santos"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="suffix" className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Suffix
                    </label>
                    <input
                      id="suffix"
                      type="text"
                      value={profile.suffix}
                      onChange={(e) => updateProfile("suffix", e.target.value)}
                      placeholder="Jr., III"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="profilePictureUrl" className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Profile picture URL
                  </label>
                  <input
                    id="profilePictureUrl"
                    type="url"
                    value={profile.profilePictureUrl}
                    onChange={(e) =>
                      updateProfile("profilePictureUrl", e.target.value)
                    }
                    placeholder="https://example.com/avatar.jpg"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                  />
                </div>

                <button
                  disabled={!canProceedProfile}
                  onClick={() => setStep("billing")}
                  className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                >
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: Billing Address ── */}
          {step === "billing" && (
            <div className="animate-slide-up">
              <button
                onClick={() => setStep("profile")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Back
              </button>

              <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Billing Address
                  </h2>
                  <p className="text-sm text-gray-500">
                    Where should we send invoices?
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="addressLine1" className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Address line 1 <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="addressLine1"
                    type="text"
                    value={billing.addressLine1}
                    onChange={(e) =>
                      updateBilling("addressLine1", e.target.value)
                    }
                    placeholder="123 Rizal St."
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="addressLine2" className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Address line 2
                  </label>
                  <input
                    id="addressLine2"
                    type="text"
                    value={billing.addressLine2}
                    onChange={(e) =>
                      updateBilling("addressLine2", e.target.value)
                    }
                    placeholder="Apt, suite, unit (optional)"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="city" className="block text-xs font-semibold text-gray-600 mb-1.5">
                      City
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={billing.city}
                      onChange={(e) => updateBilling("city", e.target.value)}
                      placeholder="Manila"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="state" className="block text-xs font-semibold text-gray-600 mb-1.5">
                      State / Province
                    </label>
                    <input
                      id="state"
                      type="text"
                      value={billing.state}
                      onChange={(e) => updateBilling("state", e.target.value)}
                      placeholder="Metro Manila"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="postalCode" className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Postal code
                    </label>
                    <input
                      id="postalCode"
                      type="text"
                      value={billing.postalCode}
                      onChange={(e) =>
                        updateBilling("postalCode", e.target.value)
                      }
                      placeholder="1000"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                    />
                  </div>
                  <div>
                    <label htmlFor="country" className="block text-xs font-semibold text-gray-600 mb-1.5">
                      Country <span className="text-red-400">*</span>
                    </label>
                    <input
                      id="country"
                      type="text"
                      value={billing.country}
                      onChange={(e) => updateBilling("country", e.target.value)}
                      placeholder="Philippines"
                      className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                    />
                  </div>
                </div>

                <button
                  disabled={!canProceedBilling}
                  onClick={() =>
                    wantsBusiness ? setStep("business") : handleSubmit()
                  }
                  className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                >
                  {wantsBusiness ? (
                    <>
                      Continue <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <>
                      Complete Setup <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: Business (optional) ── */}
          {step === "business" && (
            <div className="animate-slide-up">
              <button
                onClick={() => setStep("billing")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Back
              </button>

              <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-violet-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Your Business
                  </h2>
                  <p className="text-sm text-gray-500">
                    Set up your first business on Zendo.
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label htmlFor="businessName" className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Business name <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="businessName"
                    type="text"
                    value={business.name}
                    onChange={(e) => updateBusiness("name", e.target.value)}
                    placeholder="Juan's Bakery"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="businessDescription" className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Description
                  </label>
                  <textarea
                    id="businessDescription"
                    value={business.description}
                    onChange={(e) =>
                      updateBusiness("description", e.target.value)
                    }
                    placeholder="Short description of your business"
                    rows={3}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white resize-none"
                  />
                </div>

                <div>
                  <label htmlFor="businessBanner" className="block text-xs font-semibold text-gray-600 mb-1.5">
                    Banner image URL
                  </label>
                  <input
                    id="businessBanner"
                    type="url"
                    value={business.bannerImageUrl}
                    onChange={(e) =>
                      updateBusiness("bannerImageUrl", e.target.value)
                    }
                    placeholder="https://example.com/banner.jpg"
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                  />
                </div>

                <button
                  disabled={!canProceedBusiness || loading}
                  onClick={handleSubmit}
                  className="w-full flex items-center justify-center gap-2 py-3 mt-2 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Complete Setup <Check className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ── STEP: Submitting ── */}
          {step === "submitting" && (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <Loader2 className="w-10 h-10 text-blue-600 animate-spin mb-6" />
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                Setting up your account…
              </h3>
              <p className="text-gray-500 text-sm">
                This will only take a moment.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
