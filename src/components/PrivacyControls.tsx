import React, { useState, useEffect } from 'react';
import { Shield, Sliders, Bell, BellOff, Info } from 'lucide-react';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Zustand store for privacy settings
interface PrivacyStore {
  epsilon: number;
  epsilonHistory: Array<{ value: number; timestamp: string }>;
  setEpsilon: (epsilon: number) => void;
  getLatestEpsilon: () => number;
}

export const usePrivacyStore = create<PrivacyStore>()(
  persist(
    (set, get) => ({
      epsilon: 1.0,
      epsilonHistory: [],
      setEpsilon: (newEpsilon: number) => {
        const timestamp = new Date().toISOString();
        set((state) => ({
          epsilon: newEpsilon,
          epsilonHistory: [
            ...state.epsilonHistory.slice(-9), // Keep last 10 entries
            { value: newEpsilon, timestamp }
          ]
        }));
      },
      getLatestEpsilon: () => get().epsilon,
    }),
    {
      name: 'pythia-privacy-store',
      partialize: (state) => ({
        epsilon: state.epsilon,
        epsilonHistory: state.epsilonHistory
      }),
    }
  )
);

interface PrivacyControlsProps {
  epsilon?: number;
  onEpsilonChange?: (epsilon: number) => void;
  className?: string;
}

