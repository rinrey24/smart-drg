import { useState, useEffect, useCallback } from 'react';
import {
  RefreshCw,
  Download,
  CheckSquare,
  AlertTriangle,
  Clock,
  TrendingUp,
  Zap,
  Heart,
  RotateCcw,
  ExternalLink,
  ChevronDown,
  Loader2,
  X,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getAnalysisResults, runAnalysis } from '@/lib/api';
import { cn, formatNumber, initials } from '@/lib/utils';
import ClaimDetailModal from '@/components/ClaimDetailModal';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';

// ── Category config ───────────────────────────────────────────────────────────
const CATEGORIES = [
  { key: 'Overstay',             label: 'Overstay',             color: '#C8392E', bg: 'bg-[#FBE6E3]', text: 'text-[#C8392E]', dot: 'bg-[#C8392E]', icon: Clock },
  { key: 'Upcoding Risk',        label: 'Upcoding Risk',        color: '#C97A12', bg: 'bg-[#FDF1DD]', text: 'text-[#C97A12]', dot: 'bg-[#C97A12]', icon: TrendingUp },
  { key: 'Diagnosa Tidak Sesuai',label: 'Diagnosa Tidak Sesuai',color: '#1E4F91', bg: 'bg-[#E8F0FB]', text: 'text-[#1E4F91]', dot: 'bg-[#1E4F91]', icon: AlertTriangle },
  { key: 'LOS Pendek',           label: 'LOS Pendek',           color: '#1E78B8', bg: 'bg-[#E1F0FA]', text: 'text-[#1E78B8]', dot: 'bg-[#1E78B8]', icon: Zap },
  { key: 'Readmisi 30 Hari',     label: 'Readmisi 30 Hari',     color: '#2E9A5A', bg: 'bg-[#E4F4EB]', text: 'text-[#2E9A5A]', dot: 'bg-[#2E9A5A]', icon: Heart },
];

const SEVERITY_CONFIG = {
  high:   { label: 'Tinggi',   bg: 'bg-[#FBE6E3]', text: 'text-[#C8392E]' },
  medium: { label: 'Sedang',   bg: 'bg-[#FDF1DD]', text: 'text-[#C97A12]' },
  low:    { label: 'Rendah',   bg: 'bg-[#E4F4EB]', text: 'text-[#2E9A5A]' },
};

const AVATAR_COLORS = [
  'bg-[#E8F0FB] text-[#1E4F91]',
  'bg-[#E4F4EB] text-[#2E9A5A]',
  'bg-[#FDF1DD] text-[#C97A12]',
  'bg-[#E1F0FA] text-[#1E78B8]',
];

// ── Sub-components ────────────────────────────────────────────────────────────
function Avatar({ name, index }) {
  return (
    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0', AVATAR_COLORS[index % 4])}>
      {initials(name)}
    </div>
  );
}

function SeverityBadge({ severity }) {
  const s = SEVERITY_CONFIG[severity] ?? { label: severity, bg: 'bg-[#E4E9F1]', text: 'text-[#64748B]' };
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold', s.bg, s.text)}>
      {s.label}
    </span>
  );
}

function KategoriBadge({ kategori }) {
  const cat = CATEGORIES.find((c) => c.key === kategori);
  if (!cat) return <span className="text-xs text-[#64748B]">{kategori}</span>;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold', cat.bg, cat.text)}>
      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', cat.dot)} />
      {cat.label}
    </span>
  );
}

