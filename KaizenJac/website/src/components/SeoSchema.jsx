import React, { useEffect } from 'react';

export default function SeoSchema({ siteData }) {
  useEffect(() => {
    // Injects JSON-LD schema for Google SEO
    const schemaData = {
      "@context": "https://schema.org",
      "@graph": [
        {
          "@type": "Organization",
          "@id": "https://kaizenjac.com/#organization",
          "name": siteData.umbrella.name,
          "url": siteData.meta.siteUrl,
          "email": siteData.contacts.primaryEmail,
          "telephone": siteData.contacts.phones[0],
          "description": siteData.umbrella.intro,
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Dhaka",
            "addressCountry": "BD"
          },
          "subOrganization": siteData.businesses.map(b => ({
            "@type": "Organization",
            "name": b.name,
            "description": b.summary
          }))
        },
        {
          "@type": "RealEstateAgent",
          "name": "Kaizen Design & Development",
          "telephone": siteData.contacts.phones[0],
          "email": siteData.contacts.primaryEmail,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "House #101, Road 04, Block #D, Mohanogor Project, Rampura",
            "addressLocality": "Dhaka",
            "addressCountry": "BD"
          }
        },
        {
          "@type": "EducationalOrganization",
          "name": "Kaizen Training Center",
          "description": "Technical and Vocational Education and Training Institute",
          "address": {
            "@type": "PostalAddress",
            "addressLocality": "Dhaka",
            "addressCountry": "BD"
          }
        }
      ]
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = 'json-ld-schema';
    script.innerHTML = JSON.stringify(schemaData);

    const existingScript = document.getElementById('json-ld-schema');
    if (existingScript) {
      existingScript.remove();
    }
    document.head.appendChild(script);

    // Dynamic Title & Meta Tags
    document.title = siteData.meta.title;
  }, [siteData]);

  return null;
}
