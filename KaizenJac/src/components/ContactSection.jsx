import React, { useState } from 'react';
import { Mail, Phone, MapPin, Send, CheckCircle2, Clock, Building, Globe, GraduationCap } from 'lucide-react';

export default function ContactSection({ siteData, preselectedBusiness }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    businessInterest: preselectedBusiness || 'Kaizen Design & Development',
    message: ''
  });

  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        businessInterest: 'Kaizen Design & Development',
        message: ''
      });
    }, 4000);
  };

  return (
    <section id="contact" className="py-20 md:py-28 bg-slate-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-block px-3 py-1 rounded-full bg-blue-950/60 border border-blue-800/60 text-blue-400 text-xs font-bold uppercase tracking-wider">
            Contact Kaizen JAC
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white">
            Let's Discuss Your Project
          </h2>
          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Connect directly with our corporate team or specific division specialists for joint ventures, trade inquiries, or training admissions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Left Column - Contact Info & Addresses */}
          <div className="lg:col-span-5 space-y-8">
            
            {/* Quick Contact Cards */}
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Primary Contact Channels
              </h3>

              <a
                href={`tel:${siteData.contacts.phones[0]}`}
                className="flex items-center gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-blue-700/60 transition-colors group"
              >
                <div className="p-3 rounded-lg bg-blue-950/60 text-blue-400 group-hover:scale-105 transition-transform">
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Call Mobile Directly</div>
                  <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                    {siteData.contacts.phones[0]}
                  </div>
                </div>
              </a>

              <a
                href={`mailto:${siteData.contacts.primaryEmail}`}
                className="flex items-center gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-teal-700/60 transition-colors group"
              >
                <div className="p-3 rounded-lg bg-teal-950/60 text-teal-400 group-hover:scale-105 transition-transform">
                  <Mail className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Official Email</div>
                  <div className="text-sm font-bold text-white group-hover:text-teal-400 transition-colors font-mono">
                    {siteData.contacts.primaryEmail}
                  </div>
                </div>
              </a>

              <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="p-3 rounded-lg bg-slate-900 text-slate-400">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs text-slate-400">Business Hours</div>
                  <div className="text-xs font-semibold text-slate-300">
                    {siteData.contacts.workingHours}
                  </div>
                </div>
              </div>
            </div>

            {/* Office Locations Cards */}
            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
                Corporate Office Locations
              </h3>

              <div className="space-y-3">
                {siteData.umbrella.offices.map((office, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                      <span>{office.title}</span>
                    </div>
                    <div className="text-xs text-slate-400 pl-5 leading-relaxed">
                      {office.address}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Right Column - Clean Contact Form */}
          <div className="lg:col-span-7">
            <div className="p-8 rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl relative">
              
              {submitted ? (
                <div className="py-16 text-center space-y-4 animate-fadeIn">
                  <div className="w-16 h-16 rounded-full bg-emerald-950/80 border border-emerald-700 text-emerald-400 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">Inquiry Received</h3>
                  <p className="text-sm text-slate-300 max-w-md mx-auto">
                    Thank you for reaching out to Kaizen JAC. Our corporate team will review your inquiry and contact you promptly.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-white">Send an Enquiry</h3>
                    <p className="text-xs text-slate-400">
                      Fill out the essential details below and select your division of interest.
                    </p>
                  </div>

                  {/* Name & Email Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">
                        Full Name <span className="text-blue-400">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your full name"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">
                        Email Address <span className="text-blue-400">*</span>
                      </label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="you@company.com"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  {/* Phone & Business Interest Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">
                        Phone Number <span className="text-slate-500">(Optional)</span>
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="01755520178"
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-slate-300">
                        Business Division of Interest <span className="text-blue-400">*</span>
                      </label>
                      <select
                        value={formData.businessInterest}
                        onChange={(e) => setFormData({ ...formData, businessInterest: e.target.value })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
                      >
                        <option value="Kaizen Design & Development">Kaizen Design & Development</option>
                        <option value="Kaizen Enterprise">Kaizen Enterprise</option>
                        <option value="Kaizen Training Center">Kaizen Training Center</option>
                        <option value="General Kaizen JAC Inquiry">General Kaizen JAC Inquiry</option>
                      </select>
                    </div>
                  </div>

                  {/* Message Field */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">
                      Message / Project Scope <span className="text-blue-400">*</span>
                    </label>
                    <textarea
                      required
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      placeholder="Briefly describe your project, land location, trade requirements, or training inquiry..."
                      className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 shadow-lg shadow-blue-600/25 transition-all"
                  >
                    <Send className="w-4 h-4" />
                    <span>Submit Corporate Inquiry</span>
                  </button>

                </form>
              )}

            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
