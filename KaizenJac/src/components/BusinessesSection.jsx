import React, { useState } from 'react';
import { Building2, Globe2, GraduationCap, CheckCircle, ArrowRight, Layers, Users, ExternalLink, Building, Clock, MapPin, Award, ShieldCheck, ChevronRight } from 'lucide-react';
import BusinessDetailModal from './BusinessDetailModal';

export default function BusinessesSection({ siteData, selectedBusinessId, onInquire }) {
  const [activeTab, setActiveTab] = useState(selectedBusinessId || 'design-dev');
  const [modalBusiness, setModalBusiness] = useState(null);
  const [selectedProject, setSelectedProject] = useState(null);

  const getIcon = (id) => {
    switch (id) {
      case 'design-dev':
        return <Building2 className="w-5 h-5 text-blue-400" />;
      case 'enterprise':
        return <Globe2 className="w-5 h-5 text-teal-400" />;
      case 'training-center':
        return <GraduationCap className="w-5 h-5 text-amber-400" />;
      default:
        return <Building2 className="w-5 h-5 text-blue-400" />;
    }
  };

  const currentBusiness = siteData.businesses.find(b => b.id === activeTab) || siteData.businesses[0];

  return (
    <section id="businesses" className="py-20 md:py-28 bg-slate-950 text-white relative">
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-teal-400">
            <Layers className="w-4 h-4" />
            <span>Three Specialist Pillars</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-white">
            Focused & Detailed Business Divisions
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Explore complete operational capabilities, active projects, commodity catalogs, and TVET program details for each Kaizen division.
          </p>
        </div>

        {/* Division Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {siteData.businesses.map((b) => {
            const isActive = activeTab === b.id;
            return (
              <button
                key={b.id}
                onClick={() => setActiveTab(b.id)}
                className={`p-5 rounded-2xl text-left border transition-all duration-300 flex items-start gap-4 ${
                  isActive
                    ? 'bg-slate-900 border-slate-700 shadow-xl ring-2 ring-blue-500/20'
                    : 'bg-slate-900/40 border-slate-800/80 hover:bg-slate-900/80 hover:border-slate-700'
                }`}
              >
                <div className={`p-3 rounded-xl ${
                  isActive ? 'bg-slate-800 border border-slate-700' : 'bg-slate-950 border border-slate-800'
                }`}>
                  {getIcon(b.id)}
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-slate-400 block">
                    {b.badge}
                  </span>
                  <span className="text-base font-bold text-white block">
                    {b.name}
                  </span>
                  <span className="text-xs text-slate-400 block line-clamp-1">
                    {b.shortTitle}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Business Showcase View */}
        <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 sm:p-8 md:p-10 shadow-2xl space-y-12">
          
          {/* Top Overview & Media Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Visual Image Showcase */}
            <div className="lg:col-span-6 space-y-4">
              <div className="relative rounded-2xl overflow-hidden border border-slate-800 shadow-lg group">
                <img
                  src={currentBusiness.image}
                  alt={currentBusiness.name}
                  className="w-full h-72 sm:h-80 object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>
                <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-xs text-slate-300">
                  <span className="px-3 py-1 rounded-md bg-slate-900/90 border border-slate-800 font-semibold text-white">
                    {currentBusiness.badge}
                  </span>
                  <span className="font-mono text-slate-400">Kaizen JAC</span>
                </div>
              </div>
            </div>

            {/* Division Detail Content */}
            <div className="lg:col-span-6 space-y-5">
              <div className="inline-block px-3 py-1 rounded-md bg-blue-950/60 border border-blue-800/60 text-blue-400 text-xs font-bold uppercase tracking-wider">
                {currentBusiness.shortTitle}
              </div>

              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                {currentBusiness.name}
              </h3>

              <p className="text-xs sm:text-sm text-slate-300 italic">
                "{currentBusiness.tagline}"
              </p>

              <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
                {currentBusiness.overview}
              </p>

              {/* Target Audience Pill */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-3">
                <Users className="w-4 h-4 text-blue-400 shrink-0" />
                <div className="text-xs text-slate-300">
                  <span className="font-bold text-white">Who We Serve: </span>
                  <span>{currentBusiness.targetAudience}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => setModalBusiness(currentBusiness)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-all"
                >
                  <ExternalLink className="w-4 h-4 text-amber-400" />
                  <span>Inspect Full Division Specs</span>
                </button>

                <button
                  onClick={() => onInquire(currentBusiness.name)}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold text-white bg-blue-600 hover:bg-blue-500 shadow-md transition-all"
                >
                  <span>Inquire Now</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>

            </div>

          </div>

          {/* Capabilities & Detailed Services Grid */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pt-8 border-t border-slate-800">
            
            {/* Key Capabilities */}
            <div className="md:col-span-5 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Key Operational Capabilities
              </h4>
              <div className="space-y-3">
                {currentBusiness.keyCapabilities.map((cap, idx) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 flex items-start gap-3">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span className="text-xs text-slate-300 leading-snug">{cap}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Services Grid */}
            <div className="md:col-span-7 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                Core Service Offerings
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {currentBusiness.services.map((srv, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors space-y-1.5">
                    <div className="text-xs font-bold text-white">
                      {srv.name}
                    </div>
                    <div className="text-[11px] text-slate-400 leading-relaxed">
                      {srv.desc}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* NEW: Detailed Projects, Trade Catalog & TVET Program Showcase */}
          {currentBusiness.projects && currentBusiness.projects.length > 0 && (
            <div className="pt-8 border-t border-slate-800 space-y-6">
              
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h4 className="text-lg font-bold text-white flex items-center gap-2">
                    <Building className="w-5 h-5 text-blue-400" />
                    <span>
                      {currentBusiness.id === 'design-dev' && 'Active Real Estate Projects & Ventures'}
                      {currentBusiness.id === 'enterprise' && 'Multi-Commodity Trade Portfolios & Supply Lines'}
                      {currentBusiness.id === 'training-center' && 'Vocational Training Programs & Migration Modules'}
                    </span>
                  </h4>
                  <p className="text-xs text-slate-400 mt-1">
                    Click any project card below to inspect full specifications, locations, and floor plans.
                  </p>
                </div>

                <div className="text-xs font-mono text-slate-500">
                  Total Entries: {currentBusiness.projects.length}
                </div>
              </div>

              {/* Projects Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentBusiness.projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-5 rounded-2xl bg-slate-950 border border-slate-800 hover:border-blue-600/60 transition-all duration-200 space-y-3 group flex flex-col justify-between"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-blue-950/80 border border-blue-800/60 text-blue-400 text-[10px] font-bold uppercase tracking-wider">
                          {proj.category}
                        </span>
                        {proj.status && (
                          <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                            {proj.status}
                          </span>
                        )}
                      </div>

                      <h5 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                        {proj.name}
                      </h5>

                      {(proj.location || proj.duration) && (
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                          {proj.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-slate-500" />
                              {proj.location}
                            </span>
                          )}
                          {proj.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5 text-amber-400" />
                              {proj.duration}
                            </span>
                          )}
                        </div>
                      )}

                      <p className="text-xs text-slate-300 leading-relaxed pt-1">
                        {proj.description}
                      </p>

                      <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-850 text-[11px] text-slate-400 space-y-1">
                        <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">Highlights & Specifications:</div>
                        <div>{proj.highlights}</div>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-slate-900 flex items-center justify-between text-xs">
                      <span className="text-[10px] text-slate-500 font-mono">
                        ID: {proj.id}
                      </span>
                      <button
                        onClick={() => setSelectedProject(proj)}
                        className="flex items-center gap-1 font-semibold text-blue-400 hover:text-blue-300 transition-colors"
                      >
                        <span>View Details</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>

                  </div>
                ))}
              </div>

            </div>
          )}

        </div>

      </div>

      {/* Expanded Detail Modal for Business */}
      {modalBusiness && (
        <BusinessDetailModal
          business={modalBusiness}
          siteData={siteData}
          onClose={() => setModalBusiness(null)}
          onInquire={onInquire}
        />
      )}

      {/* Single Project Quick Inspector Modal */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl text-white space-y-4 animate-fadeIn">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-blue-400">
                {selectedProject.category}
              </span>
              <button
                onClick={() => setSelectedProject(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <h3 className="text-xl font-bold text-white">
              {selectedProject.name}
            </h3>

            {selectedProject.location && (
              <div className="text-xs text-slate-300 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-400" />
                <span>{selectedProject.location}</span>
              </div>
            )}

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedProject.description}
            </p>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-amber-400">Key Features & Technical Specs</div>
              <div className="text-xs text-slate-300 leading-relaxed">{selectedProject.highlights}</div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setSelectedProject(null)}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-xs font-bold text-white shadow-md"
              >
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}

    </section>
  );
}
