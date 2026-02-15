import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background dark flex">
      <Sidebar />
      <main className="flex-1 overflow-auto relative">
        <Outlet />
      </main>
    </div>
  );
}