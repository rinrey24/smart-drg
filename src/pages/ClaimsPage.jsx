import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  ChevronDown,
  Download,
  Play,
  SlidersHorizontal,
  Columns3,
  Flag,
  Loader2,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getClaims } from '@/lib/api';
import { cn, rupiah, rupiahShort, formatNumber, dateID, initials } from '@/lib/utils';
import ClaimDetailModal from '@/components/ClaimDetailModal';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';


const TABS = ['Semua', 'Rawat Inap', 'Rawat Jalan', 'Ditandai'];
const SEVERITIES = ['Semua', 'Severity 0', 'Severity I', 'Severity II', 'Severity III'];
const CMG_LIST = ['Semua CMG', 'B', 'E', 'F', 'G', 'I', 'K', 'L', 'M', 'N', 'Q', 'U'];

// ── Severity badge ────────────────────────────────────────────────────────────
const SEV_STYLES = {
  '0':   { bg: 'bg-[#E4E9F1]', text: 'text-[#64748B]' },
  'I':   { bg: 'bg-[#E4F4EB]', text: 'text-[#2E9A5A]' },
  'II':  { bg: 'bg-[#E1F0FA]', text: 'text-[#1E78B8]' },
  'III': { bg: 'bg-[#E8F0FB]', text: 'text-[#1E4F91]' },
};

function SeverityBadge({ level }) {
  const s = SEV_STYLES[level] ?? SEV_STYLES['0'];
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded-full text-[11px] font-bold', s.bg, s.text)}>
      Sev {level}
    </span>
  );
}

// ── Flag badge ────────────────────────────────────────────────────────────────
const FLAG_MAP = {
  'overstay':              { label: 'Overstay',      bg: 'bg-[#FBE6E3]', text: 'text-[#C8392E]' },
  'upcoding-risk':         { label: 'Upcoding',      bg: 'bg-[#FDF1DD]', text: 'text-[#C97A12]' },
  'diagnosa-tidak-sesuai': { label: 'Dx Mismatch',   bg: 'bg-[#FBE6E3]', text: 'text-[#C8392E]' },
  'los-pendek':            { label: 'LOS Pendek',    bg: 'bg-[#E1F0FA]', text: 'text-[#1E78B8]' },
};

function FlagBadge({ flag }) {
  if (!flag) return null;
  const f = FLAG_MAP[flag] ?? { label: flag, bg: 'bg-[#E4E9F1]', text: 'text-[#64748B]' };
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold', f.bg, f.text)}>
      <Flag size={9} />
      {f.label}
    </span>
  );
}

// ── Patient avatar ────────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  'bg-[#E8F0FB] text-[#1E4F91]',
  'bg-[#E4F4EB] text-[#2E9A5A]',
  'bg-[#FDF1DD] text-[#C97A12]',
  'bg-[#E1F0FA] text-[#1E78B8]',
];

function Avatar({ name, index }) {
  const colorClass = AVATAR_COLORS[index % AVATAR_COLORS.length];
  return (
    <div className={cn('w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0', colorClass)}>
      {initials(name)}
    </div>
  );
}

