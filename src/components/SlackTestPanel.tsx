import React, { useState } from 'react';
import { MessageSquare, Send, AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

export function SlackTestPanel() {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testSlackWebhook = async () => {
    setTesting(true);
    setError(null);
    setResult(null);

    try {
      console.log('🧪 Testing Slack webhook...');
      
      const response = await fetch('/.netlify/functions/test-slack', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        console.log('✅ Slack test successful:', data);
      } else {
        setError(data.error || 'Slack test failed');
        console.error('❌ Slack test failed:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Slack test error:', err);
    } finally {
      setTesting(false);
    }
  };

  const triggerTestAlert = async () => {
    setTesting(true);
    setError(null);
    setResult(null);

    try {
      console.log('🚨 Triggering test alert...');
      
      const response = await fetch('/.netlify/functions/trigger-test-alert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult(data);
        console.log('✅ Test alert triggered:', data);
      } else {
        setError(data.error || 'Failed to trigger test alert');
        console.error('❌ Test alert failed:', data);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('❌ Test alert error:', err);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-green-100 rounded-lg">
          <MessageSquare className="w-6 h-6 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Slack Integration Test</h3>
      </div>

      <div className="space-y-4">
        <p className="text-sm text-slate-600">
          Test your Slack webhook integration to ensure alerts are working properly.
        </p>

        <div className="flex space-x-3">
          <button
            onClick={testSlackWebhook}
            disabled={testing}
            className="flex items-center space-x-2 px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white rounded-lg transition-colors"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            <span>Test Webhook</span>
          </button>

          <button
            onClick={triggerTestAlert}
            disabled={testing}
            className="flex items-center space-x-2 px-4 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white rounded-lg transition-colors"
          >
            {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
            <span>Trigger Test Alert</span>
          </button>
        </div>

        {/* Results */}
        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-900">Success!</span>
            </div>
            <p className="text-sm text-green-700 mb-2">{result.message}</p>
            <details className="text-xs text-green-600">
              <summary className="cursor-pointer">View Details</summary>
              <pre className="mt-2 p-2 bg-green-100 rounded overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Errors */}
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center space-x-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-900">Error</span>
            </div>
            <p className="text-sm text-red-700">{error}</p>
            <div className="mt-2 text-xs text-red-600">
              <p>Common issues:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>SLACK_WEBHOOK_URL not set in Netlify environment variables</li>
                <li>Incorrect webhook URL format</li>
                <li>Slack app permissions not configured</li>
                <li>Webhook URL expired or revoked</li>
              </ul>
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Setup Instructions:</h4>
          <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
            <li>Create a Slack app at <a href="https://api.slack.com/apps" target="_blank" rel="noopener noreferrer" className="underline">api.slack.com/apps</a></li>
            <li>Enable "Incoming Webhooks" feature</li>
            <li>Create a webhook for your desired channel</li>
            <li>Copy the webhook URL</li>
            <li>Add it as SLACK_WEBHOOK_URL in Netlify environment variables</li>
            <li>Redeploy your site or restart functions</li>
          </ol>
        </div>
      </div>
    </div>
  );
}