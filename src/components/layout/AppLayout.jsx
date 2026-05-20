import { useState, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import ToastContainer from '@/components/ui/Toast';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

export default function AppLayout() {
  const { isAuthenticated } = useAuth();

  // Desktop: sidebar collapsed state
  const [collapsed, setCollapsed] = useState(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  // Mobile: drawer open state
  const [mobileOpen, setMobileOpen] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(collapsed));
  }, [collapsed]);

  // Close mobile drawer on resize to desktop
  useEffect(() => {
    const handler = () => {
      if (window.innerWidth >= 768) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const handleMenuClick = () => {
    if (window.innerWidth < 768) {
      // Mobile: toggle drawer
      setMobileOpen((v) => !v);
    } else {
      // Desktop: collapse sidebar
      setCollapsed((v) => !v);
    }
  };

  return (
    <div className="flex h-screen bg-[#F5F7FB] overflow-hidden">
      {/* ── Sidebar ── */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* ── Main Area ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Topbar */}
        <Topbar onMenuClick={handleMenuClick} />

        {/* Page Content */}
        <main
          className={cn(
            'flex-1 overflow-y-auto',
            'px-4 py-5 sm:px-6 sm:py-6'
          )}
        >
          <Outlet />
        </main>
      </div>

      {/* Toast notifications */}
      <ToastContainer />
    </div>
  );
}
