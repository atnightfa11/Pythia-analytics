import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  Settings as SettingsIcon, 
  Shield, 
  Bell, 
  Globe, 
  Zap,
  Save,
  AlertTriangle,
  Mail,
  MessageSquare,
  Sliders,
  Database,
  Key,
  Users
} from 'lucide-react';

export function SettingsPanel() {
  const [settings, setSettings] = useState({
    privacy: {
      epsilon: 1.0,
      noiseInjection: true,
      batchSize: 50,
      batchInterval: 30000,
    },
    alerts: {
      enabled: true,
      spikes: true,
      drops: true,
      threshold: 25,
      email: 'alerts@example.com',
      slack: '#analytics',
    },
    predictions: {
      enabled: true,
      model: 'prophet',
      forecastDays: 7,
      confidence: 0.95,
    },
    domains: ['example.com', 'app.example.com'],
  });

  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // Save settings logic would go here
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
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
              <Link to="/integration" className="text-slate-600 hover:text-slate-900">Integration</Link>
              <Link to="/settings" className="text-sky-600 font-medium">Settings</Link>
            </nav>
          </div>
          <button
            onClick={handleSave}
            className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
              saved 
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' 
                : 'bg-sky-600 hover:bg-sky-700 text-white'
            }`}
          >
            <Save className="w-4 h-4" />
            <span>{saved ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-4">Settings</h1>
          <p className="text-lg text-slate-600">
            Configure privacy, alerts, predictions, and integration settings.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Settings Panel */}
          <div className="lg:col-span-2 space-y-8">
            {/* Privacy Settings */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Privacy Configuration</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Privacy Parameter (ε)
                  </label>
                  <select 
                    value={settings.privacy.epsilon}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, epsilon: parseFloat(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                  >
                    <option value={0.1}>Maximum Privacy (ε = 0.1)</option>
                    <option value={0.5}>High Privacy (ε = 0.5)</option>
                    <option value={1.0}>Balanced (ε = 1.0)</option>
                    <option value={2.0}>More Utility (ε = 2.0)</option>
                    <option value={5.0}>Maximum Utility (ε = 5.0)</option>
                  </select>
                  <p className="text-xs text-slate-500 mt-1">Lower values provide stronger privacy guarantees</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Batch Size
                  </label>
                  <input
                    type="number"
                    value={settings.privacy.batchSize}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, batchSize: parseInt(e.target.value) }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    min="10"
                    max="500"
                  />
                  <p className="text-xs text-slate-500 mt-1">Number of events to batch before sending</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    Batch Interval (seconds)
                  </label>
                  <input
                    type="number"
                    value={settings.privacy.batchInterval / 1000}
                    onChange={(e) => setSettings(prev => ({
                      ...prev,
                      privacy: { ...prev.privacy, batchInterval: parseInt(e.target.value) * 1000 }
                    }))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    min="5"
                    max="300"
                  />
                  <p className="text-xs text-slate-500 mt-1">Maximum time to wait before sending batch</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Client-side Noise Injection</p>
                    <p className="text-xs text-slate-500">Add noise on user's device for maximum privacy</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.privacy.noiseInjection}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        privacy: { ...prev.privacy, noiseInjection: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Alert Settings */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Bell className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Alert Configuration</h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Enable Alerts</p>
                    <p className="text-xs text-slate-500">Receive notifications for anomalies and trends</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.alerts.enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        alerts: { ...prev.alerts, enabled: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-amber-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-600"></div>
                  </label>
                </div>

                {settings.alerts.enabled && (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Alert Threshold (%)
                        </label>
                        <input
                          type="number"
                          value={settings.alerts.threshold}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            alerts: { ...prev.alerts, threshold: parseInt(e.target.value) }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          min="5"
                          max="100"
                        />
                        <p className="text-xs text-slate-500 mt-1">Percentage change to trigger alert</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Email Address
                        </label>
                        <input
                          type="email"
                          value={settings.alerts.email}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            alerts: { ...prev.alerts, email: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="alerts@example.com"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">
                          Slack Channel
                        </label>
                        <input
                          type="text"
                          value={settings.alerts.slack}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            alerts: { ...prev.alerts, slack: e.target.value }
                          }))}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                          placeholder="#analytics"
                        />
                      </div>
                    </div>

                    <div className="flex space-x-6">
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.alerts.spikes}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            alerts: { ...prev.alerts, spikes: e.target.checked }
                          }))}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <span className="text-sm text-slate-700">Traffic Spikes</span>
                      </label>
                      <label className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={settings.alerts.drops}
                          onChange={(e) => setSettings(prev => ({
                            ...prev,
                            alerts: { ...prev.alerts, drops: e.target.checked }
                          }))}
                          className="w-4 h-4 text-amber-600 border-gray-300 rounded focus:ring-amber-500"
                        />
                        <span className="text-sm text-slate-700">Traffic Drops</span>
                      </label>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Prediction Settings */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-teal-100 rounded-lg">
                  <Zap className="w-6 h-6 text-teal-600" />
                </div>
                <h2 className="text-xl font-semibold text-slate-900">Prediction Models</h2>
              </div>

              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-700">Enable Predictions</p>
                    <p className="text-xs text-slate-500">Generate forecasts and trend predictions</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.predictions.enabled}
                      onChange={(e) => setSettings(prev => ({
                        ...prev,
                        predictions: { ...prev.predictions, enabled: e.target.checked }
                      }))}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-teal-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-teal-600"></div>
                  </label>
                </div>

                {settings.predictions.enabled && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Prediction Model
                      </label>
                      <select 
                        value={settings.predictions.model}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          predictions: { ...prev.predictions, model: e.target.value }
                        }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value="prophet">Prophet (Time Series)</option>
                        <option value="llm">LLM-Powered</option>
                        <option value="linear">Linear Regression</option>
                        <option value="ensemble">Ensemble Model</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Forecast Period (days)
                      </label>
                      <input
                        type="number"
                        value={settings.predictions.forecastDays}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          predictions: { ...prev.predictions, forecastDays: parseInt(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                        min="1"
                        max="30"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Confidence Level
                      </label>
                      <select 
                        value={settings.predictions.confidence}
                        onChange={(e) => setSettings(prev => ({
                          ...prev,
                          predictions: { ...prev.predictions, confidence: parseFloat(e.target.value) }
                        }))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      >
                        <option value={0.90}>90%</option>
                        <option value={0.95}>95%</option>
                        <option value={0.99}>99%</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Stats */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">System Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Privacy Level</span>
                  <span className="text-sm font-medium text-emerald-600">High</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Active Domains</span>
                  <span className="text-sm font-medium text-slate-900">{settings.domains.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Data Retention</span>
                  <span className="text-sm font-medium text-slate-900">90 days</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Last Backup</span>
                  <span className="text-sm font-medium text-slate-900">2 hours ago</span>
                </div>
              </div>
            </div>

            {/* Domain Management */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <Globe className="w-5 h-5 text-slate-600" />
                <h3 className="text-lg font-semibold text-slate-900">Tracked Domains</h3>
              </div>
              <div className="space-y-3">
                {settings.domains.map((domain, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <span className="text-sm font-medium text-slate-900">{domain}</span>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                  </div>
                ))}
                <button className="w-full px-4 py-2 border-2 border-dashed border-slate-300 text-slate-600 rounded-lg hover:border-slate-400 hover:text-slate-700 transition-colors text-sm">
                  + Add Domain
                </button>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center space-x-2 mb-4">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="text-lg font-semibold text-slate-900">Recent Alerts</h3>
              </div>
              <div className="space-y-3">
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm font-medium text-amber-900">Traffic Spike</p>
                  <p className="text-xs text-amber-600">45% increase • 2 hours ago</p>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <p className="text-sm font-medium text-emerald-900">Model Updated</p>
                  <p className="text-xs text-emerald-600">Forecast accuracy improved • 6 hours ago</p>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-blue-900">System Healthy</p>
                  <p className="text-xs text-blue-600">All services operational • 12 hours ago</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}