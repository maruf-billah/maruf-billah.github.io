import React from 'react';
import { Phone, Mail, MapPin, ArrowUp } from 'lucide-react';

export default function Footer({ siteData }) {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-900 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          
          {/* Col 1 & 2: Umbrella Brand Overview */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 via-teal-500 to-amber-500 p-[2px]">
                <div className="w-full h-full bg-slate-950 rounded-[6px] flex items-center justify-center font-bold text-sm text-white">
                  KJ
                </div>
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                KAIZEN JAC
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              {siteData.umbrella.intro}
            </p>

            <div className="text-[11px] text-slate-500 font-mono">
              Continuous Improvement • Japanese Methodology (改善)
            </div>
          </div>

          {/* Col 3: Navigation */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Navigation
            </h4>
            <ul className="space-y-2 text-xs">
              <li><a href="#home" className="hover:text-white transition-colors">Home</a></li>
              <li><a href="#about" className="hover:text-white transition-colors">About Kaizen JAC</a></li>
              <li><a href="#businesses" className="hover:text-white transition-colors">Business Divisions</a></li>
              <li><a href="#philosophy" className="hover:text-white transition-colors">Why Choose Us</a></li>
              <li><a href="#contact" className="hover:text-white transition-colors">Contact Corporate Office</a></li>
            </ul>
          </div>

          {/* Col 4: Business Divisions */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Our Businesses
            </h4>
            <ul className="space-y-2 text-xs">
              {siteData.businesses.map(b => (
                <li key={b.id}>
                  <a href="#businesses" className="hover:text-blue-400 transition-colors">
                    {b.name}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 5: Contact Summary */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Contact Channels
            </h4>
            <div className="space-y-2 text-xs">
              <a href={`tel:${siteData.contacts.phones[0]}`} className="flex items-center gap-2 hover:text-white transition-colors">
                <Phone className="w-3.5 h-3.5 text-blue-400" />
                <span>{siteData.contacts.phones[0]}</span>
              </a>
              <a href={`mailto:${siteData.contacts.primaryEmail}`} className="flex items-center gap-2 hover:text-white transition-colors font-mono">
                <Mail className="w-3.5 h-3.5 text-teal-400" />
                <span>{siteData.contacts.primaryEmail}</span>
              </a>
              <div className="flex items-start gap-2 text-slate-500 text-[11px] pt-1">
                <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                <span>Rampura, Banani & Bashundhara R/A, Dhaka, Bangladesh</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright & Back to Top Bar */}
        <div className="pt-8 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div>
            © {new Date().getFullYear()} <span className="text-slate-300 font-semibold">Kaizen JAC</span>. All Rights Reserved.
          </div>

          <div className="flex items-center gap-6">
            <a href="#contact" className="hover:text-white transition-colors">Privacy Policy</a>
            <a href="#contact" className="hover:text-white transition-colors">Terms of Service</a>
            
            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Back to top"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
}
