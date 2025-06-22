import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Shield, 
  TrendingUp, 
  Zap, 
  Eye, 
  Lock, 
  BarChart3,
  ArrowRight,
  Users,
  Globe,
  Bell
} from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-white">Pythia Analytics</span>
          </div>
          <Link
            to="/dashboard"
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-lg font-medium transition-all duration-200 hover:scale-105"
          >
            View Dashboard
          </Link>
        </nav>
      </header>

      {/* Hero Section */}
      <main className="relative z-10 px-6 pt-16 pb-32">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h1 className="text-5xl md:text-7xl font-bold text-white mb-8 leading-tight">
              Privacy-First
              <span className="block bg-gradient-to-r from-sky-400 to-teal-300 bg-clip-text text-transparent">
                Predictive Analytics
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-slate-300 mb-12 max-w-4xl mx-auto leading-relaxed">
              Cookieless analytics with differential privacy, real-time forecasting, and intelligent alerts. 
              Respect user privacy while gaining powerful insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/dashboard"
                className="px-8 py-4 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105 flex items-center justify-center gap-2"
              >
                Get Started <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                to="/integration"
                className="px-8 py-4 border-2 border-slate-600 hover:border-slate-500 text-white rounded-xl font-semibold text-lg transition-all duration-200 hover:bg-slate-800/50 flex items-center justify-center gap-2"
              >
                View Integration <Globe className="w-5 h-5" />
              </Link>
            </div>
          </div>

          {/* Features Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-20">
            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Differential Privacy</h3>
              <p className="text-slate-300 leading-relaxed">
                On-device noise injection via Service Worker ensures user privacy while maintaining data utility for analytics.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-cyan-600 rounded-lg flex items-center justify-center mb-6">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Predictive Modeling</h3>
              <p className="text-slate-300 leading-relaxed">
                Real-time forecasting with Prophet and LLM-powered predictions to anticipate trends and anomalies.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-indigo-600 rounded-lg flex items-center justify-center mb-6">
                <Zap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Real-time Alerts</h3>
              <p className="text-slate-300 leading-relaxed">
                Intelligent spike and drop detection with Slack and email notifications for immediate response.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-green-600 rounded-lg flex items-center justify-center mb-6">
                <Lock className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Cookieless Tracking</h3>
              <p className="text-slate-300 leading-relaxed">
                No cookies, no persistent identifiers. Aggregate insights without compromising individual privacy.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-600 rounded-lg flex items-center justify-center mb-6">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Beautiful Dashboard</h3>
              <p className="text-slate-300 leading-relaxed">
                Intuitive, responsive interface with real-time visualizations and actionable insights.
              </p>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl p-8 hover:bg-slate-800/70 transition-all duration-300">
              <div className="w-12 h-12 bg-gradient-to-br from-pink-400 to-rose-600 rounded-lg flex items-center justify-center mb-6">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-white mb-4">Easy Integration</h3>
              <p className="text-slate-300 leading-relaxed">
                Simple embeddable script for any website. Start collecting privacy-first analytics in minutes.
              </p>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to respect privacy while gaining insights?
            </h2>
            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
              Join the future of ethical analytics. No compromises on privacy or functionality.
            </p>
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-400 hover:to-cyan-500 text-white rounded-xl font-semibold text-lg transition-all duration-200 hover:scale-105"
            >
              Start Analyzing <BarChart3 className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>

      {/* Background Elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-teal-500/20 rounded-full blur-3xl"></div>
      </div>
    </div>
  );
}