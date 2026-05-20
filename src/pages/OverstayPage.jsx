import { useState, useEffect, useCallback } from 'react';
import {
  Clock,
  Download,
  Search,
  ChevronDown,
  Info,
  Edit2,
  Plus,
  Loader2,
} from 'lucide-react';
import { getOverstays } from '@/lib/api';
import { cn, formatNumber } from '@/lib/utils';
import Button from '@/components/ui/Button';

// ── Sub-components ────────────────────────────────────────────────────────────
function LosBar({ value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#F5F7FB] rounded-full overflow-hidden min-w-[60px]">
        <div
          className="h-full rounded-full"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
      <span className="text-xs font-semibold tabular-nums text-[#0E1A2B] w-8 text-right">{value}</span>
    </div>
  );
}

// Normalize backend fields to frontend display shape
function normalizeOverstay(b) {
  return {
    id:         b.id,
    inacbg:     b.inacbg ?? b.kode_inacbg ?? '—',
    deskripsi:  b.deskripsi ?? b.description ?? '—',
    cmg:        b.cmg ?? '—',
    los_median: Number(b.los_median ?? b.median_los ?? 0),
    los_atas:   Number(b.los_atas ?? b.upper_los ?? b.los_upper ?? 0),
    los_bawah:  Number(b.los_bawah ?? b.lower_los ?? b.los_lower ?? 0),
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function OverstayPage() {
  const [data, setData]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [cmgFilter, setCmgFilter] = useState('Semua CMG');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getOverstays({ limit: 200 });
      const raw = res.data?.data ?? res.data ?? [];
      setData(Array.isArray(raw) ? raw.map(normalizeOverstay) : []);
    } catch {
      setData([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const cmgOptions = ['Semua CMG', ...new Set(data.map((r) => r.cmg.split(' – ')[0]).filter(Boolean))];

  const filtered = data.filter((r) => {
    if (search && !r.inacbg.toLowerCase().includes(search.toLowerCase()) && !r.deskripsi.toLowerCase().includes(search.toLowerCase())) return false;
    if (cmgFilter !== 'Semua CMG' && !r.cmg.startsWith(cmgFilter)) return false;
    return true;
  });

  const maxLos = Math.max(...data.map((r) => r.los_atas), 1);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0E1A2B]">Overstay DRG</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Batas LOS per INA-CBG — referensi deteksi klaim overstay
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" icon={Download}>Export</Button>
          <Button icon={Plus}>Tambah INA-CBG</Button>
        </div>
      </div>

      {/* ── Info banner ── */}
      <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-[#E8F0FB] border border-[#C8D8F4]">
        <Info size={15} className="text-[#1E4F91] shrink-0 mt-0.5" />
        <p className="text-xs text-[#1E4F91]">
          <span className="font-semibold">LOS Atas</span> adalah batas maksimal hari rawat sesuai standar DRG.
          Klaim dengan LOS aktual melebihi nilai ini akan dipicu sebagai Overstay.
          <span className="font-semibold"> LOS Bawah</span> adalah batas minimum; di bawahnya akan dipicu sebagai LOS Pendek.
        </p>
      </div>

      {/* ── Table card ── */}
      <div className="bg-white border border-[#E4E9F1] rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-[#E4E9F1] bg-[#FAFBFD]">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Cari kode INA-CBG atau deskripsi…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E4E9F1] bg-white text-[#0E1A2B] placeholder:text-[#94A3B8] outline-none focus:border-[#1E4F91]/50 transition-all"
            />
          </div>
          <div className="relative">
            <select
              value={cmgFilter}
              onChange={(e) => setCmgFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 text-xs rounded-lg border border-[#E4E9F1] bg-white text-[#0E1A2B] outline-none focus:border-[#1E4F91]/50 cursor-pointer"
            >
              {cmgOptions.map((o) => <option key={o}>{o}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
          </div>
          <div className="ml-auto text-xs text-[#64748B]">{formatNumber(filtered.length)} INA-CBG</div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E4E9F1] bg-[#FAFBFD] text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">INA-CBG</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Deskripsi</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">CMG</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B] min-w-[140px]">Median LOS (hari)</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B] min-w-[140px]">LOS Atas (hari)</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B] min-w-[140px]">LOS Bawah (hari)</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <Loader2 size={20} className="animate-spin text-[#1E4F91] mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[#94A3B8]">
                    {data.length === 0 ? 'Belum ada data batas LOS.' : 'Tidak ada data yang cocok.'}
                  </td>
                </tr>
              ) : (
                filtered.map((row) => (
                  <tr key={row.id} className="border-b border-[#E4E9F1] hover:bg-[#F5F7FB] transition-colors">
                    {/* INA-CBG chip */}
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-1 rounded-lg bg-[#E8F0FB] text-[#1E4F91] font-mono text-xs font-bold whitespace-nowrap">
                        {row.inacbg}
                      </span>
                    </td>

                    {/* Deskripsi */}
                    <td className="px-4 py-3 text-xs text-[#0E1A2B] max-w-[220px]">
                      {row.deskripsi}
                    </td>

                    {/* CMG */}
                    <td className="px-4 py-3 text-xs text-[#64748B] whitespace-nowrap">{row.cmg}</td>

                    {/* Median LOS */}
                    <td className="px-4 py-3">
                      <LosBar value={row.los_median} max={maxLos} color="#1E4F91" />
                    </td>

                    {/* LOS Atas */}
                    <td className="px-4 py-3">
                      <LosBar value={row.los_atas} max={maxLos} color="#C8392E" />
                    </td>

                    {/* LOS Bawah */}
                    <td className="px-4 py-3">
                      <LosBar value={row.los_bawah} max={maxLos} color="#2E9A5A" />
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right">
                      <button className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg border border-[#E4E9F1] text-[#1E4F91] hover:bg-[#E8F0FB] transition-all">
                        <Edit2 size={10} />
                        Edit
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 px-5 py-3 border-t border-[#E4E9F1] bg-[#FAFBFD]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full bg-[#1E4F91]" />
            <span className="text-[10px] text-[#64748B]">Median LOS</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full bg-[#C8392E]" />
            <span className="text-[10px] text-[#64748B]">LOS Atas (trigger overstay)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-1.5 rounded-full bg-[#2E9A5A]" />
            <span className="text-[10px] text-[#64748B]">LOS Bawah (trigger LOS pendek)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
