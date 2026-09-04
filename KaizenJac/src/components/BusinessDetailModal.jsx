import React from 'react';
import { X, CheckCircle, ShieldCheck, Anchor, ArrowRight, Building, Globe, GraduationCap, MapPin, Phone, Mail } from 'lucide-react';

export default function BusinessDetailModal({ business, siteData, onClose, onInquire }) {
  if (!business) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl text-white overflow-hidden my-8 animate-fadeIn">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: business.accentColor }}
            ></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {business.badge}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 md:p-8 space-y-8 max-h-[80vh] overflow-y-auto custom-scrollbar">
          
          {/* Banner & Title */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-7 space-y-3">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
                {business.name}
              </h2>
              <p className="text-sm text-slate-300 italic">
                "{business.tagline}"
              </p>
              <p className="text-xs text-slate-400 leading-relaxed">
                {business.overview}
              </p>
            </div>

            <div className="md:col-span-5 rounded-xl overflow-hidden border border-slate-800 shadow-md">
              <img
                src={business.image}
                alt={business.name}
                className="w-full h-48 object-cover"
              />
            </div>
          </div>

          {/* Target Audience */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Who We Serve (Target Audience)
            </h4>
            <p className="text-sm font-medium text-blue-400">
              {business.targetAudience}
            </p>
          </div>

          {/* Core Capabilities */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <span>Core Operational Capabilities</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {business.keyCapabilities.map((cap, idx) => (
                <div key={idx} className="p-3 rounded-lg bg-slate-800/60 border border-slate-700/50 flex items-start gap-3">
                  <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="text-xs text-slate-300">{cap}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detailed Service Offerings */}
          <div className="space-y-4">
            <h3 className="text-base font-bold text-white">
              Service Breakdown & Scope
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {business.services.map((srv, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                  <div className="text-xs font-bold text-white flex items-center justify-between">
                    <span>{srv.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">0{idx + 1}</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {srv.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Business Distinction / Why Us */}
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
              The Kaizen Distinction
            </h4>
            <div className="space-y-2">
              {business.whyUs.map((w, idx) => (
                <div key={idx} className="text-xs text-slate-300 flex items-start gap-2">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{w}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Specific Attributes (Projects / Ports / Training Model) */}
          {business.featuredProjects && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Sample Architectural Projects & Concepts
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {business.featuredProjects.map((p, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50 space-y-1">
                    <div className="text-xs font-bold text-white">{p.name}</div>
                    <div className="text-[11px] text-blue-400">{p.type} • {p.location}</div>
                    <div className="text-[10px] text-slate-400">{p.highlights}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {business.ports && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Primary Ports of Trade & Customs Operation
              </h4>
              <div className="flex flex-wrap gap-2">
                {business.ports.map((port, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-teal-300 font-medium">
                    <Anchor className="w-3.5 h-3.5 text-teal-400" />
                    <span>{port}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Bar */}
        <div className="p-6 border-t border-slate-800 bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-400">
            Official Email: <span className="text-white font-mono">{siteData.contacts.primaryEmail}</span>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onClose}
              className="flex-1 sm:flex-initial px-5 py-2.5 rounded-xl text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              Close Window
            </button>

            <button
              onClick={() => {
                onClose();
                onInquire(business.name);
              }}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all"
            >
              <span>Inquire About {business.shortTitle}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
