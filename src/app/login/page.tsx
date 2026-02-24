"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import { Eye, EyeOff, Mail, Lock, ArrowRight, Sparkles, ChevronRight, Chrome, Facebook, Twitter } from "lucide-react";

const DEMO_ACCOUNTS = [
  { id: "u1", label: "Jane Doe", role: "Regular User", email: "jane@example.com", color: "from-blue-400 to-cyan-400" },
  { id: "u2", label: "Carlos Rivera", role: "Business Owner", email: "carlos@example.com", color: "from-violet-400 to-purple-400" },
  { id: "u3", label: "Aisha Khan", role: "Business Owner", email: "aisha@example.com", color: "from-rose-400 to-pink-400" },
];

export default function LoginPage() {
  const { loginWithCredentials, switchUser } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    const result = await loginWithCredentials(email, password);
    setLoading(false);
    if (result.success) {
      router.push("/");
    } else {
      setError(result.message);
    }
  };

  const handleDemoLogin = (userId: string) => {
    switchUser(userId);
    router.push("/");
  };

  const handleOAuthLogin = (provider: "google" | "facebook" | "twitter") => {
    // TODO: Implement actual OAuth flow with OpenRouter or external provider
    console.log(`Attempting to login with ${provider}`);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-hero flex-col justify-between p-12">
        {/* Animated background orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-400/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-1/2 right-1/4 w-80 h-80 bg-violet-400/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-1/4 left-1/3 w-56 h-56 bg-cyan-400/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px"
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
            300+ businesses trust Zendo
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight mb-6">
            Every appointment,<br />
            <span className="text-blue-300">perfectly booked.</span>
          </h1>
          <p className="text-blue-200 leading-relaxed text-lg max-w-sm">
            Join thousands of businesses and customers connecting through seamless appointment booking.
          </p>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-4">
          {[
            { value: "5k+", label: "Bookings" },
            { value: "300+", label: "Businesses" },
            { value: "4.9★", label: "Rating" },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-blue-300 text-xs mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 lg:px-16 xl:px-24 bg-white">
        <div className="max-w-md w-full mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden mb-8">
            <Link href="/">
              <span className="text-xl font-bold text-gray-900">Zendo</span>
            </Link>
          </div>

          <div className="mb-8 animate-slide-up">
            <h2 className="text-3xl font-bold text-gray-900">Welcome back</h2>
            <p className="text-gray-500 mt-2">
              Don&apos;t have an account?{" "}
              <Link href="/register" className="text-blue-600 font-medium hover:text-blue-700 transition-colors">
                Sign up free
              </Link>
            </p>
          </div>

          {/* Demo quick-login */}
          <div className="mb-6 animate-slide-up" style={{ animationDelay: "0.05s" }}>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Demo accounts — one click login
            </p>
            <div className="space-y-2">
              {DEMO_ACCOUNTS.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => handleDemoLogin(acc.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/50 transition-all group"
                >
                  <div className={`w-9 h-9 rounded-lg bg-linear-to-br ${acc.color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
                    {acc.label[0]}
                  </div>
                  <div className="text-left flex-1">
                    <p className="text-sm font-medium text-gray-900">{acc.label}</p>
                    <p className="text-xs text-gray-400">{acc.role} · {acc.email}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center">
              <span className="px-3 bg-white text-xs text-gray-400 font-medium">or sign in with email</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 animate-slide-up" style={{ animationDelay: "0.1s" }}>
            {error && (
              <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 animate-scale-in">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full pl-11 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-medium text-gray-700">Password</label>
                <a href="#" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Forgot password?</a>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="w-full pl-11 pr-12 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-all bg-gray-50/50 hover:bg-white"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-60 disabled:cursor-not-allowed shadow-lg shadow-blue-500/25 mt-2"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Sign in <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* OAuth providers */}
          <div className="mt-6 space-y-3 animate-slide-up" style={{ animationDelay: "0.15s" }}>
            <p className="text-xs text-gray-400 font-medium text-center mb-4">Or continue with</p>
            <div className="grid grid-cols-3 gap-3">
              <button
                onClick={() => handleOAuthLogin("google")}
                className="w-full flex items-center justify-center py-2.5 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                title="Sign in with Google"
              >
                <Chrome className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => handleOAuthLogin("facebook")}
                className="w-full flex items-center justify-center py-2.5 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                title="Sign in with Facebook"
              >
                <Facebook className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={() => handleOAuthLogin("twitter")}
                className="w-full flex items-center justify-center py-2.5 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                title="Sign in with X (Twitter)"
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
      </div>
    </div>
  );
}
