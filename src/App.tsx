import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { Dashboard } from './components/Dashboard';
import { Integration } from './components/Integration';
import { SettingsPanel } from './components/Settings';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-slate-50">
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/integration" element={<Integration />} />
          <Route path="/settings" element={<SettingsPanel />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;