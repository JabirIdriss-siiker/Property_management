import React, { useState } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAppState } from '../../hooks/useAppState';

export function AppLayout() {
  const { currentUser, isLoading } = useAppState();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  /* ---------------------------------------
   Loading state (first app load / refresh)
  --------------------------------------- */
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-muted/30">
        <div className="text-sm text-muted-foreground">
          Chargement...
        </div>
      </div>
    );
  }

  /* ---------------------------------------
   Not authenticated → redirect
  --------------------------------------- */
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  /* ---------------------------------------
   Authenticated layout
  --------------------------------------- */
  return (
    <div className="flex h-screen bg-muted/20 overflow-hidden">
      {/* ================= Sidebar ================= */}

      {/* Desktop */}
      <div className="hidden md:flex md:w-64">
        <Sidebar />
      </div>

      {/* Mobile drawer */}
      <div
        className={`
          fixed inset-y-0 left-0 z-50 w-64 bg-card
          transform transition-transform duration-200 ease-in-out
          md:hidden
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <Sidebar />
      </div>

      {/* Overlay (mobile only) */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ================= Main ================= */}

      <div className="flex flex-1 flex-col">
        <Header onMenuClick={() => setSidebarOpen(true)} />

        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
