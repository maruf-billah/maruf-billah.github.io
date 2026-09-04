import React from 'react';
import { Award, ShieldCheck, Zap, RefreshCw } from 'lucide-react';

export default function KaizenPhilosophy({ siteData }) {
  const pillars = [
    {
      icon: <RefreshCw className="w-6 h-6 text-blue-400" />,
      title: "The Kaizen Audit Methodology",
      description: "Relentlessly reviewing construction workflows, trade documentation, and TVET curriculums to eliminate delays, waste, and inefficiency."
    },
    {
      icon: <ShieldCheck className="w-6 h-6 text-emerald-400" />,
      title: "Uncompromising Quality Control",
      description: "BUET-tested structural steel for real estate, BSTI/FDA/HACCP compliance for trade, and hands-on certified instructors for training."
    },
    {
      icon: <Zap className="w-6 h-6 text-teal-400" />,
      title: "Agile Supply & Handover Execution",
      description: "Punctual property handovers, zero-demurrage L/C trade clearance, and day-one employment-ready vocational graduates."
    },
    {
      icon: <Award className="w-6 h-6 text-amber-400" />,
      title: "Transparency & Ethical Governance",
      description: "Fair joint-venture asset sharing for landowners, compliant international trade financing, and high-impact social empowerment."
    }
  ];

  return (
    <section id="philosophy" className="py-20 md:py-28 bg-slate-900 text-white border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-amber-950/60 border border-amber-800/60 text-amber-400 text-xs font-bold uppercase tracking-wider">
            Why Kaizen JAC
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Built on Continuous Improvement
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Our organizational strengths are grounded in empirical quality standards, rigorous safety protocols, and operational discipline.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((p, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-all duration-300 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-4">
                <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 inline-block">
                  {p.icon}
                </div>
                <h3 className="text-base font-bold text-white">
                  {p.title}
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {p.description}
                </p>
              </div>
              <div className="pt-4 border-t border-slate-900 text-[10px] text-slate-400 uppercase font-mono tracking-wider">
                Pillar 0{idx + 1}
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
