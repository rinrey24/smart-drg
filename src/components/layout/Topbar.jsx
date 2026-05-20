import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  Check,
} from 'lucide-react';
import { cn, initials, formatNumber, dateID } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';

// ─── Breadcrumb Map ───────────────────────────────────────────────────────────

const ROUTE_LABELS = {
  '/dashboard': ['Dashboard'],
  '/import':    ['Import .txt'],
  '/claims':    ['Daftar Klaim'],
  '/analysis':  ['Analisis'],
  '/report':    ['Laporan'],
  '/rules':     ['Engine', 'Rule Engine'],
  '/overstay':  ['Engine', 'Overstay DRG'],
  '/hospitals': ['Master Data', 'Rumah Sakit'],
  '/diagnoses': ['Master Data', 'Diagnosa ICD-10'],
  '/procedures':['Master Data', 'Prosedur ICD-9-CM'],
  '/cmgs':      ['Master Data', 'CMG'],
  '/casetypes': ['Master Data', 'Tipe Kasus'],
  '/discharges':['Master Data', 'Discharge Status'],
  '/users':     ['Administrasi', 'Pengguna'],
  '/settings':  ['Administrasi', 'Pengaturan'],
};

function useBreadcrumbs() {
  const location = useLocation();
  const segments = ROUTE_LABELS[location.pathname] ?? [];
  return ['Smart Drg', ...segments];
}

// ─── Job Picker ───────────────────────────────────────────────────────────────

const STATUS_DOT = {
  completed: '#2E9A5A',
  running:   '#1E78B8',
  failed:    '#C8392E',
};

