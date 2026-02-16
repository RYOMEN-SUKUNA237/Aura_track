import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import TrackingDashboard from './pages/TrackingDashboard';
import ServiceDetailPage from './pages/ServiceDetail';
import ChatWidget from './components/ChatWidget';
import { AnimatePresence } from 'framer-motion';

const AppContent: React.FC = () => {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/dashboard');

  return (
    <>
      <AnimatePresence mode="wait">
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/track/:trackingId" element={<TrackingDashboard />} />
          <Route path="/services/:slug" element={<ServiceDetailPage />} />
        </Routes>
      </AnimatePresence>
      {!isAdmin && <ChatWidget />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;