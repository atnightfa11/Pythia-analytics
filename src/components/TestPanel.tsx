import React, { useState } from 'react';
import { Play, CheckCircle, XCircle, AlertTriangle, Loader2, Database, Zap, Activity } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'pass' | 'fail' | 'warning' | 'running';
  message: string;
  data?: any;
}

export function TestPanel() {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const updateResult = (test: string, status: 'pass' | 'fail' | 'warning', message: string, data?: any) => {
    setResults(prev => {
      const existing = prev.findIndex(r => r.test === test);
      const newResult = { test, status, message, data };
      
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = newResult;
        return updated;
      } else {
        return [...prev, newResult];
      }
    });
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    const tests = [
      'Buffer System',
      'Event Tracking', 
      'Session Management',
      'Device Detection',
      'Manual Flush',
      'Ingest Function',
      'Forecast Function',
      'Database Connection',
      'Alerts System'
    ];

    // Initialize all tests as running
    tests.forEach(test => {
      updateResult(test, 'running', 'Running...');
    });

    try {
      // Test 1: Buffer System
      await new Promise(resolve => setTimeout(resolve, 100));
      if (typeof window.pythiaBuffer !== 'undefined' && Array.isArray(window.pythiaBuffer)) {
        updateResult('Buffer System', 'pass', `Buffer initialized with ${window.pythiaBuffer.length} events`);
      } else {
        updateResult('Buffer System', 'fail', 'pythiaBuffer not found or not an array');
      }

      // Test 2: Event Tracking
      await new Promise(resolve => setTimeout(resolve, 100));
      if (typeof window.pythia === 'function') {
        const initialSize = window.pythiaBuffer.length;
        window.pythia('test_event', 1, { test: true });
        const newSize = window.pythiaBuffer.length;
        
        if (newSize === initialSize + 1) {
          updateResult('Event Tracking', 'pass', 'Event successfully added to buffer');
        } else {
          updateResult('Event Tracking', 'fail', `Buffer size didn't increase (${initialSize} -> ${newSize})`);
        }
      } else {
        updateResult('Event Tracking', 'fail', 'pythia function not found');
      }

      // Test 3: Session Management
      await new Promise(resolve => setTimeout(resolve, 100));
      const sessionId = localStorage.getItem('pythia_session_id');
      if (sessionId) {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(sessionId)) {
          updateResult('Session Management', 'pass', `Valid session ID: ${sessionId.substring(0, 8)}...`);
        } else {
          updateResult('Session Management', 'warning', 'Session ID format invalid');
        }
      } else {
        updateResult('Session Management', 'fail', 'No session ID found');
      }

      // Test 4: Device Detection
      await new Promise(resolve => setTimeout(resolve, 100));
      window.pythia('device_test', 1);
      const lastEvent = window.pythiaBuffer[window.pythiaBuffer.length - 1];
      if (lastEvent?.device) {
        const validDevices = ['Desktop', 'Mobile', 'Tablet'];
        if (validDevices.includes(lastEvent.device)) {
          updateResult('Device Detection', 'pass', `Device detected: ${lastEvent.device}`);
        } else {
          updateResult('Device Detection', 'warning', `Unknown device: ${lastEvent.device}`);
        }
      } else {
        updateResult('Device Detection', 'fail', 'No device field in event');
      }

      // Test 5: Manual Flush
      await new Promise(resolve => setTimeout(resolve, 100));
      if (typeof window.flushPythia === 'function') {
        updateResult('Manual Flush', 'pass', `flushPythia available, buffer has ${window.pythiaBuffer.length} events`);
      } else {
        updateResult('Manual Flush', 'fail', 'flushPythia function not found');
      }

      // Test 6: Ingest Function
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const testPayload = [{
          event_type: 'api_test',
          count: 1,
          timestamp: new Date().toISOString(),
          session_id: 'test-session',
          device: 'Test'
        }];

        const response = await fetch('/.netlify/functions/ingest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(testPayload)
        });

        if (response.ok) {
          const result = await response.json();
          updateResult('Ingest Function', 'pass', `Ingest working (${response.status})`, result.success);
        } else {
          updateResult('Ingest Function', 'fail', `Ingest error: ${response.status}`);
        }
      } catch (error) {
        updateResult('Ingest Function', 'fail', `Ingest error: ${error.message}`);
      }

      // Test 7: Forecast Function
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const response = await fetch('/.netlify/functions/forecast');
        if (response.ok) {
          const result = await response.json();
          if (result.forecast !== undefined) {
            updateResult('Forecast Function', 'pass', `Forecast: ${result.forecast}`, result.mape);
          } else {
            updateResult('Forecast Function', 'warning', 'No forecast value returned');
          }
        } else {
          updateResult('Forecast Function', 'fail', `Forecast error: ${response.status}`);
        }
      } catch (error) {
        updateResult('Forecast Function', 'fail', `Forecast error: ${error.message}`);
      }

      // Test 8: Database Connection
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const response = await fetch('/.netlify/functions/test-connection');
        if (response.ok) {
          const result = await response.json();
          if (result.success) {
            updateResult('Database Connection', 'pass', 'Database connected', result.tests);
          } else {
            updateResult('Database Connection', 'fail', 'Database connection failed');
          }
        } else {
          updateResult('Database Connection', 'fail', `DB test error: ${response.status}`);
        }
      } catch (error) {
        updateResult('Database Connection', 'fail', `DB error: ${error.message}`);
      }

      // Test 9: Alerts System
      await new Promise(resolve => setTimeout(resolve, 200));
      try {
        const response = await fetch('/.netlify/functions/get-alerts?limit=5');
        if (response.ok) {
          const result = await response.json();
          if (result.alerts) {
            updateResult('Alerts System', 'pass', `${result.alerts.length} alerts found`, result.summary);
          } else {
            updateResult('Alerts System', 'warning', 'No alerts array returned');
          }
        } else {
          updateResult('Alerts System', 'fail', `Alerts error: ${response.status}`);
        }
      } catch (error) {
        updateResult('Alerts System', 'fail', `Alerts error: ${error.message}`);
      }

    } catch (error) {
      console.error('Test suite error:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'fail': return <XCircle className="w-4 h-4 text-red-400" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-400" />;
      case 'running': return <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />;
      default: return null;
    }
  };

  const getTestIcon = (test: string) => {
    if (test.includes('Database')) return <Database className="w-4 h-4 text-slate-400" />;
    if (test.includes('Function') || test.includes('Ingest')) return <Zap className="w-4 h-4 text-slate-400" />;
    return <Activity className="w-4 h-4 text-slate-400" />;
  };

  const passed = results.filter(r => r.status === 'pass').length;
  const failed = results.filter(r => r.status === 'fail').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const total = results.length;

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-900/50 rounded-lg">
            <Play className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-100">Pythia Core Tests</h3>
            <p className="text-sm text-slate-400">Verify all systems are working</p>
          </div>
        </div>
        <button
          onClick={runTests}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-lg transition-colors flex items-center space-x-2"
        >
          {isRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
          <span>{isRunning ? 'Running...' : 'Run Tests'}</span>
        </button>
      </div>

      {/* Results Summary */}
      {results.length > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-slate-700/50 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-slate-100">{total}</div>
            <div className="text-xs text-slate-400">Total</div>
          </div>
          <div className="bg-emerald-900/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-emerald-400">{passed}</div>
            <div className="text-xs text-slate-400">Passed</div>
          </div>
          <div className="bg-red-900/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-red-400">{failed}</div>
            <div className="text-xs text-slate-400">Failed</div>
          </div>
          <div className="bg-amber-900/20 rounded-lg p-3 text-center">
            <div className="text-lg font-bold text-amber-400">{warnings}</div>
            <div className="text-xs text-slate-400">Warnings</div>
          </div>
        </div>
      )}

      {/* Test Results */}
      <div className="space-y-3">
        {results.map((result, index) => (
          <div key={index} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
            <div className="flex items-center space-x-3">
              {getTestIcon(result.test)}
              <div>
                <p className="text-sm font-medium text-slate-100">{result.test}</p>
                <p className="text-xs text-slate-400">{result.message}</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(result.status)}
              <span className="text-xs text-slate-400 capitalize">{result.status}</span>
            </div>
          </div>
        ))}
      </div>

      {results.length === 0 && (
        <div className="text-center py-8">
          <Play className="w-8 h-8 text-slate-500 mx-auto mb-2" />
          <p className="text-slate-400">Click "Run Tests" to verify Pythia functionality</p>
        </div>
      )}
    </div>
  );
}