import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Copy, 
  Check, 
  Code, 
  Settings,
  ExternalLink,
  Database,
  Cloud,
  Terminal,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

export function Integration() {
  const [copied, setCopied] = useState('');

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    setCopied(type);
    setTimeout(() => setCopied(''), 2000);
  };

  const envVariables = `# Required - Supabase Connection
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# Required - Site Configuration  
NETLIFY_URL=https://your-site.netlify.app
SITE_URL=https://your-site.netlify.app

# Optional - Slack Alerts
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/your/webhook/url
ALERT_THRESHOLD=0.25`;

  const trackingCode = `// Basic tracking (automatic page views)
<script src="/src/pythia-buffer.js"></script>

// Custom events
<script>
// Track custom events
pythia('signup', 1, { plan: 'pro' });
pythia('purchase', 1, { revenue: 49.99 });

// Manual flush (optional)
flushPythia();

// Check status
pythiaStatus();
</script>`;

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
              <Link to="/docs" className="text-sky-600 font-medium">Docs</Link>
              <Link to="/blog/differential-privacy" className="text-slate-600 hover:text-slate-900">Blog</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Quick Start Guide</h1>
          <p className="text-xl text-slate-600">
            Deploy privacy-first analytics with differential privacy in under 5 minutes.
          </p>
        </div>

        {/* Quick Start Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-sky-100 rounded-lg flex items-center justify-center">
                <span className="text-sky-600 font-bold">1</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Deploy to Netlify</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Fork the repository and connect to Netlify with one click.
            </p>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Build command: <code className="bg-slate-100 px-1 rounded">npm run build</code></span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Publish directory: <code className="bg-slate-100 px-1 rounded">dist</code></span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-purple-600 font-bold">2</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Setup Supabase</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Create a new Supabase project and run the database migrations.
            </p>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Copy Project URL & API keys</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Run SQL migrations</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-6">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-8 h-8 bg-teal-100 rounded-lg flex items-center justify-center">
                <span className="text-teal-600 font-bold">3</span>
              </div>
              <h3 className="text-lg font-semibold text-slate-900">Configure & Test</h3>
            </div>
            <p className="text-slate-600 mb-4">
              Add environment variables and test your setup.
            </p>
            <div className="space-y-2 text-sm text-slate-600">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Environment variables</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-emerald-500" />
                <span>Test connection</span>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Setup */}
        <div className="space-y-8">
          {/* Step 1: Netlify Deployment */}
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-sky-100 rounded-lg">
                <Cloud className="w-6 h-6 text-sky-600" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">1. Deploy to Netlify</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">One-Click Deploy</h3>
                <a
                  href="https://app.netlify.com/start/deploy?repository=https://github.com/your-username/pythia-analytics"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors space-x-2 mb-4"
                >
                  <span>Deploy to Netlify</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
                
                <div className="space-y-3">
                  <h4 className="font-medium text-slate-900">Manual Deployment:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-slate-600">
                    <li>Fork this repository</li>
                    <li>Connect to Netlify</li>
                    <li>Build command: <code className="bg-slate-100 px-1 rounded">npm run build</code></li>
                    <li>Publish directory: <code className="bg-slate-100 px-1 rounded">dist</code></li>
                  </ol>
                </div>
              </div>
              
              <div className="bg-slate-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <Terminal className="w-4 h-4 text-slate-600" />
                  <span className="text-sm font-medium text-slate-600">Build Settings</span>
                </div>
                <div className="space-y-2 text-sm font-mono">
                  <div><span className="text-slate-500">Build command:</span> npm run build</div>
                  <div><span className="text-slate-500">Publish directory:</span> dist</div>
                  <div><span className="text-slate-500">Node version:</span> 18.x</div>
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Supabase Setup */}
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Database className="w-6 h-6 text-purple-600" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">2. Set up Supabase Database</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-slate-900 mb-3">Create Supabase Project</h3>
                  <ol className="list-decimal list-inside space-y-2 text-slate-600">
                    <li>Go to <a href="https://supabase.com/" target="_blank" rel="noopener noreferrer" className="text-purple-600 hover:underline">supabase.com</a></li>
                    <li>Click "New Project"</li>
                    <li>Choose organization and name your project</li>
                    <li>Wait for setup to complete (~2 minutes)</li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg font-medium text-slate-900 mb-3">Get Your Credentials</h3>
                  <ol className="list-decimal list-inside space-y-2 text-slate-600">
                    <li>Go to Settings → API</li>
                    <li>Copy your <strong>Project URL</strong> and <strong>anon public key</strong></li>
                    <li>Copy your <strong>service_role secret key</strong> (for functions)</li>
                  </ol>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-3">Run Database Migrations</h3>
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-600 mb-3">
                    Copy and paste each migration file from <code>supabase/migrations/</code> into the SQL Editor:
                  </p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Events table for analytics data</li>
                    <li>• Alerts table for notifications</li>
                    <li>• Forecasts table for predictions</li>
                    <li>• Proper RLS policies for security</li>
                  </ul>
                </div>
                                 <div className="bg-slate-900 rounded-lg p-3">
                   <code className="text-xs text-slate-300">
                     # Or use the Supabase CLI
                     <br/>
                     supabase db push
                   </code>
                 </div>
              </div>
            </div>
          </div>

          {/* Step 3: Environment Variables */}
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-teal-100 rounded-lg">
                <Settings className="w-6 h-6 text-teal-600" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">3. Configure Environment Variables</h2>
            </div>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-3">In Netlify (Site Settings → Environment Variables)</h3>
                <div className="bg-slate-900 rounded-lg p-4 relative">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400">Environment Variables</span>
                    <button
                      onClick={() => copyToClipboard(envVariables, 'env')}
                      className="flex items-center space-x-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
                    >
                      {copied === 'env' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copied === 'env' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-sm text-slate-300 overflow-x-auto">
                    <code>{envVariables}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-3">Create Local .env File</h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <code className="text-sm text-slate-600">
                    # Copy from .env.example and fill in your values<br/>
                    cp .env.example .env
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Step 4: Test Setup */}
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">4. Test Your Setup</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-2">Database Connection</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Visit: <code className="bg-slate-100 px-1 rounded text-xs">/.netlify/functions/test-connection</code>
                </p>
                <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
                                     <code className="text-xs text-emerald-800">{`{"success": true, "message": "All tests passed!"}`}</code>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-2">Analytics Tracking</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Visit your dashboard and click "Test Event" button
                </p>
                <div className="bg-emerald-50 border border-emerald-200 rounded p-2">
                  <code className="text-xs text-emerald-800">✅ Test event sent!</code>
                </div>
              </div>

              <div className="border border-slate-200 rounded-lg p-4">
                <h3 className="font-medium text-slate-900 mb-2">Slack Alerts (Optional)</h3>
                <p className="text-sm text-slate-600 mb-3">
                  Test webhook in dashboard settings
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded p-2">
                  <code className="text-xs text-blue-800">Slack notification sent!</code>
                </div>
              </div>
            </div>
          </div>

          {/* Integration Code */}
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Code className="w-6 h-6 text-orange-600" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">Client-Side Integration</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div>
                <h3 className="text-lg font-medium text-slate-900 mb-4">Basic Tracking</h3>
                <p className="text-slate-600 mb-4">
                  Add the tracking script to your website and start collecting privacy-first analytics:
                </p>
                
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 mb-2">Page Views (Automatic)</h4>
                    <p className="text-xs text-slate-600">Automatically tracked when the script loads</p>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 mb-2">Custom Events</h4>
                    <div className="space-y-1 text-xs">
                      <div><code className="bg-slate-100 px-1 rounded">pythia('signup', 1, {'{plan: "pro"}'})</code></div>
                      <div><code className="bg-slate-100 px-1 rounded">pythia('purchase', 1, {'{revenue: 49.99}'})</code></div>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-slate-900 mb-2">Debug Commands</h4>
                    <div className="space-y-1 text-xs">
                      <div><code className="bg-slate-100 px-1 rounded">pythiaStatus()</code> - Check buffer status</div>
                      <div><code className="bg-slate-100 px-1 rounded">flushPythia()</code> - Force send events</div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="bg-slate-900 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-medium text-slate-400">JavaScript</span>
                    <button
                      onClick={() => copyToClipboard(trackingCode, 'tracking')}
                      className="flex items-center space-x-2 px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs transition-colors"
                    >
                      {copied === 'tracking' ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copied === 'tracking' ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>
                  <pre className="text-sm text-slate-300 overflow-x-auto">
                    <code>{trackingCode}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Troubleshooting */}
          <div className="bg-white rounded-xl border border-slate-200 p-8">
            <div className="flex items-center space-x-3 mb-6">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-2xl font-semibold text-slate-900">Troubleshooting</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-slate-900 mb-2">Common Issues</h3>
                  <div className="space-y-3 text-sm">
                    <div>
                      <p className="font-medium text-red-600">Missing Supabase credentials</p>
                      <p className="text-slate-600">Check environment variables in Netlify, ensure VITE_ prefix for client variables</p>
                    </div>
                    <div>
                      <p className="font-medium text-red-600">No data in dashboard</p>
                      <p className="text-slate-600">Check browser console, verify events with <code>pythiaStatus()</code></p>
                    </div>
                    <div>
                      <p className="font-medium text-red-600">Alerts not working</p>
                      <p className="text-slate-600">Set SLACK_WEBHOOK_URL, test in dashboard settings</p>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-slate-900 mb-3">Debug Commands</h3>
                <div className="bg-slate-50 rounded-lg p-4 space-y-2 text-sm font-mono">
                  <div><span className="text-slate-500"># Browser console</span></div>
                  <div>pythiaStatus()</div>
                  <div>flushPythia()</div>
                  <div>localStorage.clear()</div>
                  <div className="pt-2"><span className="text-slate-500"># Test endpoints</span></div>
                  <div>/.netlify/functions/debug-db</div>
                  <div>/.netlify/functions/test-connection</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}