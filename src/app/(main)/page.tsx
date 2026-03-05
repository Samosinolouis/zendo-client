"use client";

import Link from "next/link";
import Image from "next/image";
import { signIn } from "next-auth/react";
import { useAuth } from "@/providers/AuthProvider";
import { mockBusinesses, mockServices } from "@/lib/mock-data";
import { ArrowRight, Star, CalendarCheck, ShieldCheck, Sparkles, Search, Zap, Clock, CheckCircle2, TrendingUp, Users2 } from "lucide-react";

const FEATURES = [
  { icon: Search, title: "Discover Businesses", description: "Browse hundreds of verified businesses across every category imaginable.", color: "text-primary bg-primary/10" },
  { icon: CalendarCheck, title: "Instant Booking", description: "Real-time availability — pick your slot and confirm in under 30 seconds.", color: "text-primary bg-primary/10" },
  { icon: ShieldCheck, title: "Secure Payments", description: "Stripe-powered checkout with full PCI compliance and refund protection.", color: "text-primary bg-primary/10" },
  { icon: Zap, title: "Smart Reminders", description: "Automated email & in-app notifications so you never miss an appointment.", color: "text-primary bg-primary/10" },
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
    <div className="bg-background overflow-x-hidden">
      {/* ── Hero ── */}
      <section className="relative min-h-[90vh] flex items-center bg-hero overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-[10%] w-72 h-72 bg-primary/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute top-1/2 right-[15%] w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: "2s" }} />
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-primary/20 rounded-full blur-3xl animate-blob" style={{ animationDelay: "4s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Left copy */}
            <div className="animate-slide-up">
              <Badge variant="secondary" className="mb-6 bg-white/10 text-white/85 border-white/20 backdrop-blur-sm">
                <Sparkles className="size-3.5 text-yellow-300 mr-1.5" />
                300+ businesses trust Zendo
              </Badge>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-[1.05] tracking-tight mb-6">
                Book any<br />
                <span className="text-transparent bg-clip-text bg-linear-to-r from-white/90 via-primary-foreground/75 to-primary-foreground/60">
                  service,
                </span><br />
                anywhere.
              </h1>
              <p className="text-primary-foreground/80 text-lg leading-relaxed max-w-lg mb-10">
                Zendo is the all-in-one booking platform connecting customers with top local businesses. Discover, book and pay — in seconds.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button size="lg" className="shadow-2xl shadow-primary/30 text-base h-12 px-7" asChild>
                  <Link href="/explore">
                    <Search className="size-5" />
                    Explore businesses
                    <ArrowRight className="size-4" />
                  </Link>
                </Button>
                {!isLoggedIn && (
                  <Button variant="outline" size="lg" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm h-12 px-7 text-base" asChild>
                    <Link href="/register">Get started free</Link>
                  </Button>
                )}
              </div>

              {/* Trust row */}
              <div className="flex items-center gap-4 mt-10">
                <div className="flex -space-x-2">
                  {(["bg-primary", "bg-primary/75", "bg-primary/55", "bg-primary/40"] as const).map((bg, i) => (
                    <div key={i} className={`size-8 rounded-full border-2 border-white/30 flex items-center justify-center text-white text-xs font-bold shrink-0 ${bg}`}>
                      {["J", "C", "A", "T"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex items-center gap-0.5 mb-0.5">
                    {[1, 2, 3, 4, 5].map(i => <Star key={i} className="size-3.5 fill-yellow-400 text-yellow-400" />)}
                  </div>
                  <p className="text-white/70 text-xs">Loved by 5,000+ customers</p>
                </div>
              </div>
            </div>

            {/* Right – floating booking card */}
            <div className="relative hidden lg:block">
              <div className="relative animate-float">
                <Card className="bg-white/10 backdrop-blur-md border-white/20 shadow-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-white/50 text-xs uppercase tracking-wide mb-1">Your next booking</p>
                        <p className="text-white font-bold text-lg">Carlos&apos; Barber Studio</p>
                      </div>
                      <div className="size-12 rounded-2xl bg-linear-to-br from-primary/80 to-primary flex items-center justify-center text-white font-bold text-lg shadow-lg">
                        CB
                      </div>
                    </div>
                    <div className="space-y-3">
                      {[
                        { label: "Service", value: "Classic Haircut & Style" },
                        { label: "Date", value: "Thu, Jan 23 — 2:00 PM" },
                        { label: "Duration", value: "45 minutes" },
                        { label: "Price", value: "₱200.00" },
                      ].map(r => (
                        <div key={r.label} className="flex items-center justify-between py-2.5 border-b border-white/10">
                          <span className="text-white/50 text-sm">{r.label}</span>
                          <span className="text-white text-sm font-medium">{r.value}</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-5 py-3 bg-primary/15 rounded-xl border border-primary/25 text-center">
                      <div className="flex items-center justify-center gap-2 text-primary-foreground/90 text-sm font-semibold">
                        <CheckCircle2 className="size-4" />
                        Confirmed — See you soon!
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Floating badges */}
                <Card className="absolute -top-4 -right-4 p-3 flex items-center gap-2.5 shadow-xl">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Booking confirmed</p>
                    <p className="text-xs text-muted-foreground">Just now</p>
                  </div>
                </Card>

                <Card className="absolute -bottom-4 -left-4 p-3 flex items-center gap-2.5 shadow-xl">
                  <div className="size-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Clock className="size-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">Reminder set</p>
                    <p className="text-xs text-muted-foreground">1 hour before</p>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 80L1440 80L1440 20C1200 60 720 0 0 50L0 80Z" className="fill-background" />
          </svg>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS.map((s) => (
              <Card key={s.label} className="text-center py-6 hover:border-primary/30 hover:shadow-md transition-all group">
                <CardContent className="p-0">
                  <s.icon className="size-6 text-primary mx-auto mb-3 group-hover:scale-110 transition-transform" />
                  <div className="text-3xl font-extrabold mb-1">{s.value}</div>
                  <div className="text-sm text-muted-foreground">{s.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-3">Why Zendo</Badge>
            <h2 className="text-4xl font-extrabold tracking-tight">
              Everything you need,<br className="hidden sm:block" /> nothing you don&apos;t
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f) => (
              <Card key={f.title} className="hover:border-primary/30 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group py-6">
                <CardContent className="p-0 px-6">
                  <div className={`size-12 rounded-xl ${f.color} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                    <f.icon className="size-6" />
                  </div>
                  <h3 className="text-base font-bold mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Businesses ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <Badge variant="secondary" className="mb-2">Top picks</Badge>
              <h2 className="text-3xl font-extrabold">Featured businesses</h2>
            </div>
            <Button variant="link" asChild>
              <Link href="/explore">
                See all <ArrowRight className="size-4" />
              </Link>
            </Button>
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

      {/* ── Popular Services ── */}
      <section className="py-20 bg-muted/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <span className="text-blue-600 text-sm font-semibold uppercase tracking-widest">Browse services</span>
              <h2 className="mt-2 text-3xl font-extrabold text-gray-900">Popular right now</h2>
            </div>
            <Button variant="link" asChild>
              <Link href="/explore">
                All services <ArrowRight className="size-4" />
              </Link>
            </Button>
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

      {/* ── Testimonials ── */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <Badge variant="secondary" className="mb-3">Testimonials</Badge>
            <h2 className="text-4xl font-extrabold">People love Zendo</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <Card key={t.name} className="hover:border-primary/30 hover:shadow-lg transition-all group py-6">
                <CardContent className="p-0 px-6">
                  <div className="flex items-center gap-0.5 mb-4">
                    {[1, 2, 3, 4, 5].map(j => <Star key={j} className="size-4 fill-amber-400 text-amber-400" />)}
                  </div>
                  <p className="text-muted-foreground leading-relaxed text-sm mb-5">&ldquo;{t.text}&rdquo;</p>
                  <div className="flex items-center gap-3">
                    <div className={`size-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0 ${["bg-primary", "bg-primary/70", "bg-primary/50"][i % 3]}`}>
                      {t.avatar}
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative py-24 bg-hero overflow-hidden">
        <div aria-hidden className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-blob" />
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-primary/15 rounded-full blur-3xl animate-blob" style={{ animationDelay: "3s" }} />
        </div>
        <div className="relative max-w-3xl mx-auto text-center px-4">
          <Badge variant="secondary" className="mb-6 bg-white/10 text-white/80 border-white/20 backdrop-blur-sm">
            <Sparkles className="size-3.5 text-yellow-300 mr-1.5" />
            Free to get started
          </Badge>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight mb-5">
            Ready to simplify<br />your bookings?
          </h2>
          <p className="text-primary-foreground/80 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
            Join thousands of customers and businesses already using Zendo. No credit card required.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Button size="lg" className="h-12 px-8 shadow-2xl shadow-primary/30 text-base" asChild>
              <Link href={isLoggedIn ? "/explore" : "/register"}>
                {isLoggedIn ? "Explore businesses" : "Create free account"}
                <ArrowRight className="size-5" />
              </Link>
            </Button>
            {!isLoggedIn && (
              <Button variant="outline" size="lg" className="h-12 px-8 border-white/30 text-white hover:bg-white/10 text-base" onClick={() => signIn("keycloak", { callbackUrl: "/onboarding" })}>
                Sign in instead
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
