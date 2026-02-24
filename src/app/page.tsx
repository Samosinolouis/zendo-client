"use client";

import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { mockBusinesses, mockServices } from "@/lib/mock-data";
import { ArrowRight, Star, CalendarCheck, ShieldCheck, Sparkles, Search, Zap, Clock, CheckCircle2, TrendingUp, Users2 } from "lucide-react";

const FEATURES = [
  { icon: Search, title: "Discover Businesses", description: "Browse hundreds of verified businesses across every category imaginable.", color: "bg-blue-50 text-blue-600" },
  { icon: CalendarCheck, title: "Instant Booking", description: "Real-time availability  pick your slot and confirm in under 30 seconds.", color: "bg-emerald-50 text-emerald-600" },
  { icon: ShieldCheck, title: "Secure Payments", description: "Stripe-powered checkout with full PCI compliance and refund protection.", color: "bg-violet-50 text-violet-600" },
  { icon: Zap, title: "Smart Reminders", description: "Automated email & in-app notifications so you never miss an appointment.", color: "bg-amber-50 text-amber-600" },
];

const STATS = [
  { value: "5,200+", label: "Bookings completed", icon: CheckCircle2 },
  { value: "300+", label: "Active businesses", icon: Users2 },
  { value: "4.9/5", label: "Average rating", icon: Star },
  { value: "98%", label: "Satisfaction rate", icon: TrendingUp },
];

const TESTIMONIALS = [
  { name: "Sarah M.", role: "Regular customer", text: "Zendo saved me so much time. I book my hair appointments in seconds now. Love the reminders too!", rating: 5, avatar: "S" },
  { name: "James K.", role: "Yoga student", text: "The best booking platform I have used. Clean interface and my instructor loves the dashboard.", rating: 5, avatar: "J" },
  { name: "Wei L.", role: "Business owner", text: "My bookings went up 40% after listing on Zendo. The analytics are surprisingly powerful.", rating: 5, avatar: "W" },
];

