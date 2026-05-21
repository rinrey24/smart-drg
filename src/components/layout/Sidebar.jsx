import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Upload,
  FileText,
  Search,
  ChartBar,
  Settings,
  Cpu,
  Clock,
  Stethoscope,
  Activity,
  Layers,
  Tag,
  LogOut,
  Menu,
  TrendingUp,
  Users,
} from 'lucide-react';
import { cn, initials } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import BrandMark from '@/components/ui/BrandMark';

// ─── Nav Config ──────────────────────────────────────────────────────────────

const NAV_SECTIONS = [
  {
    label: 'Utama',
    items: [
      { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/import', icon: Upload, label: 'Import .txt' },
      { to: '/claims', icon: FileText, label: 'Daftar Klaim' },
      { to: '/analysis', icon: Search, label: 'Analisis', badge: 'flagged' },
      { to: '/report', icon: ChartBar, label: 'Laporan' },
    ],
  },
  {
    label: 'Engine',
    items: [
      { to: '/rules', icon: Cpu, label: 'Rule Engine' },
      { to: '/overstay', icon: Clock, label: 'Overstay DRG' },
    ],
  },
  {
    label: 'Master Data',
    items: [
      { to: '/diagnoses', icon: Stethoscope, label: 'Diagnosa ICD-10' },
      { to: '/procedures', icon: Activity, label: 'Prosedur ICD-9-CM' },
      { to: '/cmgs', icon: Layers, label: 'CMG' },
      { to: '/casetypes', icon: Tag, label: 'Tipe Kasus' },
      { to: '/discharges', icon: TrendingUp, label: 'Discharge Status' },
    ],
  },
  {
    label: 'Administrasi',
    items: [
      { to: '/users', icon: Users, label: 'Pengguna' },
      { to: '/settings', icon: Settings, label: 'Pengaturan' },
    ],
  },
];

// ─── Tooltip ─────────────────────────────────────────────────────────────────

function Tooltip({ label, children }) {
  return (
    <div className="relative group/tooltip">
      {children}
      <div
        className={cn(
          'absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50',
          'px-2.5 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap',
          'bg-[#0E1A2B] text-white shadow-xl',
          'opacity-0 pointer-events-none scale-95',
          'group-hover/tooltip:opacity-100 group-hover/tooltip:scale-100',
          'transition-all duration-150'
        )}
      >
        {label}
        <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-[#0E1A2B]" />
      </div>
    </div>
  );
}

// ─── Nav Item ─────────────────────────────────────────────────────────────────

function NavItem({ item, collapsed, badge }) {
  const location = useLocation();
  const isActive =
    location.pathname === item.to ||
    (item.to !== '/dashboard' && location.pathname.startsWith(item.to));

  const inner = (
    <NavLink
      to={item.to}
      className={cn(
        'relative flex items-center gap-3 rounded-lg transition-all duration-150',
        'text-sm font-medium group/navitem',
        collapsed ? 'justify-center px-0 py-2.5 w-10 mx-auto' : 'px-3 py-2',
        isActive
          ? 'bg-[#E8F0FB] text-[#0E2D5C] font-semibold'
          : 'text-[#64748B] hover:bg-[#F5F7FB] hover:text-[#2A3B55]'
      )}
    >
      {/* Left active indicator bar */}
      {isActive && !collapsed && (
        <span className="absolute -left-2 top-1.5 bottom-1.5 w-[3px] bg-[#1E4F91] rounded-r-full" />
      )}
      <item.icon
        size={17}
        className={cn(
          'shrink-0 transition-colors',
          isActive ? 'text-[#1E4F91]' : 'text-[#94A3B8] group-hover/navitem:text-[#2A3B55]'
        )}
      />
      {!collapsed && (
        <span className="flex-1 truncate">{item.label}</span>
      )}
      {!collapsed && badge > 0 && (
        <span className={cn(
          'ml-auto text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none',
          isActive ? 'bg-[#1E4F91] text-white' : 'bg-[#E4E9F1] text-[#64748B]'
        )}>
          {badge > 99 ? '99+' : badge}
        </span>
      )}
    </NavLink>
  );

  if (collapsed) {
    return <Tooltip label={item.label}>{inner}</Tooltip>;
  }
  return inner;
}

// ─── Sidebar ─────────────────────────────────────────────────────────────────

export default function Sidebar({ collapsed, onToggle, mobileOpen, onMobileClose, flaggedCount = 0 }) {
  const { user, logout } = useAuth();
  const overlayRef = useRef(null);

  // Close on outside click (mobile)
  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e) => {
      if (overlayRef.current && e.target === overlayRef.current) {
        onMobileClose?.();
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [mobileOpen, onMobileClose]);

  // Close on route change (mobile)
  const location = useLocation();
  useEffect(() => {
    onMobileClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  const sidebarContent = (
    <aside
      className={cn(
        'flex flex-col h-full bg-white border-r border-[#E4E9F1]',
        'transition-all duration-200 ease-in-out overflow-hidden',
        collapsed ? 'w-[72px]' : 'w-[248px]'
      )}
    >
      {/* ── Brand ── */}
      <div
        className={cn(
          'flex items-center gap-3 px-4 border-b border-[#E4E9F1]',
          'shrink-0',
          collapsed ? 'justify-center py-[18px]' : 'py-[17px]'
        )}
      >
        {/* Logo */}
        <BrandMark size={38} />

        {!collapsed && (
          <div className="min-w-0">
            <div className="text-sm font-bold text-[#0E1A2B] leading-tight tracking-tight">
              Smart <span className="text-[#1E4F91]">Drg</span>
            </div>
            <div className="text-[10px] font-semibold text-[#64748B] leading-tight uppercase tracking-widest">
              Klaim BPJS
            </div>
          </div>
        )}
      </div>

      {/* ── Nav ── */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_SECTIONS.map((section) => (
          <div key={section.label}>
            {!collapsed && (
              <div className="px-3 mb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">
                  {section.label}
                </span>
              </div>
            )}
            {collapsed && (
              <div className="flex justify-center mb-1">
                <div className="w-4 h-px bg-[#E4E9F1]" />
              </div>
            )}
            <ul className="space-y-0.5">
              {section.items.map((item) => (
                <li key={item.to}>
                  <NavItem
                    item={item}
                    collapsed={collapsed}
                    badge={item.badge === 'flagged' ? flaggedCount : 0}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      {/* ── User Footer ── */}
      <div className="shrink-0 border-t border-[#E4E9F1] p-3">
        {collapsed ? (
          <div className="flex flex-col items-center gap-2">
            <Tooltip label={user?.name ?? user?.username ?? 'User'}>
              <div className="w-8 h-8 rounded-full bg-[#1E4F91] text-white text-xs font-bold flex items-center justify-center cursor-default select-none">
                {initials(user?.name ?? user?.username ?? 'U')}
              </div>
            </Tooltip>
            <Tooltip label="Keluar">
              <button
                onClick={logout}
                className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#FBE6E3] hover:text-[#C8392E] transition-colors"
                aria-label="Logout"
              >
                <LogOut size={15} />
              </button>
            </Tooltip>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-[#1E4F91] text-white text-xs font-bold flex items-center justify-center shrink-0 select-none">
              {initials(user?.name ?? user?.username ?? 'U')}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold text-[#0E1A2B] truncate leading-tight">
                {user?.name ?? user?.username ?? 'Pengguna'}
              </div>
              <div className="text-[10px] text-[#64748B] truncate leading-tight capitalize">
                {user?.role ?? 'Staff'}
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#FBE6E3] hover:text-[#C8392E] transition-colors shrink-0"
              title="Keluar"
              aria-label="Logout"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex h-full">{sidebarContent}</div>

      {/* Mobile overlay drawer */}
      {mobileOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
        >
          <div className="absolute left-0 top-0 bottom-0 w-[248px] z-50 shadow-2xl">
            {/* Force uncollapsed on mobile drawer */}
            <aside className="flex flex-col h-full bg-white border-r border-[#E4E9F1] w-[248px]">
              {/* Brand */}
              <div className="flex items-center gap-3 px-4 py-[17px] border-b border-[#E4E9F1]">
                <BrandMark size={36} />
                <div className="min-w-0">
                  <div className="text-sm font-bold text-[#0E1A2B] leading-tight tracking-tight">
                    Smart <span className="text-[#1E4F91]">Drg</span>
                  </div>
                  <div className="text-[10px] font-semibold text-[#64748B] leading-tight uppercase tracking-widest">Klaim BPJS</div>
                </div>
                <button
                  onClick={onMobileClose}
                  className="ml-auto p-1.5 rounded-lg text-[#64748B] hover:bg-[#E4E9F1] transition-colors"
                  aria-label="Tutup menu"
                >
                  <Menu size={18} />
                </button>
              </div>

              {/* Nav */}
              <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
                {NAV_SECTIONS.map((section) => (
                  <div key={section.label}>
                    <div className="px-3 mb-1">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">
                        {section.label}
                      </span>
                    </div>
                    <ul className="space-y-0.5">
                      {section.items.map((item) => (
                        <li key={item.to}>
                          <NavItem
                            item={item}
                            collapsed={false}
                            badge={item.badge === 'flagged' ? flaggedCount : 0}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </nav>

              {/* User footer */}
              <div className="shrink-0 border-t border-[#E4E9F1] p-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#1E4F91] text-white text-xs font-bold flex items-center justify-center shrink-0">
                    {initials(user?.name ?? user?.username ?? 'U')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-semibold text-[#0E1A2B] truncate">{user?.name ?? user?.username ?? 'Pengguna'}</div>
                    <div className="text-[10px] text-[#64748B] truncate capitalize">{user?.role ?? 'Staff'}</div>
                  </div>
                  <button
                    onClick={logout}
                    className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#FBE6E3] hover:text-[#C8392E] transition-colors shrink-0"
                    aria-label="Logout"
                  >
                    <LogOut size={15} />
                  </button>
                </div>
              </div>
            </aside>
          </div>
        </div>
      )}
    </>
  );
}
