import { useState, useEffect, useCallback } from 'react';
import {
  BarChart2,
  ShieldAlert,
  LogOut,
  Clock,
  Layers,
  Terminal,
  Download,
  FileText,
  ChevronDown,
  Calendar,
} from 'lucide-react';
import { cn, dateID } from '@/lib/utils';
import Button from '@/components/ui/Button';

// ── Report types ──────────────────────────────────────────────────────────────
const REPORT_TYPES = [
  {
    key: 'rekap-bulanan',
    icon: BarChart2,
    iconColor: 'bg-[#E8F0FB] text-[#1E4F91]',
    title: 'Rekap Bulanan Klaim',
    description: 'Ringkasan volume, tarif, dan selisih klaim per bulan.',
  },
  {
    key: 'severity',
    icon: ShieldAlert,
    iconColor: 'bg-[#FDF1DD] text-[#C97A12]',
    title: 'Rekap Severity Level',
    description: 'Distribusi kasus per severity I, II, III beserta total tarif.',
  },
  {
    key: 'discharge',
    icon: LogOut,
    iconColor: 'bg-[#E4F4EB] text-[#2E9A5A]',
    title: 'Rekap Discharge Status',
    description: 'Komposisi status pulang pasien per batch atau periode.',
  },
  {
    key: 'overstay',
    icon: Clock,
    iconColor: 'bg-[#FBE6E3] text-[#C8392E]',
    title: 'Rekap Overstay',
    description: 'Daftar klaim dengan LOS melebihi batas atas DRG dan selisih hari.',
  },
  {
    key: 'tipe-kasus',
    icon: Layers,
    iconColor: 'bg-[#E1F0FA] text-[#1E78B8]',
    title: 'Rekap Tipe Kasus',
    description: 'Perbandingan Rawat Inap, Rawat Jalan, IGD, dan ICU.',
  },
  {
    key: 'audit-trail',
    icon: Terminal,
    iconColor: 'bg-[#F3EEF9] text-[#7C3AED]',
    title: 'Audit Trail Rule Engine',
    description: 'Log eksekusi rule engine: rule, claim, waktu, dan hasil trigger.',
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function ReportCard({ report, onGenerate }) {
  const Icon = report.icon;
  return (
    <div className="bg-white border border-[#E4E9F1] rounded-2xl p-5 flex flex-col gap-4 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', report.iconColor)}>
          <Icon size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-[#0E1A2B]">{report.title}</div>
          <div className="text-xs text-[#64748B] mt-0.5 leading-snug">{report.description}</div>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5F7FB] text-[10px] font-mono text-[#64748B]">
          PDF • XLSX
        </span>
        <Button size="sm" onClick={() => onGenerate(report)} icon={FileText}>Generate</Button>
      </div>
    </div>
  );
}

function Select({ value, onChange, options, className }) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-1.5 text-xs rounded-lg border border-[#E4E9F1] bg-white text-[#0E1A2B] outline-none focus:border-[#1E4F91]/50 cursor-pointer w-full"
      >
        {options.map((o) => <option key={o.value ?? o} value={o.value ?? o}>{o.label ?? o}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function ReportPage() {
  const [period, setPeriod] = useState('2026-04');
  const [generating, setGenerating] = useState(null);
  const [history, setHistory] = useState([]);

  const handleGenerate = (report) => {
    setGenerating(report.key);
    setTimeout(() => setGenerating(null), 1500);
  };

  const PERIODS = [
    { value: '2026-05', label: 'Mei 2026' },
    { value: '2026-04', label: 'April 2026' },
    { value: '2026-03', label: 'Maret 2026' },
    { value: '2026-02', label: 'Februari 2026' },
    { value: '2026-01', label: 'Januari 2026' },
    { value: '2025-12', label: 'Desember 2025' },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0E1A2B]">Laporan</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Generate dan unduh laporan klaim dalam format PDF atau Excel</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-2 text-sm rounded-xl border border-[#E4E9F1] bg-white">
            <Calendar size={14} className="text-[#64748B]" />
            <Select
              value={period}
              onChange={setPeriod}
              options={PERIODS}
              className="w-36"
            />
          </div>
          <Button icon={Download}>Unduh PDF</Button>
        </div>
      </div>

      {/* ── Report type cards ── */}
      <div>
        <h2 className="text-sm font-semibold text-[#0E1A2B] mb-3">Pilih Jenis Laporan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {REPORT_TYPES.map((report) => (
            <div key={report.key} className="relative">
              {generating === report.key && (
                <div className="absolute inset-0 bg-white/80 rounded-2xl flex items-center justify-center z-10">
                  <div className="flex items-center gap-2 text-xs text-[#1E4F91] font-medium">
                    <div className="w-4 h-4 border-2 border-[#1E4F91] border-t-transparent rounded-full animate-spin" />
                    Generating…
                  </div>
                </div>
              )}
              <ReportCard report={report} onGenerate={handleGenerate} />
            </div>
          ))}
        </div>
      </div>

      {/* ── History table ── */}
      <div className="bg-white border border-[#E4E9F1] rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E9F1]">
          <div>
            <h2 className="text-sm font-semibold text-[#0E1A2B]">Riwayat Generate Laporan</h2>
            <p className="text-xs text-[#64748B] mt-0.5">{history.length} laporan terakhir</p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E4E9F1] bg-[#FAFBFD] text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Nama Laporan</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Periode</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Dibuat oleh</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Tanggal</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Ukuran</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B] text-center">Unduh</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-sm text-[#94A3B8]">
                    Belum ada riwayat laporan yang digenerate.
                  </td>
                </tr>
              ) : history.map((h) => (
                <tr key={h.id} className="border-b border-[#E4E9F1] hover:bg-[#F5F7FB] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <FileText size={13} className="text-[#64748B] shrink-0" />
                      <span className="text-xs font-medium text-[#0E1A2B]">{h.nama}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-[#64748B]">{h.periode}</td>
                  <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{h.dibuat_oleh}</td>
                  <td className="px-4 py-3 text-xs text-[#64748B] whitespace-nowrap">{dateID(h.tanggal)}</td>
                  <td className="px-4 py-3 text-xs text-[#64748B]">{h.ukuran}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="inline-flex items-center justify-center w-7 h-7 rounded-lg border border-[#E4E9F1] text-[#1E4F91] hover:bg-[#E8F0FB] transition-all">
                      <Download size={13} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
