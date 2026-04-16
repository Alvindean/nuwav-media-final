"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  CheckCircle,
  Home,
  Target,
  Zap,
  TrendingUp,
  Bell,
  Shield,
  Layers,
  Clock,
  Mail,
  Building2,
  Gavel,
  FileWarning,
  Satellite,
  Sparkles
} from "lucide-react";

type WaitlistState = "idle" | "submitting" | "ok" | "error";

export default function DealScout() {
  const [email, setEmail] = useState("");
  const [market, setMarket] = useState("");
  const [role, setRole] = useState("agent");
  const [state, setState] = useState<WaitlistState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("submitting");
    setErrorMsg("");
    try {
      const endpoint =
        process.env.NEXT_PUBLIC_DEAL_SCOUT_API ||
        "https://deal-scout.nuwavmedia.workers.dev";
      const res = await fetch(`${endpoint}/waitlist`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, market, role })
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setState("ok");
      setEmail("");
      setMarket("");
    } catch (err: any) {
      setState("error");
      setErrorMsg(err?.message || "Something went wrong");
    }
  }

  const sources = [
    { icon: FileWarning, label: "Expired listings", note: "44% list rate" },
    { icon: Home, label: "FSBOs", note: "27.8% list rate" },
    { icon: Gavel, label: "Pre-foreclosures", note: "County NOD filings" },
    { icon: Building2, label: "Probate", note: "Court e-filings" },
    { icon: Target, label: "Tax-delinquent", note: "Treasurer rolls" },
    { icon: Shield, label: "Absentee + vacant", note: "Assessor + USPS" },
    { icon: Layers, label: "Code violations", note: "City open data" },
    { icon: Satellite, label: "Aerial decay (beta)", note: "Roof/pool diffs" }
  ];

  const differentiators = [
    {
      icon: Clock,
      title: "Sub-minute alerts",
      body:
        "The agent who calls within 5 minutes is 10x more likely to reach the owner. Deal Scout pushes every signal the moment it appears — email, SMS, or webhook into your CRM."
    },
    {
      icon: Layers,
      title: "Stacked-motivation scoring",
      body:
        "One signal is a lead. Three stacked signals — expired + tax-delinquent + absentee — is a near-certain deal. Our scoring rewards the stack. Incumbents silo by source; we don't."
    },
    {
      icon: Sparkles,
      title: "AI-drafted first touch",
      body:
        "Every lead arrives with a Claude-drafted letter, SMS, and call script tuned to the specific motivation type. Probate copy doesn't sound like expired copy."
    },
    {
      icon: Satellite,
      title: "Futuristic signals (roadmap)",
      body:
        "Aerial-imagery diffs for roof decay and pool neglect. Obituary → heir matching before probate even files. On-market underpricing detector vs. live comps."
    }
  ];

  return (
    <div className="min-h-screen bg-white text-gray-900">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <a href="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                NU WAV Media
              </span>
            </a>
            <a
              href="#waitlist"
              className="px-4 py-2 rounded-lg bg-gray-900 text-white text-sm font-semibold hover:bg-gray-700 transition"
            >
              Get early access
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section
        className="relative pt-32 pb-24 overflow-hidden text-white"
        style={{
          background:
            "linear-gradient(135deg, #0b1224 0%, #16213e 50%, #0f3460 100%)"
        }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-sm mb-6">
            <Sparkles className="w-4 h-4" />
            <span>Deal Scout — by Nu Wav Media</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
            Find the deals before the other agent calls.
          </h1>
          <p className="text-lg md:text-2xl opacity-90 mb-10 max-w-3xl mx-auto">
            Deal Scout aggregates expired listings, FSBOs, pre-foreclosures,
            probate, tax-delinquent, and absentee-owner signals from legal
            public-record sources — then scores, stacks, and pushes the best
            leads to you in under a minute.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <a
              href="#waitlist"
              className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 px-8 py-4 rounded-full text-lg font-bold transition transform hover:scale-105 inline-flex items-center justify-center"
            >
              Get early access
              <ArrowRight className="ml-2 w-5 h-5" />
            </a>
            <a
              href="#how"
              className="border-2 border-white/60 hover:border-white text-white px-8 py-4 rounded-full text-lg font-semibold transition inline-flex items-center justify-center"
            >
              How it works
            </a>
          </div>
          <p className="text-sm opacity-70 mt-8">
            Built on public records, government feeds, and licensed data APIs.
            No ToS-violating scraping. No MLS data outside a broker license.
          </p>
        </div>
      </section>

      {/* Sources grid */}
      <section className="py-20 bg-gray-50" id="how">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Eight lead categories. One dashboard.
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Agents running 4+ concurrent lead sources close 40% more deals
              per year. We combine them — and de-dupe them — for you.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {sources.map((s) => (
              <div
                key={s.label}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-md transition"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mb-4">
                  <s.icon className="w-6 h-6 text-white" />
                </div>
                <div className="font-bold text-lg">{s.label}</div>
                <div className="text-sm text-gray-500 mt-1">{s.note}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Differentiators */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Deal Scout wins
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              The incumbents own MLS licensing. We win on speed, stacked
              motivation, and AI-drafted outreach.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {differentiators.map((d) => (
              <div
                key={d.title}
                className="p-8 rounded-2xl bg-gradient-to-br from-gray-50 to-white border border-gray-200"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center mb-4">
                  <d.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{d.title}</h3>
                <p className="text-gray-600 leading-relaxed">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            How it works
          </h2>
          <div className="space-y-6">
            {[
              {
                n: "1",
                t: "Tell us your market",
                b: "ZIP codes, price band, property types, minimum equity."
              },
              {
                n: "2",
                t: "We poll legal sources 24/7",
                b: "HUD / Fannie / Freddie REO, county NOD and tax-delinquent lists, probate filings, FSBO feeds, code-violation data, licensed public-record APIs."
              },
              {
                n: "3",
                t: "We score every property",
                b: "Base score + per-signal weights + stacking bonus for multi-motivation leads − staleness. 0–100 scale."
              },
              {
                n: "4",
                t: "You get the alert first",
                b: "Sub-minute push to email, SMS, or webhook with an AI-drafted first-touch letter tuned to the motivation type."
              },
              {
                n: "5",
                t: "You make the call",
                b: "Optional skip-trace and Twilio dial-out. Or export straight to your CRM."
              }
            ].map((s) => (
              <div
                key={s.n}
                className="flex gap-6 p-6 rounded-2xl bg-white/5 border border-white/10"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-full bg-yellow-400 text-gray-900 font-bold text-xl flex items-center justify-center">
                  {s.n}
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-1">{s.t}</h3>
                  <p className="opacity-80">{s.b}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Waitlist */}
      <section id="waitlist" className="py-24 bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-semibold text-blue-600 uppercase tracking-wide">
                Early access
              </span>
            </div>
            <h2 className="text-3xl font-bold mb-3">Get on the list</h2>
            <p className="text-gray-600 mb-8">
              Pilot markets go live this quarter. Early-access agents get 90
              days free and locked-in founding-member pricing.
            </p>

            {state === "ok" ? (
              <div className="flex items-center gap-3 p-4 rounded-xl bg-green-50 border border-green-200 text-green-800">
                <CheckCircle className="w-5 h-5" />
                <span>You're on the list. We'll reach out soon.</span>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Work email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@brokerage.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    Primary market (city or ZIP)
                  </label>
                  <input
                    type="text"
                    value={market}
                    onChange={(e) => setMarket(e.target.value)}
                    placeholder="Austin, TX or 78701"
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">
                    You are a
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none bg-white"
                  >
                    <option value="agent">Real estate agent</option>
                    <option value="investor">Investor / wholesaler</option>
                    <option value="broker">Broker / team lead</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <button
                  type="submit"
                  disabled={state === "submitting"}
                  className="w-full px-6 py-4 rounded-xl bg-gray-900 text-white font-bold hover:bg-gray-700 transition disabled:opacity-50 inline-flex items-center justify-center"
                >
                  {state === "submitting" ? (
                    "Submitting..."
                  ) : (
                    <>
                      Request early access
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </button>

                {state === "error" && (
                  <div className="text-sm text-red-600">
                    {errorMsg}. You can also email{" "}
                    <a href="mailto:hello@nuwavmedia.com" className="underline">
                      hello@nuwavmedia.com
                    </a>
                    .
                  </div>
                )}
              </form>
            )}

            <p className="text-xs text-gray-500 mt-6 flex items-start gap-2">
              <Mail className="w-4 h-4 flex-shrink-0 mt-0.5" />
              We never share your email. You can opt out any time.
            </p>
          </div>
        </div>
      </section>

      {/* Legal footer */}
      <footer className="py-10 border-t border-gray-200 text-center text-sm text-gray-500">
        <div className="max-w-5xl mx-auto px-4">
          <div className="flex items-center justify-center gap-2 mb-3">
            <TrendingUp className="w-4 h-4" />
            <span className="font-semibold">Deal Scout by Nu Wav Media</span>
          </div>
          <p>
            Deal Scout uses only public records, government REO feeds, and
            licensed data APIs. We do not scrape Zillow, Realtor.com, Trulia,
            or MLS IDX systems. MLS-licensed features are offered only through
            partnered brokers.
          </p>
          <p className="mt-2">
            © {new Date().getFullYear()} Nu Wav Media. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
