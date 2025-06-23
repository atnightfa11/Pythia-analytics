import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Play } from 'lucide-react';
import { SiteNav } from './SiteNav';
import { TrustedBy } from './TrustedBy';
import { FeatureGrid } from './FeatureGrid';
import { Footer } from './Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Navigation */}
      <SiteNav />

      {/* Hero Section */}
      <main className="relative z-10 px-6 pt-16 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Privacy-first analytics that
              <span className="block bg-gradient-to-r from-sky-400 to-teal-300 bg-clip-text text-transparent">
                predicts what happens next
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Anomaly alerts, noise-injected tracking, no cookies.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
              >
                Start for Free <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/dashboard"
                className="px-8 py-4 border-2 border-slate-600 hover:border-slate-500 text-white rounded-xl font-semibold text-lg transition-all duration-200 hover:bg-slate-800/50 flex items-center justify-center gap-2"
              >
                <Play className="w-5 h-5" />
                View Demo
              </Link>
            </div>
          </div>
        </div>
      </main>

      {/* Trusted By */}
      <TrustedBy />

      {/* Feature Grid */}
      <FeatureGrid />

      {/* Footer */}
      <Footer />

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}