export default function HomePage() {
  const { isLoggedIn } = useAuth();
  const featuredBusinesses = mockBusinesses.slice(0, 3);
  const featuredServices = mockServices.slice(0, 6);

  return (
    <div className="bg-white overflow-x-hidden">

      {/*  Hero  */}
      <section className="relative min-h-[90vh] flex items-center bg-hero overflow-hidden">
        {/* Animated blobs */}
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-[10%] w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-1/2 right-[15%] w-96 h-96 bg-violet-500/15 rounded-full blur-3xl animate-blob" style={{animationDelay:"2s"}} />
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-cyan-400/20 rounded-full blur-3xl animate-blob" style={{animationDelay:"4s"}} />
          {/* Grid */}
          <div className="absolute inset-0 opacity-[0.06]" style={{backgroundImage:"linear-gradient(rgba(255,255,255,0.5) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.5) 1px,transparent 1px)",backgroundSize:"60px 60px"}} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <div className="animate-slide-up">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/85 text-sm border border-white/20 mb-6">
                <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
                300+ businesses trust Zendo
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
                Book any<br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-blue-300 via-cyan-300 to-teal-300">
                  service,
                </span><br />
                anywhere.
              </h1>
              <p className="text-blue-100 text-lg leading-relaxed max-w-lg mb-10">
                Zendo is the all-in-one booking platform connecting customers with top local businesses. Discover, book and pay  in seconds.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/explore"
                  className="group inline-flex items-center gap-2 px-7 py-3.5 bg-white text-blue-700 font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-2xl shadow-blue-900/30 text-base">
                  <Search className="w-5 h-5" />
                  Explore businesses
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
                {!isLoggedIn && (
                  <Link href="/register"
                    className="inline-flex items-center gap-2 px-7 py-3.5 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-base backdrop-blur-sm">
                    Get started free
                  </Link>
                )}
              </div>

              {/* Trust row */}
              <div className="flex items-center gap-4 mt-10">
                <div className="flex -space-x-2">
                  {["#3b82f6","#8b5cf6","#06b6d4","#10b981"].map((c, i) => (
                    <div key={i} className="w-8 h-8 rounded-full border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold shrink-0"
                      style={{background: c}}>
                      {["J","C","A","T"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 mb-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-white/70 text-xs">Loved by 5,000+ customers</p>
                </div>
              </div>
            </div>

            {/* Right  floating booking card mockup */}
            <div className="relative hidden lg:block">
              <div className="relative animate-float">
                {/* Main card */}
                <div className="bg-white/10 backdrop-blur-md rounded-3xl border border-white/20 p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Your next booking</p>
                      <p className="text-white font-bold text-lg">Carlos&apos; Barber Studio</p>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-linear-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                      CB
                    </div>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Service", value: "Classic Haircut & Style" },
                      { label: "Date", value: "Thu, Jan 23  2:00 PM" },
                      { label: "Duration", value: "45 minutes" },
                      { label: "Price", value: "₱200.00" },
                    ].map(r => (
                      <div key={r.label} className="flex items-center justify-between py-2.5 border-b border-white/10">
                        <span className="text-white/50 text-sm">{r.label}</span>
                        <span className="text-white text-sm font-medium">{r.value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 py-3 bg-emerald-500/20 rounded-xl border border-emerald-400/30 text-center">
                    <div className="flex items-center justify-center gap-2 text-emerald-300 text-sm font-semibold">
                      <CheckCircle2 className="w-4 h-4" />
                      Confirmed  See you soon!
                    </div>
                  </div>
                </div>

                {/* Floating badge  top right */}
                <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Booking confirmed</p>
                    <p className="text-xs text-gray-400">Just now</p>
                  </div>
                </div>

                {/* Floating badge  bottom left */}
                <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl border border-gray-100 px-4 py-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-900">Reminder set</p>
                    <p className="text-xs text-gray-400">1 hour before</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 20C1200 60 720 0 0 50L0 80Z" fill="white" />
          </svg>
        </div>
      </section>

      {/*  Stats  */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <div key={s.label} className="text-center p-6 rounded-2xl border border-gray-100 bg-linear-to-b from-gray-50 to-white hover:border-blue-200 hover:shadow-md transition-all group">
                <s.icon className="w-6 h-6 text-blue-500 mx-auto mb-3 group-hover:scale-110 transition-transform" />
                <div className="text-3xl font-extrabold text-gray-900 mb-1">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  Features  */}
      <section className="py-20 bg-linear-to-b from-white to-blue-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-blue-600 text-sm font-semibold uppercase tracking-widest">Why Zendo</span>
            <h2 className="mt-3 text-4xl font-extrabold text-gray-900 tracking-tight">Everything you need,<br className="hidden sm:block" /> nothing you don&apos;t</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <div key={f.title} className="group p-6 rounded-2xl bg-white border border-gray-100 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
                style={{animationDelay: `${i * 80}ms`}}>
                <div className={`w-12 h-12 rounded-xl ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                  <f.icon className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  Featured Businesses  */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-blue-600 text-sm font-semibold uppercase tracking-widest">Top picks</span>
              <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Featured businesses</h2>
            </div>
            <Link href="/explore" className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 group">
              See all <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {featuredBusinesses.map((biz, i) => {
              const gradients = ["from-blue-500 to-blue-700","from-violet-500 to-purple-700","from-teal-500 to-cyan-700"];
              return (
                <Link key={biz.id} href={`/business/${biz.id}`} className="group block rounded-2xl border border-gray-100 overflow-hidden hover:border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <div className={`h-40 bg-linear-to-br ${gradients[i % gradients.length]} relative overflow-hidden`}>
                    <div className="absolute inset-0 opacity-20" style={{backgroundImage:"radial-gradient(circle at 30% 30%, white, transparent 60%)"}} />
                    <div className="absolute bottom-4 left-4 right-4">
                      <div className="flex items-center gap-0.5 mb-1">
                        {[1,2,3,4,5].map(j => <Star key={j} className="w-3 h-3 fill-white/80 text-white/80" />)}
                        <span className="text-white/80 text-xs ml-1">5.0</span>
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl border border-white/30 flex items-center justify-center text-white font-bold">
                      {biz.name[0]}
                    </div>
                  </div>
                  <div className="p-5">
                    <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{biz.name}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2 leading-relaxed">{biz.description}</p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="text-xs bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full font-medium">
                        {mockServices.filter(s => s.businessId === biz.id).length} services
                      </span>
                      <span className="text-xs text-gray-400 group-hover:text-blue-500 flex items-center gap-1 transition-colors">
                        View <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/*  Popular Services  */}
      <section className="py-20 bg-blue-50/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-blue-600 text-sm font-semibold uppercase tracking-widest">Browse services</span>
              <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Popular right now</h2>
            </div>
            <Link href="/explore" className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 group">
              All services <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredServices.map((svc) => {
              const biz = mockBusinesses.find(b => b.id === svc.businessId);
              return (
                <Link key={svc.id} href={`/service/${svc.id}`} className="group bg-white rounded-2xl border border-gray-100 p-5 hover:border-blue-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors leading-snug">{svc.name}</h3>
                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 shrink-0 mt-0.5 group-hover:translate-x-0.5 transition-all" />
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-4">{svc.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                        {biz?.name[0]}
                      </div>
                      <span className="text-xs text-gray-500">{biz?.name}</span>
                    </div>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      <span className="text-xs text-gray-600 font-medium">4.9</span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/*  Testimonials  */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <span className="text-blue-600 text-sm font-semibold uppercase tracking-widest">Testimonials</span>
            <h2 className="mt-3 text-4xl font-extrabold text-gray-900">People love Zendo</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={t.name} className="relative p-6 rounded-2xl bg-linear-to-b from-gray-50 to-white border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all group">
                <div className="flex items-center gap-0.5 mb-4">
                  {[1,2,3,4,5].map(j => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-gray-600 leading-relaxed text-sm mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0"
                    style={{background: ["#3b82f6","#8b5cf6","#06b6d4"][i % 3]}}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/*  CTA  */}
      <section className="relative py-24 bg-hero overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-400/15 rounded-full blur-3xl animate-blob" style={{animationDelay:"3s"}} />
        </div>
        <div className="relative max-w-3xl mx-auto text-center px-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/10 backdrop-blur-sm rounded-full text-white/80 text-sm border border-white/20 mb-6">
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            Free to get started
          </div>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
            Ready to simplify<br />your bookings?
          </h2>
          <p className="text-blue-200 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Join thousands of customers and businesses already using Zendo. No credit card required.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href={isLoggedIn ? "/explore" : "/register"}
              className="group inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-2xl shadow-blue-900/30 text-base">
              {isLoggedIn ? "Explore businesses" : "Create free account"}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            {!isLoggedIn && (
              <Link href="/login"
                className="inline-flex items-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-semibold rounded-xl hover:bg-white/10 transition-all text-base">
                Sign in instead
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