// ── Select dropdown ───────────────────────────────────────────────────────────
function Select({ value, onChange, options, className }) {
  return (
    <div className={cn('relative', className)}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="appearance-none pl-3 pr-7 py-1.5 text-xs rounded-lg border border-[#E4E9F1] bg-white text-[#0E1A2B] outline-none focus:border-[#1E4F91]/50 cursor-pointer w-full"
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ClaimsPage() {
  const navigate = useNavigate();
  const { activeJobId } = useApp();

  const [claims, setClaims] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Semua');
  const [search, setSearch] = useState('');
  const [severity, setSeverity] = useState('Semua');
  const [cmgFilter, setCmgFilter] = useState('Semua CMG');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const fetchClaims = useCallback(async () => {
    setLoading(true);
    const params = {
      page,
      limit: pageSize,
      ...(search && { q: search }),
      ...(activeTab === 'Rawat Inap' && { tipe_kasus: 'RI' }),
      ...(activeTab === 'Rawat Jalan' && { tipe_kasus: 'RJ' }),
      ...(activeTab === 'Ditandai' && { flagged: true }),
      ...(severity !== 'Semua' && { severity_level: severity.replace('Severity ', '') }),
      ...(cmgFilter !== 'Semua CMG' && { cmg: cmgFilter }),
    };
    try {
      const res = await getClaims(activeJobId, params);
      const data = res.data?.data ?? res.data ?? [];
      setClaims(Array.isArray(data) ? data : []);
      // Backend wraps pagination in meta.pagination.total
      const pag = res.data?.meta?.pagination;
      setTotal(pag?.total ?? res.data?.total ?? (Array.isArray(data) ? data.length : 0));
    } catch {
      setClaims([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [activeJobId, page, pageSize, search, activeTab, severity, cmgFilter]);

  useEffect(() => { fetchClaims(); }, [fetchClaims]);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [activeTab, search, severity, cmgFilter, pageSize]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0E1A2B]">Daftar Klaim</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {total > 0 ? `${formatNumber(total)} klaim ditemukan` : 'Menampilkan klaim dari batch aktif'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" icon={Download}>Export Excel</Button>
          <Button onClick={() => navigate('/analysis')} icon={Play}>Analisis Batch Ini</Button>
        </div>
      </div>

      {/* ── Table Card ── */}
      <div className="bg-white border border-[#E4E9F1] rounded-2xl shadow-sm overflow-hidden">
        {/* Tabs */}
        <div className="flex items-center gap-0 px-5 border-b border-[#E4E9F1]">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-3 py-3 text-xs font-semibold border-b-2 transition-all -mb-px whitespace-nowrap',
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
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Cari pasien, MRN, SEP, INA-CBG…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E4E9F1] bg-white text-[#0E1A2B] placeholder:text-[#94A3B8] outline-none focus:border-[#1E4F91]/50 transition-all"
            />
          </div>

          {/* Severity filter */}
          <Select
            value={severity}
            onChange={setSeverity}
            options={SEVERITIES}
            className="w-36"
          />

          {/* CMG filter */}
          <Select
            value={cmgFilter}
            onChange={setCmgFilter}
            options={CMG_LIST}
            className="w-28"
          />

          <div className="h-5 w-px bg-[#E4E9F1]" />

          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E4E9F1] bg-white text-[#64748B] hover:text-[#0E1A2B] transition-all">
            <SlidersHorizontal size={12} />
            Filter Lanjutan
          </button>
          <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E4E9F1] bg-white text-[#64748B] hover:text-[#0E1A2B] transition-all">
            <Columns3 size={12} />
            Kolom
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E4E9F1] bg-[#FAFBFD] text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Pasien</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">MRN / SEP</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Admisi → Pulang</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B] text-center">LOS</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Diagnosa</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Prosedur</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">INA-CBG</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Sev</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B] text-right">Tarif RS</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B] text-right">Tarif INA-CBG</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Flag</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center">
                    <Loader2 size={22} className="animate-spin text-[#1E4F91] mx-auto" />
                  </td>
                </tr>
              ) : claims.length === 0 ? (
                <tr>
                  <td colSpan={11} className="px-4 py-12 text-center text-sm text-[#94A3B8]">
                    Tidak ada klaim yang cocok dengan filter ini.
                  </td>
                </tr>
              ) : (
                claims.map((claim, i) => (
                  <tr
                    key={claim.id}
                    onClick={() => setSelectedClaim(claim)}
                    className="border-b border-[#E4E9F1] hover:bg-[#F5F7FB] cursor-pointer transition-colors"
                  >
                    {/* Pasien */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={claim.nama_pasien} index={i} />
                        <div>
                          <div className="font-semibold text-[#0E1A2B] text-xs whitespace-nowrap">{claim.nama_pasien}</div>
                          <div className="text-[10px] text-[#64748B]">{claim.dpjp}</div>
                        </div>
                      </div>
                    </td>

                    {/* MRN / SEP */}
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px] font-semibold text-[#0E1A2B]">{claim.mrn}</div>
                      <div className="font-mono text-[10px] text-[#94A3B8] truncate max-w-[140px]" title={claim.sep}>{claim.sep}</div>
                    </td>

                    {/* Admisi → Pulang */}
                    <td className="px-4 py-3 text-xs whitespace-nowrap">
                      <div className="text-[#0E1A2B]">{dateID(claim.admission_date)}</div>
                      <div className="text-[#94A3B8]">→ {dateID(claim.discharge_date)}</div>
                    </td>

                    {/* LOS */}
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 rounded-lg bg-[#F5F7FB] text-xs font-semibold text-[#0E1A2B]">
                        {claim.los}h
                      </span>
                    </td>

                    {/* Diagnosa */}
                    <td className="px-4 py-3 font-mono text-[11px] text-[#64748B] max-w-[110px] truncate" title={claim.diaglist}>
                      {claim.diaglist || '—'}
                    </td>

                    {/* Prosedur */}
                    <td className="px-4 py-3 font-mono text-[11px] text-[#64748B]">
                      {claim.proclist || <span className="text-[#94A3B8]">—</span>}
                    </td>

                    {/* INA-CBG chip */}
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-[#E8F0FB] text-[#1E4F91] font-mono text-[11px] font-semibold whitespace-nowrap">
                        {claim.inacbg}
                      </span>
                    </td>

                    {/* Severity */}
                    <td className="px-4 py-3">
                      <SeverityBadge level={claim.severity_level} />
                    </td>

                    {/* Tarif RS */}
                    <td className="px-4 py-3 text-right font-medium text-xs text-[#0E1A2B] whitespace-nowrap">
                      {rupiahShort(claim.tarif_rs)}
                    </td>

                    {/* Tarif INA-CBG */}
                    <td className={cn(
                      'px-4 py-3 text-right font-medium text-xs whitespace-nowrap',
                      claim.tarif_inacbg < claim.tarif_rs ? 'text-[#C8392E]' : 'text-[#2E9A5A]'
                    )}>
                      {rupiahShort(claim.tarif_inacbg)}
                    </td>

                    {/* Flag */}
                    <td className="px-4 py-3">
                      {claim.flag ? <FlagBadge flag={claim.flag} /> : <span className="text-[#E4E9F1]">—</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          page={page}
          totalPages={totalPages}
          total={total}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
        />
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
