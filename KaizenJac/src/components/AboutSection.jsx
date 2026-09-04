import React, { useState } from 'react';
import { Target, Eye, Sparkles, CheckCircle2 } from 'lucide-react';

export default function AboutSection({ siteData }) {
  const [activeTab, setActiveTab] = useState('mission');

  return (
    <section id="about" className="py-20 md:py-28 bg-slate-900 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column - Concise Story */}
          <div className="lg:col-span-6 space-y-6">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-blue-400">
              <Sparkles className="w-4 h-4" />
              <span>Who We Are</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
              One Unified Brand. <br />
              <span className="text-slate-400">Three Specialist Divisions.</span>
            </h2>

            <p className="text-slate-300 text-base leading-relaxed">
              {siteData.umbrella.intro}
            </p>

            <div className="p-6 rounded-xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <h3 className="text-sm font-bold text-amber-400 uppercase tracking-wider">
                The Kaizen Philosophy (改善)
              </h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                {siteData.umbrella.philosophy} Across construction blueprints, international trade contracts, and vocational workshop training, we apply continuous audit and refinement to eliminate inefficiency and deliver maximum value.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {[
                "Strict BNBC & BUET Structural QC",
                "Temperature-Controlled Cold Chain",
                "80% Practical TVET Methodology",
                "Seamless L/C & Trade Compliance"
              ].map((item, idx) => (
                <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - Mission & Vision Interactive Card */}
          <div className="lg:col-span-6">
            <div className="bg-slate-950 p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
              
              {/* Tab Nav */}
              <div className="flex p-1 bg-slate-900 rounded-xl border border-slate-800">
                <button
                  onClick={() => setActiveTab('mission')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'mission'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Target className="w-4 h-4" />
                  <span>Our Mission</span>
                </button>

                <button
                  onClick={() => setActiveTab('vision')}
                  className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-bold transition-all ${
                    activeTab === 'vision'
                      ? 'bg-blue-600 text-white shadow-md'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Eye className="w-4 h-4" />
                  <span>Our Vision</span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="min-h-[160px] flex items-center">
                {activeTab === 'mission' ? (
                  <div className="space-y-4 animate-fadeIn">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      To enrich urban lifestyles through BNBC-compliant architectural engineering, simplify global multi-commodity supply chains, and deliver high-impact vocational training that empowers youth and elevates national economic growth.
                    </p>
                    <div className="text-xs text-blue-400 font-semibold uppercase tracking-wider">
                      Driven by Sourcing Excellence & Safety Standards
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4 animate-fadeIn">
                    <p className="text-sm text-slate-300 leading-relaxed">
                      To become South Asia's most trusted corporate landmark—renowned for constructing structural masterworks, setting international commodity trade benchmarks, and producing ethically disciplined, world-class technical workforce assets.
                    </p>
                    <div className="text-xs text-teal-400 font-semibold uppercase tracking-wider">
                      Empowering Regional Growth & Overseas Careers
                    </div>
                  </div>
                )}
              </div>

              {/* Group Ecosystem Pillars */}
              <div className="pt-4 border-t border-slate-800 grid grid-cols-3 gap-3 text-center">
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-xs font-bold text-blue-400">Design</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Real Estate</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-xs font-bold text-teal-400">Enterprise</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Global Trade</div>
                </div>
                <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800">
                  <div className="text-xs font-bold text-amber-400">Training</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Vocational TVET</div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