export function PrivacyControls({
  epsilon: _, // eslint-disable-line @typescript-eslint/no-unused-vars
  onEpsilonChange,
  className = ""
}: PrivacyControlsProps) {
  const [dailyMax] = useState(2.0); // Daily privacy budget limit
  const [used, setUsed] = useState(0); // Track actual usage
  const [lastReset, setLastReset] = useState(Date.now());
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  // Zustand store
  const { epsilon: storeEpsilon, setEpsilon } = usePrivacyStore();

  // Use store epsilon as the source of truth
  const currentEpsilon = storeEpsilon;

  // Load privacy budget from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('pythia-privacy-budget')
    if (stored) {
      try {
        const data = JSON.parse(stored)
        const now = Date.now()
        const lastReset = data.lastReset || now

        // Check if we need to reset (new day)
        const daysSinceReset = Math.floor((now - lastReset) / (24 * 60 * 60 * 1000))
        if (daysSinceReset >= 1) {
          // Reset for new day
          setUsed(0)
          setLastReset(now)
          localStorage.setItem('pythia-privacy-budget', JSON.stringify({
            used: 0,
            lastReset: now
          }))
        } else {
          // Load existing usage
          setUsed(data.used || 0)
          setLastReset(lastReset)
        }
      } catch (error) {
        console.warn('Failed to load privacy budget:', error)
        setUsed(0)
        setLastReset(Date.now())
      }
    }
  }, [])

  // Save privacy budget to localStorage
  const saveBudget = (newUsed: number) => {
    const data = {
      used: newUsed,
      lastReset: lastReset
    }
    localStorage.setItem('pythia-privacy-budget', JSON.stringify(data))
    setUsed(newUsed)
  }

  // Track privacy usage when events are sent
  const trackEventPrivacyCost = (eventCount: number, epsilon: number) => {
    // Base cost per event is small, but increases with lower epsilon
    const baseCostPerEvent = 0.01
    const epsilonMultiplier = epsilon <= 0.5 ? 2.0 :
                            epsilon <= 1.0 ? 1.5 :
                            epsilon <= 1.5 ? 1.2 : 1.0

    const totalCost = baseCostPerEvent * eventCount * epsilonMultiplier
    const newUsed = Math.min(dailyMax, used + totalCost)
    saveBudget(newUsed)

    console.log(`🔒 Privacy cost: ${totalCost.toFixed(3)}ε (${eventCount} events, ε=${epsilon})`)
  }

  // Expose tracking function to window for buffer access
  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.trackEventPrivacyCost = trackEventPrivacyCost
    }
  }, [used, lastReset])

  // Calculate privacy metrics
  const percentUsed = Math.min(100, Math.round((used / dailyMax) * 100));
  const privacyLevel = currentEpsilon <= 0.5 ? 'High' :
                      currentEpsilon <= 1.0 ? 'Moderate' :
                      currentEpsilon <= 1.5 ? 'Balanced' : 'Low';

  const noiseLevel = currentEpsilon <= 0.5 ? '~25%' :
                     currentEpsilon <= 1.0 ? '~10%' :
                     currentEpsilon <= 1.5 ? '~5%' : '~2%';

  // Handle epsilon change with banner notification
  const handleEpsilonChange = (newEpsilon: number) => {
    // Calculate privacy cost based on epsilon value
    // Lower epsilon = higher privacy = higher cost
    const calculatePrivacyCost = (epsilon: number) => {
      if (epsilon <= 0.5) return 0.8;      // High privacy = high cost
      if (epsilon <= 1.0) return 0.4;      // Moderate privacy = moderate cost
      if (epsilon <= 1.5) return 0.2;      // Balanced privacy = low cost
      return 0.1;                          // Low privacy = minimal cost
    }

    const privacyCost = calculatePrivacyCost(newEpsilon)
    const newUsed = Math.min(dailyMax, used + privacyCost)

    // Update Zustand store
    setEpsilon(newEpsilon);

    // Save updated budget
    saveBudget(newUsed);

    // Call parent callback
    onEpsilonChange?.(newEpsilon);

    // Update global pythia settings if available
    if (typeof window !== 'undefined' && window.pythiaSettings) {
      window.pythiaSettings({ epsilon: newEpsilon });
    }

    // Show privacy banner for 3 seconds
    const privacyLevel = newEpsilon <= 0.5 ? 'High' :
                        newEpsilon <= 1.0 ? 'Moderate' :
                        newEpsilon <= 1.5 ? 'Balanced' : 'Low';

    setBannerMessage(`Privacy level updated: ε=${newEpsilon.toFixed(1)} (${privacyLevel}) | Cost: ${privacyCost.toFixed(1)}ε`);
    setShowBanner(true);

    setTimeout(() => {
      setShowBanner(false);
    }, 3000);
  };

  // Handle digest toggle
  const handleDigestToggle = async (enabled: boolean) => {
    setUpdating(true);
    setDigestEnabled(enabled);

    // Store in localStorage (always works locally)
    localStorage.setItem('pythia_digest_enabled', enabled.toString());

    // Only make API call in production (not localhost)
    const isProduction = !window.location.hostname.includes('localhost') &&
                        !window.location.hostname.includes('127.0.0.1');

    if (isProduction) {
      try {
        await fetch('/.netlify/functions/preferences', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            digestEnabled: enabled,
            preference: 'slack_digest'
          })
        });
        console.log(`📧 Slack digest ${enabled ? 'enabled' : 'disabled'} (saved to server)`);
      } catch (error) {
        console.warn('⚠️ Failed to save digest preference to server:', error);
      }
    } else {
      console.log(`📧 Slack digest ${enabled ? 'enabled' : 'disabled'} (saved locally)`);
    }

    setUpdating(false);
  };

  // Load preferences on mount and expose store to window
  useEffect(() => {
    const savedDigest = localStorage.getItem('pythia_digest_enabled');
    if (savedDigest) {
      setDigestEnabled(savedDigest === 'true');
    }

    // Expose store to window for buffer access
    if (typeof window !== 'undefined') {
      window.pythiaStore = usePrivacyStore;
    }
  }, []);

  return (
    <>
      {/* Privacy Banner */}
      {showBanner && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-900/90 backdrop-blur-md border border-emerald-700 text-emerald-200 px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-right duration-300">
          <div className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span className="text-sm font-medium">{bannerMessage}</span>
          </div>
        </div>
      )}

      <div className={`bg-slate-800 rounded-2xl border border-slate-700 p-4 shadow-sm ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-purple-400" />
          <span className="font-semibold text-slate-100">Privacy Controls</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-400">ε =</span>
          <span className="px-2 py-1 bg-purple-900/50 text-purple-300 text-sm font-mono rounded-lg">
            {currentEpsilon.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Privacy Level Indicator */}
      <div className="mb-4 p-3 bg-slate-700/50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-300">Privacy Level</span>
          <span className={`text-sm font-semibold ${
            privacyLevel === 'High' ? 'text-emerald-400' :
            privacyLevel === 'Moderate' ? 'text-blue-400' :
            privacyLevel === 'Balanced' ? 'text-amber-400' : 'text-red-400'
          }`}>
            {privacyLevel}
          </span>
        </div>
        <div className="text-xs text-slate-400">
          ε = {currentEpsilon.toFixed(1)} → {privacyLevel.toLowerCase()} privacy, {noiseLevel} noise
        </div>
      </div>

      {/* Epsilon Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-300">
            Privacy Parameter (ε)
          </label>
          <div className="flex items-center space-x-1">
            <Sliders className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-400">Adjust</span>
          </div>
        </div>
        
        <input
          type="range"
          min={0.1}
          max={2.0}
          step={0.1}
          value={currentEpsilon}
          onChange={(e) => handleEpsilonChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-600 rounded-lg appearance-none cursor-pointer privacy-slider"
          aria-label="Privacy parameter epsilon value"
        />
        
        <div className="flex justify-between text-xs text-slate-400 mt-1">
          <span>More Private</span>
          <span>More Utility</span>
        </div>
      </div>

      {/* Daily Budget Progress */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Daily Budget Used</span>
          <span className="text-xs text-slate-600">{percentUsed}%</span>
        </div>
        
        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${
              percentUsed < 50 ? 'bg-emerald-500' :
              percentUsed < 80 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${percentUsed}%` }}
          />
        </div>
        
        <div className="flex justify-between text-xs text-slate-500 mt-1">
          <span>{used.toFixed(1)}ε used</span>
          <span>{dailyMax.toFixed(1)}ε daily limit</span>
        </div>
      </div>

      {/* Slack Digest Toggle */}
      <div className="border-t border-slate-200 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {digestEnabled ? (
              <Bell className="w-4 h-4 text-blue-600" />
            ) : (
              <BellOff className="w-4 h-4 text-slate-400" />
            )}
            <div>
              <span className="text-sm font-medium text-slate-700">Daily Slack Digest</span>
              <p id="digest-description" className="text-xs text-slate-500">
                {digestEnabled ? 'Receive daily summary instead of real-time alerts' : 'Get alerts immediately'}
              </p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <span className="sr-only">
              {digestEnabled ? 'Disable daily Slack digest' : 'Enable daily Slack digest'}
            </span>
            <input
              type="checkbox"
              checked={digestEnabled}
              onChange={(e) => handleDigestToggle(e.target.checked)}
              disabled={updating}
              className="sr-only peer"
              aria-describedby="digest-description"
            />
            <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 disabled:opacity-50"></div>
          </label>
        </div>
      </div>

      {/* Info Footer */}
      <div className="mt-4 p-2 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-2">
          <Info className="w-3 h-3 text-blue-600 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-blue-700 leading-relaxed">
            Lower ε values provide stronger privacy guarantees but add more noise to your data. 
            Your daily budget resets at midnight UTC.
          </p>
        </div>
      </div>

      {/* Custom CSS for slider */}
      <style>{`
        .privacy-slider::-webkit-slider-thumb {
          appearance: none;
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8B5CF6, #A855F7);
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
          transition: all 0.2s ease;
        }
        
        .privacy-slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }
        
        .privacy-slider::-moz-range-thumb {
          height: 20px;
          width: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #8B5CF6, #A855F7);
          cursor: pointer;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
          transition: all 0.2s ease;
        }
        
        .privacy-slider::-moz-range-thumb:hover {
          transform: scale(1.1);
          box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }
      `}</style>
    </div>
    </>
  );
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    pythiaSettings?: (settings: { epsilon: number }) => void;
    pythiaStore?: typeof usePrivacyStore;
    trackEventPrivacyCost?: (eventCount: number, epsilon: number) => void;
  }
}