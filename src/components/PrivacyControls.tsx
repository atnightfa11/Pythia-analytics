import React, { useState, useEffect } from 'react';
import { Shield, Sliders, Bell, BellOff, Info } from 'lucide-react';

interface PrivacyControlsProps {
  epsilon?: number;
  onEpsilonChange?: (epsilon: number) => void;
  className?: string;
}

export function PrivacyControls({ 
  epsilon = 1.0, 
  onEpsilonChange,
  className = ""
}: PrivacyControlsProps) {
  const [currentEpsilon, setCurrentEpsilon] = useState(epsilon);
  const [dailyMax] = useState(2.0); // Daily privacy budget limit
  const [used, setUsed] = useState(1.2); // Simulated daily usage
  const [digestEnabled, setDigestEnabled] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Calculate privacy metrics
  const percentUsed = Math.min(100, Math.round((used / dailyMax) * 100));
  const privacyLevel = currentEpsilon <= 0.5 ? 'High' : 
                      currentEpsilon <= 1.0 ? 'Moderate' : 
                      currentEpsilon <= 1.5 ? 'Balanced' : 'Low';
  
  const noiseLevel = currentEpsilon <= 0.5 ? '~25%' :
                     currentEpsilon <= 1.0 ? '~10%' :
                     currentEpsilon <= 1.5 ? '~5%' : '~2%';

  // Update epsilon when prop changes
  useEffect(() => {
    setCurrentEpsilon(epsilon);
  }, [epsilon]);

  // Handle epsilon change
  const handleEpsilonChange = (newEpsilon: number) => {
    setCurrentEpsilon(newEpsilon);
    onEpsilonChange?.(newEpsilon);
    
    // Store in localStorage
    localStorage.setItem('pythia_epsilon', newEpsilon.toString());
    
    // Update global pythia settings if available
    if (typeof window !== 'undefined' && window.pythiaSettings) {
      window.pythiaSettings({ epsilon: newEpsilon });
    }
  };

  // Handle digest toggle
  const handleDigestToggle = async (enabled: boolean) => {
    setUpdating(true);
    setDigestEnabled(enabled);
    
    try {
      // In a real implementation, this would call your preferences API
      await fetch('/.netlify/functions/preferences', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          digestEnabled: enabled,
          preference: 'slack_digest'
        })
      });
      
      console.log(`📧 Slack digest ${enabled ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.warn('⚠️ Failed to update digest preference:', error);
    } finally {
      setUpdating(false);
    }
  };

  // Load preferences on mount
  useEffect(() => {
    const savedDigest = localStorage.getItem('pythia_digest_enabled');
    if (savedDigest) {
      setDigestEnabled(savedDigest === 'true');
    }
  }, []);

  return (
    <div className={`bg-white rounded-2xl border border-slate-200 p-4 shadow-sm ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Shield className="w-5 h-5 text-purple-600" />
          <span className="font-semibold text-slate-900">Privacy Controls</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-slate-500">ε =</span>
          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-sm font-mono rounded-lg">
            {currentEpsilon.toFixed(1)}
          </span>
        </div>
      </div>

      {/* Privacy Level Indicator */}
      <div className="mb-4 p-3 bg-slate-50 rounded-xl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-slate-700">Privacy Level</span>
          <span className={`text-sm font-semibold ${
            privacyLevel === 'High' ? 'text-emerald-600' :
            privacyLevel === 'Moderate' ? 'text-blue-600' :
            privacyLevel === 'Balanced' ? 'text-amber-600' : 'text-red-600'
          }`}>
            {privacyLevel}
          </span>
        </div>
        <div className="text-xs text-slate-600">
          ε = {currentEpsilon.toFixed(1)} → {privacyLevel.toLowerCase()} privacy, {noiseLevel} noise
        </div>
      </div>

      {/* Epsilon Slider */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-slate-700">
            Privacy Parameter (ε)
          </label>
          <div className="flex items-center space-x-1">
            <Sliders className="w-3 h-3 text-slate-400" />
            <span className="text-xs text-slate-500">Adjust</span>
          </div>
        </div>
        
        <input
          type="range"
          min={0.1}
          max={2.0}
          step={0.1}
          value={currentEpsilon}
          onChange={(e) => handleEpsilonChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer privacy-slider"
        />
        
        <div className="flex justify-between text-xs text-slate-500 mt-1">
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
              <p className="text-xs text-slate-500">
                {digestEnabled ? 'Receive daily summary instead of real-time alerts' : 'Get alerts immediately'}
              </p>
            </div>
          </div>
          
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={digestEnabled}
              onChange={(e) => handleDigestToggle(e.target.checked)}
              disabled={updating}
              className="sr-only peer"
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
      <style jsx>{`
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
  );
}

// Extend window interface for TypeScript
declare global {
  interface Window {
    pythiaSettings?: (settings: { epsilon: number }) => void;
  }
}