function ScoreBar({ score }) {
  const color =
    score >= 80 ? 'bg-[#C8392E]' :
    score >= 60 ? 'bg-[#C97A12]' :
    'bg-[#1E78B8]';
  const textColor =
    score >= 80 ? 'text-[#C8392E]' :
    score >= 60 ? 'text-[#C97A12]' :
    'text-[#1E78B8]';
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#F5F7FB] rounded-full overflow-hidden min-w-[60px]">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${score}%` }} />
      </div>
      <span className={cn('text-xs font-bold tabular-nums w-7 text-right', textColor)}>{score}</span>
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
export default function AnalysisPage() {
  const { activeJobId, toast } = useApp();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [activeTab, setActiveTab] = useState('Semua');
  const [severityFilter, setSeverityFilter] = useState('Semua');
  const [sortBy, setSortBy] = useState('score_desc');
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState(null);
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const fetchResults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAnalysisResults(activeJobId);
      const data = res.data?.data ?? res.data ?? [];
      setResults(Array.isArray(data) ? data : []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [activeJobId]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const handleReAnalyze = async () => {
    setRunning(true);
    try {
      await runAnalysis(activeJobId);
      toast('Analisis ulang berhasil dijalankan.', 'success');
      fetchResults();
    } catch {
      toast('Gagal menjalankan analisis ulang.', 'error');
      setRunning(false);
    } finally {
      setRunning(false);
    }
  };

  // Counts computed from real API data
  const categoryCounts = Object.fromEntries(
    CATEGORIES.map((cat) => [cat.key, results.filter((r) => r.kategori === cat.key).length])
  );
  const totalFlagged = results.length;

  // Filter & sort
  const filtered = results.filter((r) => {
    if (activeTab !== 'Semua' && r.kategori !== activeTab) return false;
    if (activeCategoryFilter && r.kategori !== activeCategoryFilter) return false;
    if (severityFilter !== 'Semua' && r.severity !== severityFilter) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'score_desc') return b.score_generated - a.score_generated;
    if (sortBy === 'score_asc') return a.score_generated - b.score_generated;
    if (sortBy === 'kategori') return a.kategori.localeCompare(b.kategori);
    return 0;
  });

  // Reset to page 1 when any filter changes
  useEffect(() => { setPage(1); }, [activeTab, severityFilter, sortBy, activeCategoryFilter]);

  const TABS = ['Semua', ...CATEGORIES.map((c) => c.key)];

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  const getClaimForResult = (r) => ({
    id: r.claim_id,
    nama_pasien: r.nama_pasien ?? `Klaim #${r.claim_id}`,
    mrn: r.mrn ?? '—',
    inacbg: r.inacbg ?? '—',
  });

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0E1A2B]">Analisis Klaim</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            <span className="font-semibold text-[#C8392E]">{formatNumber(totalFlagged)}</span> klaim ditandai dari batch aktif
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary" size="md"
            onClick={handleReAnalyze}
            disabled={running}
            icon={RotateCcw}
            className={running ? '[&>svg]:animate-spin' : ''}
          >
            Re-analisis
          </Button>
          <Button variant="secondary" size="md" icon={Download}>Export Hasil</Button>
          <Button variant="success" icon={CheckSquare}>Tandai Sudah Direview</Button>
        </div>
      </div>

      {/* ── Category Summary Cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategoryFilter === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategoryFilter(isActive ? null : cat.key)}
              className={cn(
                'flex flex-col gap-2 p-4 rounded-2xl border text-left transition-all shadow-sm',
                isActive
                  ? 'border-current ring-2 ring-offset-1'
                  : 'border-[#E4E9F1] bg-white hover:border-gray-300',
                isActive ? cat.bg : 'bg-white',
              )}
              style={isActive ? { ringColor: cat.color } : undefined}
            >
              <div className="flex items-center justify-between">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: cat.color + '20' }}
                >
                  <Icon size={15} style={{ color: cat.color }} />
                </div>
                {isActive && (
                  <X size={12} className="text-[#64748B]" />
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-[#0E1A2B]">{categoryCounts[cat.key] ?? 0}</div>
                <div className="text-xs text-[#64748B] mt-0.5 leading-tight">{cat.label}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white border border-[#E4E9F1] rounded-2xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-0 px-5 border-b border-[#E4E9F1] overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-3 text-xs font-semibold border-b-2 transition-all -mb-px whitespace-nowrap shrink-0',
                activeTab === tab
                  ? 'border-[#1E4F91] text-[#1E4F91]'
                  : 'border-transparent text-[#64748B] hover:text-[#0E1A2B]'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-[#E4E9F1] bg-[#FAFBFD]">
          <Select
            value={severityFilter}
            onChange={setSeverityFilter}
            options={[
              { value: 'Semua', label: 'Semua Severity' },
              { value: 'high', label: 'Tinggi' },
              { value: 'medium', label: 'Sedang' },
              { value: 'low', label: 'Rendah' },
            ]}
            className="w-36"
          />
          <Select
            value={sortBy}
            onChange={setSortBy}
            options={[
              { value: 'score_desc', label: 'Skor: Tertinggi' },
              { value: 'score_asc', label: 'Skor: Terendah' },
              { value: 'kategori', label: 'Kategori A–Z' },
            ]}
            className="w-40"
          />
          <div className="ml-auto text-xs text-[#64748B]">
            {formatNumber(filtered.length)} hasil ditemukan
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E4E9F1] bg-[#FAFBFD] text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Pasien / Klaim</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Kategori Risiko</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Severity</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B] min-w-[140px]">Skor</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Sumber Rule</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Pesan Sistem</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Loader2 size={22} className="animate-spin text-[#1E4F91] mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[#94A3B8]">
                    Tidak ada hasil yang cocok dengan filter ini.
                  </td>
                </tr>
              ) : (
                paginated.map((r, i) => {
                  const claim = getClaimForResult(r);
                  return (
                    <tr key={`${r.claim_id}-${i}`} className="border-b border-[#E4E9F1] hover:bg-[#F5F7FB] transition-colors">
                      {/* Pasien / Klaim */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <Avatar name={claim.nama_pasien} index={i} />
                          <div>
                            <div className="font-semibold text-xs text-[#0E1A2B] whitespace-nowrap">{claim.nama_pasien}</div>
                            <div className="text-[10px] text-[#94A3B8] font-mono">{claim.mrn} · {claim.inacbg}</div>
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="px-4 py-3">
                        <KategoriBadge kategori={r.kategori} />
                      </td>

                      {/* Severity */}
                      <td className="px-4 py-3">
                        <SeverityBadge severity={r.severity} />
                      </td>

                      {/* Skor */}
                      <td className="px-4 py-3">
                        <ScoreBar score={r.score_generated} />
                      </td>

                      {/* Sumber Rule */}
                      <td className="px-4 py-3">
                        <span className="font-mono text-[10px] text-[#64748B] bg-[#F5F7FB] px-1.5 py-0.5 rounded">
                          {r.source}
                        </span>
                      </td>

                      {/* Pesan */}
                      <td className="px-4 py-3 text-xs text-[#64748B] max-w-[260px]">
                        {r.message_generated}
                      </td>

                      {/* Detail button */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setSelectedClaim(claim)}
                          className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-[#E4E9F1] text-[#1E4F91] hover:bg-[#E8F0FB] transition-all whitespace-nowrap"
                        >
                          <ExternalLink size={11} />
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {!loading && filtered.length > 0 && (
          <Pagination
            page={page}
            totalPages={totalPages}
            total={filtered.length}
            pageSize={pageSize}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
          />
        )}
      </div>

      {/* ── Claim Detail Modal ── */}
      {selectedClaim && (
        <ClaimDetailModal
          claim={selectedClaim}
          onClose={() => setSelectedClaim(null)}
        />
      )}
    </div>
  );
}
