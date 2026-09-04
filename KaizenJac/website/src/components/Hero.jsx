import React from 'react';
import { ArrowRight, Building2, Globe2, GraduationCap } from 'lucide-react';

export default function Hero({ siteData, onSelectBusiness }) {
  return (
    <section id="home" className="relative pt-32 pb-20 md:pt-44 md:pb-32 bg-slate-950 text-white overflow-hidden">
      {/* Subtle Background Accent Grid & Glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b15_1px,transparent_1px),linear-gradient(to_bottom,#1e293b15_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          
          {/* Headline */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1]">
            Continuous Improvement. <br />
            <span className="bg-gradient-to-r from-blue-400 via-teal-300 to-amber-400 bg-clip-text text-transparent">
              Unified Excellence.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-slate-300 max-w-2xl mx-auto font-normal leading-relaxed">
            {siteData.umbrella.intro}
          </p>

          {/* Primary Action CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <a
              href="#businesses"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-3 px-8 py-4 rounded-xl text-base font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-600/25 hover:shadow-blue-500/40 transition-all duration-200"
            >
              <span>Explore Our Businesses</span>
              <ArrowRight className="w-5 h-5" />
            </a>

            <a
              href="#contact"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 transition-all duration-200"
            >
              <span>Contact Us</span>
            </a>
          </div>

          {/* Quick Division Selector Pills */}
          <div className="pt-8">
            <p className="text-xs uppercase tracking-widest text-slate-400 font-semibold mb-4">
              Explore Our Three Core Divisions
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={() => onSelectBusiness('design-dev')}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-slate-900/80 hover:bg-blue-950/40 border border-slate-800 hover:border-blue-700/60 text-slate-300 hover:text-white transition-all text-xs font-semibold"
              >
                <Building2 className="w-4 h-4 text-blue-400" />
                <span>Design & Development</span>
              </button>

              <button
                onClick={() => onSelectBusiness('enterprise')}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-slate-900/80 hover:bg-teal-950/40 border border-slate-800 hover:border-teal-700/60 text-slate-300 hover:text-white transition-all text-xs font-semibold"
              >
                <Globe2 className="w-4 h-4 text-teal-400" />
                <span>Enterprise (Trade)</span>
              </button>

              <button
                onClick={() => onSelectBusiness('training-center')}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-lg bg-slate-900/80 hover:bg-amber-950/40 border border-slate-800 hover:border-amber-700/60 text-slate-300 hover:text-white transition-all text-xs font-semibold"
              >
                <GraduationCap className="w-4 h-4 text-amber-400" />
                <span>Training Center</span>
              </button>
            </div>
          </div>

        </div>

        {/* Stats Grid Banner */}
        <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
          {siteData.umbrella.stats.map((stat, idx) => (
            <div key={idx} className="text-center p-4 border-r last:border-r-0 border-slate-800/60">
              <div className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {stat.value}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-1">
                {stat.label}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
