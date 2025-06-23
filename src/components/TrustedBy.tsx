import React from 'react';

export function TrustedBy() {
  const companies = [
    { name: 'TechCorp', width: 120 },
    { name: 'DataFlow', width: 100 },
    { name: 'CloudBase', width: 110 },
    { name: 'StartupX', width: 90 },
    { name: 'ScaleUp', width: 105 },
    { name: 'InnovateLab', width: 130 }
  ];

  return (
    <section className="py-16 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-6">
        <p className="text-center text-slate-400 text-sm font-medium mb-8">
          Trusted by forward-thinking companies
        </p>
        <div className="flex items-center justify-center space-x-12 opacity-60">
          {companies.map((company, index) => (
            <div
              key={index}
              className="h-8 bg-slate-600 rounded"
              style={{ width: company.width }}
              title={company.name}
            />
          ))}
        </div>
      </div>
    </section>
  );
}