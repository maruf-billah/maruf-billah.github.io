import React, { useState, useEffect } from 'react';
import { Menu, X, Phone, Mail, Settings, ChevronRight } from 'lucide-react';

export default function Navbar({ siteData, activeSection, onOpenCms }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'Home', href: '#home' },
    { name: 'About', href: '#about' },
    { name: 'Businesses', href: '#businesses' },
    { name: 'Why Kaizen', href: '#philosophy' },
    { name: 'Contact', href: '#contact' },
  ];

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shadow-lg py-3' 
        : 'bg-slate-900/80 backdrop-blur-sm border-b border-slate-800/50 py-5'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Logo & Brand Identity (Clean KAIZEN JAC without Corporate Group subtitle) */}
          <a href="#home" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-600 via-teal-500 to-amber-500 p-[2px] shadow-md group-hover:scale-105 transition-transform">
              <div className="w-full h-full bg-slate-900 rounded-[6px] flex items-center justify-center font-bold text-lg text-white tracking-wider">
                KJ
              </div>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-bold text-white tracking-tight leading-none group-hover:text-blue-400 transition-colors">
                KAIZEN JAC
              </span>
            </div>
          </a>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-slate-800/40 p-1.5 rounded-full border border-slate-700/50">
            {navLinks.map((link) => (
              <a
                key={link.name}
                href={link.href}
                className={`px-5 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  activeSection === link.name.toLowerCase()
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700/50'
                }`}
              >
                {link.name}
              </a>
            ))}
          </nav>

          {/* Right Action Controls */}
          <div className="hidden lg:flex items-center gap-4">
            <a
              href={`tel:${siteData.contacts.phones[0]}`}
              className="flex items-center gap-2 text-xs font-semibold text-slate-300 hover:text-blue-400 transition-colors px-3 py-1.5 rounded-md hover:bg-slate-800/50"
            >
              <Phone className="w-3.5 h-3.5 text-blue-400" />
              <span>{siteData.contacts.phones[0]}</span>
            </a>
            
            <a
              href="#contact"
              className="inline-flex items-center gap-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 px-4 py-2.5 rounded-lg shadow-md hover:shadow-blue-500/20 transition-all"
            >
              <span>Get In Touch</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </a>

            {/* Dynamic CMS Editor Button */}
            <button
              onClick={onOpenCms}
              title="Open Dynamic Content Manager"
              className="p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-amber-400 hover:bg-slate-700 border border-slate-700 transition-all"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenCms}
              className="p-2 rounded-md bg-slate-800 text-slate-300 border border-slate-700"
              title="CMS"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900 border-b border-slate-800 px-4 pt-4 pb-6 space-y-3 animate-fadeIn">
          {navLinks.map((link) => (
            <a
              key={link.name}
              href={link.href}
              onClick={() => setMobileMenuOpen(false)}
              className="block px-4 py-2.5 rounded-lg text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-4 border-t border-slate-800 space-y-3">
            <a
              href={`tel:${siteData.contacts.phones[0]}`}
              className="flex items-center gap-3 text-sm text-slate-300 px-4 py-2"
            >
              <Phone className="w-4 h-4 text-blue-400" />
              <span>{siteData.contacts.phones[0]}</span>
            </a>
            <a
              href={`mailto:${siteData.contacts.primaryEmail}`}
              className="flex items-center gap-3 text-sm text-slate-300 px-4 py-2"
            >
              <Mail className="w-4 h-4 text-teal-400" />
              <span>{siteData.contacts.primaryEmail}</span>
            </a>
            <a
              href="#contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block w-full text-center text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 py-3 rounded-lg shadow-md"
            >
              Explore Contact Form
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