function JobPicker() {
  const { activeJobId, setActiveJobId, importJobs } = useApp();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const activeJob = importJobs.find(
    (j) => String(j.id ?? j.import_job_id) === String(activeJobId)
  ) ?? importJobs[0];

  const filename = activeJob?.filename ?? activeJob?.file_name ?? activeJob?.label ?? null;
  const dotColor = STATUS_DOT[activeJob?.status] ?? '#2E9A5A';

  return (
    <div ref={ref} className="relative">
      {/* Pill button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 rounded-[10px] px-[10px] py-[7px]',
          'text-[12.5px] border transition-all duration-150',
          open
            ? 'border-[#1E4F91] bg-[#E8F0FB]'
            : 'border-[#E4E9F1] bg-white hover:bg-[#F5F7FB]'
        )}
      >
        {/* Status dot */}
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: dotColor }}
        />
        {/* "Batch:" label */}
        <span className="text-[#64748B] font-medium shrink-0">Batch:</span>
        {/* Filename */}
        <span
          className="font-semibold text-[#0E1A2B] max-w-[150px] truncate"
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}
        >
          {filename ?? 'Pilih Periode'}
        </span>
        <ChevronDown
          size={13}
          className={cn('shrink-0 text-[#64748B] transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-white rounded-xl border border-[#E4E9F1] shadow-xl min-w-[320px] overflow-hidden">
          <div className="px-3 py-2 border-b border-[#E4E9F1]">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">Pilih Import Job</p>
          </div>
          <ul className="max-h-64 overflow-y-auto py-1">
            {importJobs.length === 0 && (
              <li className="px-3 py-6 text-center text-xs text-[#64748B]">Belum ada data import</li>
            )}
            {importJobs.map((job) => {
              const id = job.id ?? job.import_job_id;
              const isActive = String(id) === String(activeJobId);
              const label = job.filename ?? job.file_name ?? job.label ?? `Job #${id}`;
              const total = job.total != null ? ` • ${formatNumber(job.total)} klaim` : '';
              const dot = STATUS_DOT[job.status] ?? '#2E9A5A';

              return (
                <li key={id}>
                  <button
                    onClick={() => { setActiveJobId(id); setOpen(false); }}
                    className={cn(
                      'w-full flex items-center gap-2.5 px-3 py-2.5 text-left transition-colors',
                      isActive ? 'bg-[#E8F0FB]' : 'hover:bg-[#F5F7FB]'
                    )}
                  >
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: dot }} />
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-semibold text-[#0E1A2B] truncate"
                           style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12 }}>
                        {label}
                      </div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">
                        {id}{total}{job.created_at ? ` • ${dateID(job.created_at)}` : ''}
                      </div>
                    </div>
                    {isActive && <Check size={13} className="shrink-0 text-[#1E4F91]" />}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

// ─── Topbar ───────────────────────────────────────────────────────────────────

export default function Topbar({ onMenuClick }) {
  const { user } = useAuth();
  const { toast } = useApp();
  const crumbs = useBreadcrumbs();
  const [searchValue, setSearchValue] = useState('');

  const handleSearchKeyDown = (e) => {
    if (e.key === 'Enter' && searchValue.trim()) {
      toast(`Pencarian: "${searchValue.trim()}" — fitur pencarian global segera hadir`, 'info');
    }
  };

  return (
    <header className="h-16 bg-white border-b border-[#E4E9F1] flex items-center px-4 gap-3 sticky top-0 z-30">
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        className="p-2 rounded-xl text-[#64748B] hover:bg-[#E8F0FB] hover:text-[#1E4F91] transition-colors shrink-0"
        aria-label="Toggle sidebar"
      >
        <Menu size={20} />
      </button>

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="hidden sm:flex items-center gap-1 flex-1 min-w-0">
        {crumbs.map((crumb, idx) => (
          <span key={idx} className="flex items-center gap-1 min-w-0">
            {idx > 0 && <ChevronRight size={13} className="text-[#94A3B8] shrink-0" />}
            <span className={cn(
              'text-sm truncate',
              idx === crumbs.length - 1 ? 'font-semibold text-[#0E1A2B]' : 'text-[#64748B]'
            )}>
              {crumb}
            </span>
          </span>
        ))}
      </nav>

      {/* Spacer on mobile */}
      <div className="flex-1 sm:hidden" />

      {/* Right controls */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Search with ⌘K */}
        <div className="hidden lg:flex items-center gap-2 bg-[#F5F7FB] border border-[#E4E9F1] rounded-xl px-3 py-1.5 w-52 xl:w-72 focus-within:border-[#1E4F91] focus-within:bg-white transition-all">
          <Search size={14} className="text-[#94A3B8] shrink-0" />
          <input
            type="text"
            placeholder="Cari klaim, MRN, SEP, kode ICD…"
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="flex-1 text-xs bg-transparent outline-none text-[#0E1A2B] placeholder:text-[#94A3B8]"
          />
          <kbd className="hidden xl:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#E4E9F1] text-[#64748B] leading-none">
            ⌘K
          </kbd>
        </div>

        {/* Job Picker */}
        <JobPicker />

        {/* Help */}
        <button
          className="p-2 rounded-xl text-[#64748B] hover:bg-[#E8F0FB] hover:text-[#1E4F91] transition-colors"
          aria-label="Bantuan"
          onClick={() => toast('Dokumentasi Smart DRG — segera hadir', 'info')}
        >
          <HelpCircle size={18} />
        </button>

        {/* Notification */}
        <button
          className="relative p-2 rounded-xl text-[#64748B] hover:bg-[#E8F0FB] hover:text-[#1E4F91] transition-colors"
          aria-label="Notifikasi"
          onClick={() => toast('Tidak ada notifikasi baru', 'info')}
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#C8392E] border-2 border-white" />
        </button>

        {/* Avatar */}
        <div
          className="w-8 h-8 rounded-full bg-[#1E4F91] text-white text-xs font-bold flex items-center justify-center cursor-default select-none shadow-sm"
          title={user?.name ?? user?.username ?? 'User'}
        >
          {initials(user?.name ?? user?.username ?? 'U')}
        </div>
      </div>
    </header>
  );
}
