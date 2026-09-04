import React, { useState } from 'react';
import { siteData as initialSiteData } from './data/siteData';
import SeoSchema from './components/SeoSchema';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import AboutSection from './components/AboutSection';
import BusinessesSection from './components/BusinessesSection';
import KaizenPhilosophy from './components/KaizenPhilosophy';
import ContactSection from './components/ContactSection';
import Footer from './components/Footer';
import CmsDrawer from './components/CmsDrawer';

export default function App() {
  const [siteData, setSiteData] = useState(initialSiteData);
  const [selectedBusinessId, setSelectedBusinessId] = useState('design-dev');
  const [cmsOpen, setCmsOpen] = useState(false);
  const [preselectedInquiryBusiness, setPreselectedInquiryBusiness] = useState('');

  const handleSelectBusinessFromHero = (businessId) => {
    setSelectedBusinessId(businessId);
    const element = document.getElementById('businesses');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleInquireFromBusiness = (businessName) => {
    setPreselectedInquiryBusiness(businessName);
    const element = document.getElementById('contact');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSaveDynamicContent = (newData) => {
    setSiteData(newData);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-blue-600 selection:text-white antialiased">
      
      {/* Injects dynamic SEO metadata & JSON-LD Structured Schema */}
      <SeoSchema siteData={siteData} />

      {/* Navigation Bar */}
      <Navbar
        siteData={siteData}
        onOpenCms={() => setCmsOpen(true)}
      />

      {/* Main Content Sections */}
      <main>
        <Hero
          siteData={siteData}
          onSelectBusiness={handleSelectBusinessFromHero}
        />

        <AboutSection
          siteData={siteData}
        />

        <BusinessesSection
          siteData={siteData}
          selectedBusinessId={selectedBusinessId}
          onInquire={handleInquireFromBusiness}
        />

        <KaizenPhilosophy
          siteData={siteData}
        />

        <ContactSection
          siteData={siteData}
          preselectedBusiness={preselectedInquiryBusiness}
        />
      </main>

      {/* Footer */}
      <Footer
        siteData={siteData}
      />

      {/* Dynamic Content Editor Drawer */}
      <CmsDrawer
        isOpen={cmsOpen}
        onClose={() => setCmsOpen(false)}
        siteData={siteData}
        onSaveData={handleSaveDynamicContent}
      />

    </div>
  );
}
