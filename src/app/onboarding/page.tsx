"use client";

import { useState, useEffect, useCallback, Suspense, useRef } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useAuth } from "@/providers/AuthProvider";
import { graphqlClient } from "@/lib/graphql-client";
import {
  GET_CURRENT_USER, GET_BILLING_ADDRESSES, GET_BUSINESSES, PROCESS_ONBOARDING,
} from "@/graphql/onboarding";
import type {
  User as GqlUser, BillingAddress, Business, BillingAddressConnection, BusinessConnection,
} from "@/graphql/types";
import {
  ArrowRight, ArrowLeft, User, MapPin, Building2, Check, Sparkles, Loader2, Camera,
} from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ImageUpload } from "@/components/ui/image-upload";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Step = "role" | "profile" | "billing" | "business" | "submitting";

interface ProfileForm {
  firstName: string;
  middleName: string;
  lastName: string;
  suffix: string;
  mobileCountryCode: string;
  mobileLocalNumber: string;
  profilePictureUrl: string;
  bannerImageUrl: string;
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
export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>}>
      <OnboardingContent />
    </Suspense>
  );
}

function OnboardingContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { update: updateSession } = useSession();
  const { status, accessToken } = useAuth();
  const redirectTo = searchParams.get("r") || "/";

  const [checking, setChecking] = useState(true);
  const [step, setStep] = useState<Step>("role");
  const [wantsBusiness, setWantsBusiness] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [profilePicUploading, setProfilePicUploading] = useState(false);
  const [bannerUploading, setBannerUploading] = useState(false);
  const profilePicRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);

  const [profile, setProfile] = useState<ProfileForm>({
    firstName: "",
    middleName: "",
    lastName: "",
    suffix: "",
    mobileCountryCode: "+63",
    mobileLocalNumber: "",
    profilePictureUrl: "",
    bannerImageUrl: "",
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

  const updateProfile = (f: keyof ProfileForm, v: string) => setProfile((p) => ({ ...p, [f]: v }));
  const updateBilling = (f: keyof BillingForm, v: string) => setBilling((p) => ({ ...p, [f]: v }));
  const updateBusiness = (f: keyof BusinessForm, v: string) => setBusiness((p) => ({ ...p, [f]: v }));

  // --- Pre-check: redirect if already onboarded ---
  const checkOnboardingStatus = useCallback(async () => {
    if (status !== "authenticated" || !accessToken) return;
    try {
      const { data: session } = await import("next-auth/react").then((m) => m.getSession().then((s) => ({ data: s })));
      const userId = session?.user?.id;
      if (!userId) return;
      const [userRes, billingRes, businessRes] = await Promise.all([
        graphqlClient<{ user: GqlUser | null }>(GET_CURRENT_USER, { id: userId }),
        graphqlClient<{ billingAddresses: BillingAddressConnection }>(GET_BILLING_ADDRESSES, { first: 1, filter: { userId } }),
        graphqlClient<{ businesses: BusinessConnection }>(GET_BUSINESSES, { first: 1, filter: { userId } }),
      ]);

      // --- onboarding is *not* considered finished simply because a profile
      //     or a billing address already exists. the previous implementation
      //     redirected as soon as *any* record was found, which meant that a
      //     customer who tried to become a business owner after creating a
      //     profile was immediately bounced to "/" before the business form
      //     ever rendered. the server never got the `business` payload, so the
      //     user remained a "regular" account.
      //
      //     only the presence of a business entry should trigger the redirect.
      const hasBusiness = (businessRes.data?.businesses?.edges?.length ?? 0) > 0;
      if (hasBusiness) {
        router.replace(redirectTo);
        return;
      }
    } catch (err) {
      console.error("Failed to check onboarding status:", err);
    } finally {
      setChecking(false);
    }
  }, [status, accessToken, router, redirectTo]);

  useEffect(() => {
    if (status === "unauthenticated") { router.replace("/"); return; }
    if (status === "authenticated") checkOnboardingStatus();
  }, [status, checkOnboardingStatus, router]);

  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProfilePicUploading(true);
    try {
      const result = await uploadToCloudinary(file, "profile-pictures");
      updateProfile("profilePictureUrl", result.secure_url);
    } catch (err) {
      console.error("Profile picture upload failed:", err);
    } finally {
      setProfilePicUploading(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBannerUploading(true);
    try {
      const result = await uploadToCloudinary(file, "profile-banners");
      updateProfile("bannerImageUrl", result.secure_url);
    } catch (err) {
      console.error("Banner upload failed:", err);
    } finally {
      setBannerUploading(false);
    }
  };

  const handleSubmit = async () => {
    setError(""); setLoading(true); setStep("submitting");
    const input: Record<string, unknown> = {
      user: {
        firstName: profile.firstName.trim(),
        lastName: profile.lastName.trim(),
        ...(profile.middleName.trim() && { middleName: profile.middleName.trim() }),
        ...(profile.suffix.trim() && { suffix: profile.suffix.trim() }),
        ...(profile.mobileLocalNumber.trim() && { mobileNumber: `${profile.mobileCountryCode} ${profile.mobileLocalNumber.trim()}` }),
        isBusinessOwner: wantsBusiness,
        ...(profile.profilePictureUrl.trim() && {
          profilePictureUrl: profile.profilePictureUrl.trim(),
        }),
        ...(profile.bannerImageUrl.trim() && {
          bannerImageUrl: profile.bannerImageUrl.trim(),
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
      userPreference: {
        notificationsEnabled: true,
        notificationMethod: "EMAIL",
      },
    };
    if (wantsBusiness && business.name.trim()) {
      input.business = { name: business.name.trim(), ...(business.description.trim() && { description: business.description.trim() }), ...(business.bannerImageUrl.trim() && { bannerImageUrl: business.bannerImageUrl.trim() }) };
    }

    const res = await graphqlClient<{
      processOnboarding: {
        user: GqlUser;
        billingAddress: BillingAddress;
        business: Business | null;
      };
    }>(PROCESS_ONBOARDING, { input });

    setLoading(false);

    // Handle structured errors from graphqlClient
    if (res.errors?.length) {
      const gqlErr = res.errors[0];

      // Network-level failures (fetch failed)
      if (gqlErr.extensions?.type === "network") {
        setError("Network error: unable to reach the server. Please check your connection and try again.");
        setStep("profile");
        return;
      }

      // Conflict / already exists — refresh session and continue
      const code = gqlErr.extensions?.code ?? gqlErr.extensions?.details?.code ?? undefined;
      const status = gqlErr.extensions?.status ?? (gqlErr.extensions?.details as any)?.status;
      if (code === "ALREADY_EXISTS" || status === 409) {
        try {
          await updateSession();
        } catch (e) {
          console.warn("Failed to refresh session after ALREADY_EXISTS", e);
        }
        router.replace(redirectTo);
        return;
      }

      // Fallback: show GraphQL error message
      const fieldName = gqlErr.extensions?.details?.field as string | undefined;
      setError(fieldName ? `${gqlErr.message} (${fieldName})` : gqlErr.message);
      setStep("profile");
      return;
    }

    // Success
    await updateSession();
    router.replace(redirectTo);
  };

  const canProceedProfile = profile.firstName.trim().length > 0 && profile.lastName.trim().length > 0;
  const canProceedBilling = billing.addressLine1.trim().length > 0 && billing.country.trim().length > 0;
  const canProceedBusiness = !wantsBusiness || business.name.trim().length > 0;

  if (status === "loading" || checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4 animate-fade-in">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <p className="text-muted-foreground text-sm font-medium">Checking your account…</p>
        </div>
      </div>
    );
  }

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
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-primary/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
        </div>
        <div className="relative z-10">
          <span className="text-white text-xl font-bold tracking-tight">Zendo</span>
        </div>
        <div className="relative z-10">
          <Badge variant="secondary" className="bg-white/10 border-white/20 text-white/80 mb-6">
            <Sparkles className="w-3.5 h-3.5 mr-1.5" /> Almost there!
          </Badge>
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6">
            Let&apos;s set up<br /><span className="text-primary-foreground/75">your account.</span>
          </h1>
          <p className="text-primary-foreground/80 leading-relaxed text-lg max-w-sm">
            Tell us a little about yourself so we can personalize your Zendo experience.
          </p>
        </div>
        <div className="relative z-10 space-y-3">
          {steps.map((s, i) => {
            const done = i < currentStepIdx;
            const active = s.key === step;
            return (
              <div key={s.key} className="flex items-center gap-3 text-sm">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 border transition-all ${done ? "bg-primary border-primary/80 text-white" : active ? "bg-white/20 border-white/40 text-white" : "bg-white/5 border-white/15 text-white/40"}`}>
                  {done ? <Check className="w-3.5 h-3.5" /> : <s.icon className="w-3.5 h-3.5" />}
                </div>
                <span className={done ? "text-primary-foreground/70" : active ? "text-white font-semibold" : "text-white/40"}>{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-background overflow-y-auto py-10">
        <div className="max-w-lg w-full mx-auto">
          <div className="lg:hidden mb-8"><span className="text-xl font-bold text-foreground">Zendo</span></div>

          {error && (
            <div className="mb-6 px-4 py-3 bg-destructive/10 border border-destructive/30 rounded-xl text-sm text-destructive animate-scale-in">{error}</div>
          )}

          {/* STEP: Role */}
          {step === "role" && (
            <div className="animate-slide-up">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-foreground">Welcome to Zendo!</h2>
                <p className="text-muted-foreground mt-2">First, tell us how you&apos;ll be using the platform.</p>
              </div>
              <p className="text-sm font-semibold text-foreground mb-5">I&apos;m joining Zendo as a…</p>
              <div className="grid gap-4">
                <button onClick={() => { setWantsBusiness(false); setStep("profile"); }} className="group relative flex items-start gap-4 p-5 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all text-left">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0"><User className="w-6 h-6 text-primary" /></div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-foreground mb-1">Customer</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">I want to discover businesses and book appointments.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </button>
                <button onClick={() => { setWantsBusiness(true); setStep("profile"); }} className="group relative flex items-start gap-4 p-5 rounded-2xl border-2 border-border hover:border-primary hover:bg-primary/5 dark:hover:bg-primary/10 transition-all text-left">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 dark:bg-primary/20 flex items-center justify-center shrink-0"><Building2 className="w-6 h-6 text-primary" /></div>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-foreground mb-1">Business Owner</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">I want to list my services and manage appointments.</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </button>
              </div>
            </div>
          )}

          {/* STEP: Profile */}
          {step === "profile" && (
            <div className="animate-slide-up">
              <Button variant="ghost" size="sm" onClick={() => setStep("role")} className="mb-6 -ml-2">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900 flex items-center justify-center"><User className="w-5 h-5 text-blue-600" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Your Profile</h2>
                  <p className="text-sm text-muted-foreground">Tell us your name.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="firstName">First name <span className="text-destructive">*</span></Label>
                    <Input id="firstName" value={profile.firstName} onChange={(e) => updateProfile("firstName", e.target.value)} placeholder="Juan" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="lastName">Last name <span className="text-destructive">*</span></Label>
                    <Input id="lastName" value={profile.lastName} onChange={(e) => updateProfile("lastName", e.target.value)} placeholder="Dela Cruz" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="middleName">Middle name</Label>
                    <Input id="middleName" value={profile.middleName} onChange={(e) => updateProfile("middleName", e.target.value)} placeholder="Santos" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="suffix">Suffix</Label>
                    <Input id="suffix" value={profile.suffix} onChange={(e) => updateProfile("suffix", e.target.value)} placeholder="Jr., III" />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mobileNumber">Mobile number</Label>
                  <div className="flex gap-2">
                    <Select value={profile.mobileCountryCode} onValueChange={(v) => updateProfile("mobileCountryCode", v)}>
                      <SelectTrigger className="w-28 shrink-0">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="+63">🇵🇭 +63</SelectItem>
                        <SelectItem value="+1">🇺🇸 +1</SelectItem>
                        <SelectItem value="+44">🇬🇧 +44</SelectItem>
                        <SelectItem value="+61">🇦🇺 +61</SelectItem>
                        <SelectItem value="+81">🇯🇵 +81</SelectItem>
                        <SelectItem value="+82">🇰🇷 +82</SelectItem>
                        <SelectItem value="+86">🇨🇳 +86</SelectItem>
                        <SelectItem value="+65">🇸🇬 +65</SelectItem>
                        <SelectItem value="+60">🇲🇾 +60</SelectItem>
                        <SelectItem value="+66">🇹🇭 +66</SelectItem>
                        <SelectItem value="+62">🇮🇩 +62</SelectItem>
                        <SelectItem value="+84">🇻🇳 +84</SelectItem>
                        <SelectItem value="+91">🇮🇳 +91</SelectItem>
                        <SelectItem value="+49">🇩🇪 +49</SelectItem>
                        <SelectItem value="+33">🇫🇷 +33</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      id="mobileNumber"
                      value={profile.mobileLocalNumber}
                      onChange={(e) => updateProfile("mobileLocalNumber", e.target.value)}
                      placeholder="9380542839"
                      type="tel"
                      className="flex-1"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Profile picture <span className="text-muted-foreground font-normal text-xs">& banner</span></Label>
                  <div className="relative pb-10">
                    {/* Banner */}
                    <button
                      type="button"
                      className="relative rounded-xl overflow-hidden h-28 bg-hero group cursor-pointer w-full"
                      onClick={() => bannerRef.current?.click()}
                    >
                      {profile.bannerImageUrl ? (
                        <Image src={profile.bannerImageUrl} alt="Banner" fill className="object-cover object-center" />
                      ) : (
                        <>
                          <div className="absolute top-0 right-0 w-56 h-56 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
                          <div className="absolute bottom-0 left-10 w-40 h-40 bg-primary/15 rounded-full blur-3xl pointer-events-none" />
                        </>
                      )}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {bannerUploading ? <Loader2 className="w-6 h-6 text-white animate-spin" /> : <Camera className="w-6 h-6 text-white" />}
                      </div>
                      <input ref={bannerRef} type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                    </button>
                    {/* Profile picture overlapping the banner */}
                    <button
                      type="button"
                      className="absolute bottom-0 left-4 group cursor-pointer"
                      onClick={() => profilePicRef.current?.click()}
                    >
                      <Avatar className="w-20 h-20 rounded-2xl border-4 border-background shadow-xl">
                        <AvatarImage src={profile.profilePictureUrl || undefined} alt="Profile picture" />
                        <AvatarFallback className="text-xl font-extrabold bg-linear-to-br from-primary to-primary/80 text-white rounded-2xl">
                          {profile.firstName ? profile.firstName[0].toUpperCase() : <User className="w-6 h-6" />}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {profilePicUploading ? <Loader2 className="w-5 h-5 text-white animate-spin" /> : <Camera className="w-5 h-5 text-white" />}
                      </div>
                      <input ref={profilePicRef} type="file" accept="image/*" className="hidden" onChange={handleProfilePicUpload} />
                    </button>
                  </div>
                </div>
                <Button disabled={!canProceedProfile} onClick={() => setStep("billing")} className="w-full mt-2" size="lg">
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </div>
          )}

          {/* STEP: Billing */}
          {step === "billing" && (
            <div className="animate-slide-up">
              <Button variant="ghost" size="sm" onClick={() => setStep("profile")} className="mb-6 -ml-2">
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back
              </Button>
              <div className="flex items-center gap-3 mb-7">
                <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-900 flex items-center justify-center"><MapPin className="w-5 h-5 text-green-600" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Billing Address</h2>
                  <p className="text-sm text-muted-foreground">Where should we send invoices?</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="addressLine1">Address line 1 <span className="text-destructive">*</span></Label>
                  <Input id="addressLine1" value={billing.addressLine1} onChange={(e) => updateBilling("addressLine1", e.target.value)} placeholder="123 Rizal St." />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="addressLine2">Address line 2</Label>
                  <Input id="addressLine2" value={billing.addressLine2} onChange={(e) => updateBilling("addressLine2", e.target.value)} placeholder="Apt, suite, unit (optional)" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={billing.city} onChange={(e) => updateBilling("city", e.target.value)} placeholder="Manila" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="state">State / Province</Label>
                    <Input id="state" value={billing.state} onChange={(e) => updateBilling("state", e.target.value)} placeholder="Metro Manila" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="postalCode">Postal code</Label>
                    <Input id="postalCode" value={billing.postalCode} onChange={(e) => updateBilling("postalCode", e.target.value)} placeholder="1000" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="country">Country <span className="text-destructive">*</span></Label>
                    <Input id="country" value={billing.country} onChange={(e) => updateBilling("country", e.target.value)} placeholder="Philippines" />
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

          {/* STEP: Business */}
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
                <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-900 flex items-center justify-center"><Building2 className="w-5 h-5 text-violet-600" /></div>
                <div>
                  <h2 className="text-2xl font-bold text-foreground">Your Business</h2>
                  <p className="text-sm text-muted-foreground">Set up your first business on Zendo.</p>
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <Label htmlFor="businessName">Business name <span className="text-destructive">*</span></Label>
                  <Input id="businessName" value={business.name} onChange={(e) => updateBusiness("name", e.target.value)} placeholder="Juan's Bakery" />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="businessDescription">Description</Label>
                  <Textarea id="businessDescription" value={business.description} onChange={(e) => updateBusiness("description", e.target.value)} placeholder="Short description of your business" rows={3} />
                </div>
                <div className="space-y-1.5">
                  <Label>Banner image</Label>
                  <ImageUpload
                    value={business.bannerImageUrl}
                    onChange={(url) => updateBusiness("bannerImageUrl", url)}
                    onRemove={() => updateBusiness("bannerImageUrl", "")}
                    aspect="banner"
                    folder="businesses"
                    label="Upload your business banner"
                  />
                </div>
                <Button disabled={!canProceedBusiness || loading} onClick={handleSubmit} className="w-full mt-2" size="lg">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Complete Setup <Check className="w-4 h-4 ml-2" /></>}
                </Button>
              </div>
            </div>
          )}

          {/* STEP: Submitting */}
          {step === "submitting" && (
            <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
              <Loader2 className="w-10 h-10 text-primary animate-spin mb-6" />
              <h3 className="text-xl font-bold text-foreground mb-2">Setting up your account…</h3>
              <p className="text-muted-foreground text-sm">This will only take a moment.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
