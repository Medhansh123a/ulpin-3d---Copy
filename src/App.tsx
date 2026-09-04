import { useEffect } from 'react';
import { HashRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Toasts from './components/Toasts';
import Layout from './components/Layout';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import PropertyDetail from './pages/PropertyDetail';
import FloorView from './pages/FloorView';
import AIAnalysis from './pages/AIAnalysis';
import DataIngestion from './pages/DataIngestion';
import UlpinGenerator from './pages/UlpinGenerator';
import Analytics from './pages/Analytics';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AppProvider>
      <HashRouter>
        <ScrollToTop />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/property/:id" element={<PropertyDetail />} />
            <Route path="/floor/:id/:floor" element={<FloorView />} />
            <Route path="/ai" element={<AIAnalysis />} />
            <Route path="/data" element={<DataIngestion />} />
            <Route path="/generator" element={<UlpinGenerator />} />
            <Route path="/analytics" element={<Analytics />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toasts />
      </HashRouter>
    </AppProvider>
  );
}
