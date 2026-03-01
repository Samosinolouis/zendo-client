"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { useAuth } from "@/providers/AuthProvider";
import { Eye, EyeOff, Mail, Lock, User, Building2, ArrowRight, ArrowLeft, Check, Sparkles, Users, Briefcase, Chrome, Facebook, Twitter } from "lucide-react";

type Role = "user" | "owner";
type Step = "role" | "details";

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();

  const [step, setStep] = useState<Step>("role");
  const [role, setRole] = useState<Role>("user");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    username: "",
    password: "",
    businessName: "",
    businessDescription: "",
  });

  const update = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleRoleSelect = (r: Role) => {
    setRole(r);
    setStep("details");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await register({ ...form, role });
    setLoading(false);
    if (result.success) {
      router.push("/");
    } else {
      setError(result.message);
    }
  };

  const handleOAuthSignup = (provider: "google" | "facebook" | "twitter") => {
    // TODO: Implement actual OAuth flow with OpenRouter or external provider
    console.log(`Attempting to sign up with ${provider}`);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-hero flex-col justify-between p-12">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-violet-400/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-cyan-400/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />
        </div>

        <div className="relative z-10">
          <Link href="/">
            <span className="text-white text-xl font-bold tracking-tight">Zendo</span>
          </Link>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-xs font-medium mb-6 border border-white/20">
            <Sparkles className="w-3.5 h-3.5" />
            Free to get started
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6">
            Your bookings,<br />
            <span className="text-blue-300">your rules.</span>
          </h1>
          <p className="text-blue-200 leading-relaxed text-lg max-w-sm">
            Whether you&apos;re managing appointments or booking your next session — Zendo has you covered.
          </p>
        </div>

        {/* Feature list */}
        <div className="relative z-10 space-y-3">
          {[
            "Book appointments in seconds",
            "Manage your business schedule",
            "Smart reminders & notifications",
            "Secure payments via Stripe",
          ].map((feat) => (
            <div key={feat} className="flex items-center gap-3 text-blue-200 text-sm">
              <div className="w-5 h-5 rounded-full bg-blue-500/40 border border-blue-400/50 flex items-center justify-center shrink-0">
                <Check className="w-3 h-3 text-blue-200" />
              </div>
              {feat}
            </div>
          ))}
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-white overflow-y-auto py-10">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/">
              <span className="text-xl font-bold text-gray-900">Zendo</span>
            </Link>
          </div>

          {step === "role" ? (
            <div className="animate-slide-up">
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Create your account</h2>
                <p className="text-gray-500 mt-2">
                  Already have an account?{" "}
                  <button onClick={() => signIn("keycloak", { callbackUrl: "/onboarding" })} className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                    Sign in
                  </button>
                </p>
              </div>

              <p className="text-sm font-semibold text-gray-700 mb-5">I am joining Zendo as a…</p>

              <div className="grid gap-4">
                {/* Customer card */}
                <button
                  onClick={() => handleRoleSelect("user")}
                  className="group relative flex items-start gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50/40 transition-all text-left"
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-blue-100 group-hover:bg-blue-500 flex items-center justify-center transition-colors">
                    <Users className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-base">Customer</p>
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                      Browse businesses, book appointments, manage your schedule and payments.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {["Book services", "Track appointments", "Easy payments"].map((t) => (
                        <span key={t} className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">{t}</span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </button>

                {/* Business Owner card */}
                <button
                  onClick={() => handleRoleSelect("owner")}
                  className="group relative flex items-start gap-4 p-5 rounded-2xl border-2 border-gray-200 hover:border-violet-500 hover:bg-violet-50/40 transition-all text-left"
                >
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-violet-100 group-hover:bg-violet-500 flex items-center justify-center transition-colors">
                    <Briefcase className="w-6 h-6 text-violet-600 group-hover:text-white transition-colors" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-base">Business Owner</p>
                    <p className="text-sm text-gray-500 mt-0.5 leading-relaxed">
                      List your business, manage services & availability, get paid automatically.
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {["Manage bookings", "Multiple services", "Analytics & payouts"].map((t) => (
                        <span key={t} className="text-xs px-2 py-0.5 bg-violet-100 text-violet-700 rounded-full font-medium">{t}</span>
                      ))}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                </button>
              </div>

              {/* OAuth providers */}
              <div className="mt-6 space-y-3 animate-slide-up">
                <p className="text-xs text-gray-400 font-medium text-center mb-4">Or sign up with</p>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleOAuthSignup("google")}
                    className="w-full flex items-center justify-center py-2.5 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                    title="Sign up with Google"
                  >
                    <Chrome className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleOAuthSignup("facebook")}
                    className="w-full flex items-center justify-center py-2.5 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                    title="Sign up with Facebook"
                  >
                    <Facebook className="w-5 h-5 text-gray-600" />
                  </button>
                  <button
                    onClick={() => handleOAuthSignup("twitter")}
                    className="w-full flex items-center justify-center py-2.5 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                    title="Sign up with X (Twitter)"
                  >
                    <Twitter className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center mt-8">
                By continuing, you agree to our{" "}
                <a href="#" className="underline hover:text-gray-600">Terms</a> and{" "}
                <a href="#" className="underline hover:text-gray-600">Privacy Policy</a>.
              </p>
            </div>
          ) : (
            <div className="animate-slide-up">
              {/* Back + header */}
              <button
                onClick={() => setStep("role")}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors group"
              >
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                Back
              </button>

              <div className="flex items-center gap-3 mb-7">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${role === "owner" ? "bg-violet-100" : "bg-blue-100"}`}>
                  {role === "owner"
                    ? <Briefcase className="w-5 h-5 text-violet-600" />
                    : <Users className="w-5 h-5 text-blue-600" />
                  }
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    {role === "owner" ? "Business Owner" : "Customer"} account
                  </h2>
                  <p className="text-sm text-gray-500">Fill in your details below</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">First name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        value={form.firstName}
                        onChange={(e) => update("firstName", e.target.value)}
                        placeholder="Jane"
                        required
                        className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5">Last name</label>
                    <input
                      value={form.lastName}
                      onChange={(e) => update("lastName", e.target.value)}
                      placeholder="Doe"
                      required
                      className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Username</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">@</span>
                    <input
                      value={form.username}
                      onChange={(e) => update("username", e.target.value)}
                      placeholder="janedoe"
                      required
                      className="w-full pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Email address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => update("email", e.target.value)}
                      placeholder="you@example.com"
                      required
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      onChange={(e) => update("password", e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      minLength={8}
                      className="w-full pl-9 pr-10 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {role === "owner" && (
                  <div className="pt-2 border-t border-gray-100 space-y-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Business details</p>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">Business name</label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          value={form.businessName}
                          onChange={(e) => update("businessName", e.target.value)}
                          placeholder="Acme Hair Studio"
                          required
                          className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all bg-gray-50/50 hover:bg-white"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1.5">
                        Short description <span className="text-gray-400 font-normal">(optional)</span>
                      </label>
                      <textarea
                        value={form.businessDescription}
                        onChange={(e) => update("businessDescription", e.target.value)}
                        placeholder="What services do you offer?"
                        rows={3}
                        className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/30 focus:border-violet-500 transition-all bg-gray-50/50 hover:bg-white resize-none"
                      />
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center gap-2 py-3 text-white font-semibold rounded-xl active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg mt-2 ${
                    role === "owner"
                      ? "bg-violet-600 hover:bg-violet-700 shadow-violet-500/25"
                      : "bg-blue-600 hover:bg-blue-700 shadow-blue-500/25"
                  }`}
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>Create account <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
