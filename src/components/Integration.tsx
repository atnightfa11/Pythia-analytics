import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Copy, 
  Check, 
  Code, 
  Globe, 
  Shield, 
  Settings as SettingsIcon,
  Download,
  Zap,
  Eye,
  Server
} from 'lucide-react';

export function Integration() {
  const [copied, setCopied] = useState('');
  const [selectedDomain, setSelectedDomain] = useState('example.com');

  const scriptCode = `<script src="https://cdn.getpythia.ai/pythia.js" data-endpoint="https://api.getpythia.ai/events"></script>`;

  const bufferCode = `// pythia-buffer.js - In-page buffer for differential privacy
window.pythiaBuffer = []

setInterval(async () => {
  if (!window.pythiaBuffer.length) return
  
  // add Laplace noise ε=1
  const noisy = window.pythiaBuffer.map(evt => ({
    ...evt,
    count: evt.count + (Math.random() * 2 - 1)
  }))
  
  console.log('🧪 noisy batch', noisy)
  
  await fetch('/.netlify/functions/ingest', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(noisy)
  })
  
  window.pythiaBuffer.length = 0
}, 60_000)

// helper for manual flush
window.flushPythia = () => {
  const evts = window.pythiaBuffer.slice()
  window.pythiaBuffer.length = 0
  console.log('⚡️ manual flush', evts)
  return evts
}`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-6">
            <Link to="/" className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gradient-to-br from-sky-400 to-blue-600 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-900">Pythia Analytics</span>
            </Link>
            <nav className="hidden md:flex space-x-6">
              <Link to="/dashboard" className="text-slate-600 hover:text-slate-900">Dashboard</Link>
              <Link to="/integration" className="text-sky-600 font-medium">Integration</Link>
              <Link to="/settings" className="text-slate-600 hover:text-slate-900">Settings</Link>
            </nav>
          </div>
          <Link
            to="/settings"
            className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <SettingsIcon className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Integration Guide</h1>
          <p className="text-lg text-slate-600">
            Add privacy-first analytics to your website in minutes. No cookies, no compromise.
          </p>
        </div>

        {/* Quick Setup */}
        <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-sky-100 rounded-lg">
              <Zap className="w-6 h-6 text-sky-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Quick Setup</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">1. Configure Your Domain</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Domain Name
                </label>
                <input
                  type="text"
                  value={selectedDomain}
                  onChange={(e) => setSelectedDomain(e.target.value)}
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  placeholder="example.com"
                />
              </div>

              <h3 className="text-lg font-medium text-slate-900 mb-4 mt-6">2. Add Script to Your Site</h3>
              <p className="text-sm text-slate-600 mb-4">
                Copy and paste this code before the closing <code>&lt;/head&gt;</code> tag on every page you want to track.
              </p>
            </div>

            <div className="lg:row-span-2">
              <div className="bg-slate-900 rounded-lg p-4 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">HTML</span>
                  <button
                    onClick={() => copyToClipboard(scriptCode, 'script')}
                    className="flex items-center space-x-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
                  >
                    {copied === 'script' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'script' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <pre>
                  <code className="text-sm text-slate-300">
                    {scriptCode}
                  </code>
                </pre>
              </div>
            </div>
          </div>
        </div>

        {/* Advanced Configuration */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Buffer Setup */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Shield className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">In-Page Buffer (Advanced)</h3>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              For maximum privacy protection, use our in-page buffer system with client-side differential privacy.
            </p>
            <div className="bg-slate-900 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-slate-400">pythia-buffer.js</span>
                <button
                  onClick={() => copyToClipboard(bufferCode, 'buffer')}
                  className="flex items-center space-x-1 px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
                >
                  {copied === 'buffer' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copied === 'buffer' ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
              <pre className="text-xs text-slate-300 overflow-x-auto max-h-40">
                <code>{bufferCode}</code>
              </pre>
            </div>
            <button className="w-full px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex items-center justify-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Download Full Buffer Script</span>
            </button>
          </div>

          {/* API Configuration */}
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Server className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">API Configuration</h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Privacy Level (ε)
                </label>
                <select className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500">
                  <option value="0.5">High Privacy (ε = 0.5)</option>
                  <option value="1.0" selected>Balanced (ε = 1.0)</option>
                  <option value="2.0">More Utility (ε = 2.0)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Batch Size
                </label>
                <input
                  type="number"
                  defaultValue="50"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Batch Interval (seconds)
                </label>
                <input
                  type="number"
                  defaultValue="60"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="p-3 bg-sky-100 rounded-lg w-fit mb-4">
              <Eye className="w-6 h-6 text-sky-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Real-time Tracking</h3>
            <p className="text-sm text-slate-600">
              Monitor visitor behavior, page views, and custom events in real-time without compromising privacy.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="p-3 bg-purple-100 rounded-lg w-fit mb-4">
              <Shield className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Differential Privacy</h3>
            <p className="text-sm text-slate-600">
              Advanced privacy protection with mathematically guaranteed anonymity through noise injection.
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="p-3 bg-teal-100 rounded-lg w-fit mb-4">
              <Code className="w-6 h-6 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Custom Events</h3>
            <p className="text-sm text-slate-600">
              Track custom events, conversions, and user interactions with our flexible event API.
            </p>
          </div>
        </div>

        {/* Custom Events API */}
        <div className="bg-white rounded-xl border border-slate-200 p-8">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <Code className="w-6 h-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900">Custom Events API</h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-medium text-slate-900 mb-4">Track Custom Events</h3>
              <p className="text-sm text-slate-600 mb-4">
                Use the Pythia buffer API to track custom events, conversions, and user interactions.
              </p>
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-2">Page Views</h4>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">pythia('pageview', 1)</code>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-2">Custom Events</h4>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">pythia('signup', 1, {'{source: "homepage"}'})</code>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-2">Conversions</h4>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">pythia('purchase', 1, {'{revenue: 49.99}'})</code>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-slate-900 mb-2">Manual Flush</h4>
                  <code className="text-xs bg-slate-100 px-2 py-1 rounded">flushPythia()</code>
                </div>
              </div>
            </div>

            <div>
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-medium text-slate-400">JavaScript</span>
                  <button
                    onClick={() => copyToClipboard(`// Track page views
pythia('pageview', 1);

// Track button clicks
document.getElementById('signup-btn').addEventListener('click', function() {
  pythia('button_click', 1, {
    button: 'signup',
    page: window.location.pathname
  });
});

// Track form submissions
pythia('form_submit', 1, {
  form: 'newsletter',
  success: true
});

// Track conversions
pythia('purchase', 1, {
  revenue: 49.99,
  currency: 'USD',
  items: 1
});

// Manual flush for immediate sending
flushPythia();`, 'api')}
                    className="flex items-center space-x-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
                  >
                    {copied === 'api' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copied === 'api' ? 'Copied!' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="text-sm text-slate-300 overflow-x-auto">
                  <code>{`// Track page views
pythia('pageview', 1);

// Track button clicks
document.getElementById('signup-btn').addEventListener('click', function() {
  pythia('button_click', 1, {
    button: 'signup',
    page: window.location.pathname
  });
});

// Track form submissions
pythia('form_submit', 1, {
  form: 'newsletter',
  success: true
});

// Track conversions
pythia('purchase', 1, {
  revenue: 49.99,
  currency: 'USD',
  items: 1
});

// Manual flush for immediate sending
flushPythia();`}</code>
                </pre>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}