import React, { Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Integration } from './components/Integration';
import { SettingsPanel } from './components/Settings';
import ErrorBoundary from './components/ErrorBoundary';
import Spinner from './components/Spinner';

// Lazy load advanced components with chunk names for better debugging
const CohortAnalysis = React.lazy(() => 
  import(/* webpackChunkName: "cohort-analysis" */ './components/CohortAnalysis')
);
const SourceTrends = React.lazy(() => 
  import(/* webpackChunkName: "source-trends" */ './components/SourceTrends')
);
const GeographicHeatmap = React.lazy(() => 
  import(/* webpackChunkName: "geographic-heatmap" */ './components/GeographicHeatmap')
);

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
            
            {/* Advanced Analytics Routes with proper error boundaries */}
            <Route 
              path="/dashboard/cohorts" 
              element={
                <div className="min-h-screen bg-slate-900 p-6">
                  <div className="max-w-7xl mx-auto">
                    <ErrorBoundary>
                      <Suspense fallback={
                        <div className="flex items-center justify-center h-[600px]">
                          <Spinner size="lg" />
                        </div>
                      }>
                        <CohortAnalysis />
                      </Suspense>
                    </ErrorBoundary>
                  </div>
                </div>
              } 
            />
            <Route 
              path="/dashboard/sources" 
              element={
                <div className="min-h-screen bg-slate-900 p-6">
                  <div className="max-w-7xl mx-auto">
                    <ErrorBoundary>
                      <Suspense fallback={
                        <div className="flex items-center justify-center h-[600px]">
                          <Spinner size="lg" />
                        </div>
                      }>
                        <SourceTrends />
                      </Suspense>
                    </ErrorBoundary>
                  </div>
                </div>
              } 
            />
            <Route 
              path="/dashboard/geography" 
              element={
                <div className="min-h-screen bg-slate-900 p-6">
                  <div className="max-w-7xl mx-auto">
                    <ErrorBoundary>
                      <Suspense fallback={
                        <div className="flex items-center justify-center h-[600px]">
                          <Spinner size="lg" />
                        </div>
                      }>
                        <GeographicHeatmap />
                      </Suspense>
                    </ErrorBoundary>
                  </div>
                </div>
              } 
            />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  );
}

export default App;