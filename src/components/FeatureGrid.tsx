import React from 'react';
import { TrendingUp, Bell, ShieldCheck } from 'lucide-react';

export function FeatureGrid() {
  const features = [
    {
      icon: TrendingUp,
      title: 'Continuous Forecasts',
      description: 'Real-time Prophet models predict traffic patterns and anomalies before they impact your business metrics.'
    },
    {
      icon: Bell,
      title: 'Slack Anomaly Alerts',
      description: 'Instant notifications when traffic spikes or drops beyond thresholds, delivered directly to your team channels.'
    },
    {
      icon: ShieldCheck,
      title: 'Zero PII Stored',
      description: 'Differential privacy with client-side noise injection ensures user anonymity while maintaining data utility.'
    }
  ];

  return (
    <section className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center mb-6">
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">{feature.title}</h3>
              <p className="text-slate-300 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}