import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Integration } from './components/Integration';
import { SettingsPanel } from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import Spinner from './components/Spinner';

// Lazy load advanced components
const CohortAnalysis = React.lazy(() => import('./components/CohortAnalysis'));
const SourceTrends = React.lazy(() => import('./components/SourceTrends'));
const GeographicHeatmap = React.lazy(() => import('./components/GeographicHeatmap'));

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen bg-slate-50">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/integration" element={<Integration />} />
            <Route path="/settings" element={<SettingsPanel />} />
            
            {/* Advanced Analytics Routes */}
            <Route 
              path="/dashboard/cohorts" 
              element={
                <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><Spinner size="lg" /></div>}>
                  <CohortAnalysis />
                </Suspense>
              } 
            />
            <Route 
              path="/dashboard/sources" 
              element={
                <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><Spinner size="lg" /></div>}>
                  <SourceTrends />
                </Suspense>
              } 
            />
            <Route 
              path="/dashboard/geography" 
              element={
                <Suspense fallback={<div className="min-h-screen bg-slate-900 flex items-center justify-center"><Spinner size="lg" /></div>}>
                  <GeographicHeatmap />
                </Suspense>
              } 
            />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;