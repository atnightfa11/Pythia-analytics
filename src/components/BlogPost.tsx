import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Shield, 
  Eye, 
  Users, 
  Lock, 
  Zap,
  CheckCircle,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  Database,
  Brain
} from 'lucide-react';

export function BlogPost() {
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
              <Link to="/docs" className="text-slate-600 hover:text-slate-900">Docs</Link>
              <Link to="/blog/differential-privacy" className="text-sky-600 font-medium">Blog</Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Article */}
      <article className="max-w-4xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <Link to="/" className="text-sky-600 hover:text-sky-700 text-sm font-medium mb-4 inline-flex items-center">
            ← Back to Home
          </Link>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6 leading-tight">
            Differential Privacy Explained: Your Data's Invisible Shield
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            A plain-English guide to the math that keeps your users anonymous
          </p>
          <div className="flex items-center space-x-4 text-sm text-slate-500">
            <span>By Pythia Team</span>
            <span>•</span>
            <span>8 min read</span>
          </div>
        </div>

        {/* Content */}
        <div className="prose prose-lg prose-slate max-w-none">
          {/* Introduction */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center">
              <Shield className="w-6 h-6 text-sky-600 mr-3" />
              What is Differential Privacy?
            </h2>
            <p className="text-lg text-slate-700 mb-4">
              Imagine you're conducting a survey about people's salaries in your company. You want to learn useful insights (like average salary by department) but you absolutely cannot reveal any individual person's salary.
            </p>
            <div className="bg-white rounded-lg p-6 border border-sky-200">
              <p className="font-medium text-slate-900 mb-3">
                <strong>Differential privacy is like adding carefully calculated "noise" to your data that:</strong>
              </p>
              <ul className="space-y-2">
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Keeps individual responses completely private</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Still gives you accurate overall insights</span>
                </li>
                <li className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                  <span>Provides mathematical guarantees (not just promises)</span>
                </li>
              </ul>
            </div>
            <p className="text-slate-600 mt-4">
              It's the gold standard for privacy protection, used by Apple, Google, Microsoft, and the U.S. Census Bureau.
            </p>
          </div>

          {/* Simple Example */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <TrendingUp className="w-6 h-6 text-purple-600 mr-3" />
              The Simple Version
            </h2>
            <p className="text-lg text-slate-700 mb-6">
              Think of differential privacy like this:
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-3">❌ Without Privacy:</h3>
                <div className="bg-white rounded p-4 font-mono text-sm">
                  <div>Real data: [50k, 55k, 60k, 65k, 70k]</div>
                  <div className="text-red-600 font-bold">Average: 60k ← Accurate but risky</div>
                </div>
              </div>
              
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-emerald-900 mb-3">✅ With Differential Privacy:</h3>
                <div className="bg-white rounded p-4 font-mono text-sm">
                  <div>Noisy data: [52k, 53k, 62k, 67k, 66k]</div>
                  <div className="text-emerald-600 font-bold">Average: 60k ← Still accurate AND private</div>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-slate-700">
                <strong>The noise is added in a very specific way that:</strong>
              </p>
              <ol className="list-decimal list-inside mt-2 space-y-1 text-slate-600">
                <li><strong>Hides individuals</strong> - You can't tell what any one person earned</li>
                <li><strong>Preserves patterns</strong> - The average is still correct</li>
                <li><strong>Provides guarantees</strong> - Mathematically proven protection</li>
              </ol>
            </div>
          </div>

          {/* How Pythia Uses DP */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <Zap className="w-6 h-6 text-orange-600 mr-3" />
              How Pythia Uses Differential Privacy
            </h2>

            <div className="space-y-8">
              {/* Client-side */}
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">1. Client-Side Noise Injection</h3>
                <p className="text-slate-700 mb-4">
                  Most analytics tools add privacy protection on their servers (if at all). Pythia is different - <strong>the noise is added right in your user's browser</strong> before any data leaves their device.
                </p>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-sm">
                  <div className="text-slate-300">
                    <div className="text-green-400">// What happens in the user's browser:</div>
                    <div>Original event: {'{ pageview: 1, signup: 1, purchase: 1 }'}</div>
                    <div className="text-yellow-400">+ Laplace noise: {'{ +0.2, -0.1, +0.3 }'}</div>
                    <div className="text-blue-400">= Sent to server: {'{ pageview: 1.2, signup: 0.9, purchase: 1.3 }'}</div>
                  </div>
                </div>
                <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="font-medium text-blue-900 mb-2">Why this matters:</p>
                  <ul className="text-blue-800 space-y-1 text-sm">
                    <li>• Even if someone intercepts the data, it's already private</li>
                    <li>• Pythia's servers never see the real data</li>
                    <li>• Users stay in control of their privacy</li>
                  </ul>
                </div>
              </div>

              {/* Epsilon Parameter */}
              <div>
                <h3 className="text-xl font-semibold text-slate-900 mb-4">2. The ε (Epsilon) Parameter</h3>
                <p className="text-slate-700 mb-4">
                  The "privacy knob" in differential privacy is called <strong>epsilon (ε)</strong>. Think of it like a volume control:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full border border-slate-200 rounded-lg">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="text-left p-3 font-medium text-slate-900">ε Value</th>
                        <th className="text-left p-3 font-medium text-slate-900">Privacy Level</th>
                        <th className="text-left p-3 font-medium text-slate-900">Noise Amount</th>
                        <th className="text-left p-3 font-medium text-slate-900">Use Case</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      <tr className="border-t border-slate-200">
                        <td className="p-3 font-bold">0.1</td>
                        <td className="p-3">Maximum Privacy</td>
                        <td className="p-3">~25% noise</td>
                        <td className="p-3">Sensitive data</td>
                      </tr>
                      <tr className="border-t border-slate-200 bg-sky-50">
                        <td className="p-3 font-bold">1.0</td>
                        <td className="p-3">Balanced</td>
                        <td className="p-3">~10% noise</td>
                        <td className="p-3"><strong>Pythia default</strong></td>
                      </tr>
                      <tr className="border-t border-slate-200">
                        <td className="p-3 font-bold">2.0</td>
                        <td className="p-3">More Utility</td>
                        <td className="p-3">~5% noise</td>
                        <td className="p-3">Public dashboards</td>
                      </tr>
                      <tr className="border-t border-slate-200">
                        <td className="p-3 font-bold">5.0</td>
                        <td className="p-3">Minimal Privacy</td>
                        <td className="p-3">~2% noise</td>
                        <td className="p-3">Internal analytics</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Real World Example */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <Users className="w-6 h-6 text-teal-600 mr-3" />
              Real-World Example
            </h2>
            <p className="text-lg text-slate-700 mb-6">
              Let's say you run an e-commerce site and want to track conversion rates by traffic source:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-red-900 mb-4">❌ Traditional Analytics (Privacy Risk)</h3>
                <div className="bg-white rounded p-4 font-mono text-sm space-y-1">
                  <div>Google Ads: 127 visitors → 8 conversions (6.3%)</div>
                  <div>Facebook: 89 visitors → 3 conversions (3.4%)</div>
                  <div>Email: 45 visitors → 7 conversions (15.6%)</div>
                </div>
                <p className="text-red-700 text-sm mt-3">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Problem: With enough data points, you could potentially identify individual users
                </p>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-emerald-900 mb-4">✅ Pythia with Differential Privacy</h3>
                <div className="bg-white rounded p-4 font-mono text-sm space-y-1">
                  <div>Google Ads: 126.8 visitors → 8.2 conversions (6.5%)</div>
                  <div>Facebook: 89.3 visitors → 2.9 conversions (3.2%)</div>
                  <div>Email: 44.7 visitors → 7.1 conversions (15.9%)</div>
                </div>
                <p className="text-emerald-700 text-sm mt-3">
                  <CheckCircle className="w-4 h-4 inline mr-1" />
                  Solution: Noise protects individuals while preserving business insights
                </p>
              </div>
            </div>

            <div className="mt-6 p-4 bg-slate-50 rounded-lg">
              <p className="text-slate-700">
                The conversion rates are still accurate enough for business decisions, but individual user behavior is mathematically protected.
              </p>
            </div>
          </div>

          {/* Why This Matters */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <Brain className="w-6 h-6 text-indigo-600 mr-3" />
              Why This Matters for Your Business
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-6">
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <h3 className="font-semibold text-emerald-900 mb-2">1. Regulatory Compliance Made Easy</h3>
                  <ul className="text-emerald-700 text-sm space-y-1">
                    <li>• <strong>GDPR</strong>: No personal data = no consent needed</li>
                    <li>• <strong>CCPA</strong>: Anonymous analytics = no opt-out required</li>
                    <li>• <strong>Future regulations</strong>: Already compliant by design</li>
                  </ul>
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h3 className="font-semibold text-blue-900 mb-2">2. User Trust</h3>
                  <ul className="text-blue-700 text-sm space-y-1">
                    <li>• Users can see the privacy protection in action</li>
                    <li>• No "trust us" promises - mathematical guarantees</li>
                    <li>• Transparent about what data is collected</li>
                  </ul>
                </div>
              </div>

              <div className="space-y-6">
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h3 className="font-semibold text-purple-900 mb-2">3. Competitive Advantage</h3>
                  <ul className="text-purple-700 text-sm space-y-1">
                    <li>• Privacy-first positioning</li>
                    <li>• No cookie banners needed</li>
                    <li>• Works in Safari, Firefox strict mode</li>
                    <li>• Future-proof against browser changes</li>
                  </ul>
                </div>

                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h3 className="font-semibold text-orange-900 mb-2">4. Better Data Quality</h3>
                  <ul className="text-orange-700 text-sm space-y-1">
                    <li>• Users more likely to allow tracking</li>
                    <li>• No ad blockers interfering</li>
                    <li>• Consistent data across all browsers</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Common Questions */}
          <div className="bg-white rounded-xl border border-slate-200 p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">Common Questions</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  "Doesn't adding noise make the data useless?"
                </h3>
                <p className="text-slate-700 mb-3">
                  <strong>Not at all!</strong> The noise is carefully calibrated:
                </p>
                <ul className="text-slate-600 space-y-1 ml-4">
                  <li>• <strong>Individual events</strong>: Might be noisy</li>
                  <li>• <strong>Aggregate patterns</strong>: Remain accurate</li>
                  <li>• <strong>Large datasets</strong>: Noise averages out</li>
                </ul>
                <p className="text-slate-600 mt-3 text-sm">
                  Example: If you have 1,000 page views, adding ±10% noise to each one still gives you an accurate total within 1-2%.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  "How is this different from just anonymizing data?"
                </h3>
                <div className="bg-slate-50 rounded-lg p-4">
                  <p className="text-slate-700 mb-3">
                    <strong>Traditional anonymization</strong> removes names and emails but can still be reversed:
                  </p>
                  <ul className="text-slate-600 space-y-1 text-sm">
                    <li>• Netflix "anonymous" ratings → identified users</li>
                    <li>• Taxi trip data → identified celebrities' homes</li>
                    <li>• Search logs → identified individuals</li>
                  </ul>
                  <p className="text-slate-700 mt-3">
                    <strong>Differential privacy</strong> provides mathematical guarantees that are impossible to reverse, even with unlimited computing power and external data.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Getting Started */}
          <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-8 mb-8">
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center">
              <ArrowRight className="w-6 h-6 text-sky-600 mr-3" />
              Getting Started with Pythia
            </h2>
            
            <p className="text-lg text-slate-700 mb-6">
              Ready to implement privacy-first analytics?
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                  <span className="font-medium text-slate-900">Deploy Pythia in under 5 minutes</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                  <span className="font-medium text-slate-900">Set your ε value (start with 1.0)</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                  <span className="font-medium text-slate-900">Monitor your privacy budget in the dashboard</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-sky-600 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                  <span className="font-medium text-slate-900">Adjust as needed for your privacy/utility balance</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 mb-6">
              <p className="text-slate-300 text-sm mb-2">Try it now in your browser console on any Pythia site:</p>
              <div className="font-mono text-sm space-y-1">
                <div><span className="text-green-400">pythiaStatus()</span> <span className="text-slate-400">// See current privacy settings</span></div>
                <div><span className="text-green-400">pythia('test_event', 1)</span> <span className="text-slate-400">// Send a test event</span></div>
                <div><span className="text-green-400">flushPythia()</span> <span className="text-slate-400">// See the noise in action</span></div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link 
                to="/docs" 
                className="px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center space-x-2"
              >
                <span>Read the Docs</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link 
                to="/dashboard" 
                className="px-6 py-3 border border-sky-600 text-sky-600 hover:bg-sky-50 rounded-lg font-medium transition-colors text-center"
              >
                Try the Demo
              </Link>
            </div>
          </div>

          {/* Bottom Line */}
          <div className="bg-slate-900 text-white rounded-xl p-8">
            <h2 className="text-2xl font-bold mb-6 flex items-center">
              <Lock className="w-6 h-6 text-sky-400 mr-3" />
              The Bottom Line
            </h2>
            <p className="text-lg text-slate-300 mb-6">
              Differential privacy isn't just a buzzword - it's a mathematical framework that lets you:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300"><strong className="text-white">Collect useful analytics</strong> without compromising user privacy</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300"><strong className="text-white">Stay ahead of regulations</strong> with built-in compliance</span>
                </li>
              </ul>
              <ul className="space-y-3">
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300"><strong className="text-white">Build user trust</strong> with transparent, auditable protection</span>
                </li>
                <li className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-300"><strong className="text-white">Future-proof your business</strong> against privacy changes</span>
                </li>
              </ul>
            </div>
            <p className="text-xl text-sky-400 font-medium mt-8">
              With Pythia, you get all the insights you need while giving your users the privacy they deserve.
            </p>
          </div>
        </div>
      </article>
    </div>
  );
} 