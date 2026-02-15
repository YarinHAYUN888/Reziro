import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Rooms } from './pages/Rooms';
import { QuickAdd } from './pages/QuickAdd';
import { Costs } from './pages/Costs';
import { Forecasts } from './pages/Forecasts';
import { Financial } from './pages/Financial';
import { Admin } from './pages/Admin';
import Partners from './pages/Partners';
import { useAppStore } from '../store/useAppStore';
import i18n from '../i18n/config';

export default function App() {
  const isHydrated = useAppStore((state) => state.isHydrated);

  useEffect(() => {
    document.documentElement.classList.add('dark');

    const currentLang = i18n.language;
    document.documentElement.dir = currentLang === 'he' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;

    const storage = useAppStore.getState().storage;
    storage
      .loadState()
      .then((savedState) => {
        useAppStore.setState({
          ...savedState,
          isHydrated: true,
        });
      })
      .catch(() => {
        useAppStore.setState({ isHydrated: true });
      });
  }, []);

  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-background dark flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-lg text-primary font-bold">Loading GEST'S...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/quick-add" element={<QuickAdd />} />
          <Route path="/costs" element={<Costs />} />
          <Route path="/forecasts" element={<Forecasts />} />
          <Route path="/financial" element={<Financial />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/partners" element={<Partners />} />
        </Route>
      </Routes>
      <Toaster position="top-left" dir="rtl" />
    </BrowserRouter>
  );
}