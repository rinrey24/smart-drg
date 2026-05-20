import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  FileText,
  Play,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  DollarSign,
  FileCheck,
  Flag,
  ChevronRight,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import {
  getDashboardSummary,
  getDashboardSeverity,
  getDashboardDischarge,
  getDashboardCaseType,
  getDashboardCmg,
  getClaims,
  getAnalysisResults,
} from '@/lib/api';
import { cn, rupiah, rupiahShort, formatNumber, dateID } from '@/lib/utils';
import ClaimDetailModal from '@/components/ClaimDetailModal';
import Button from '@/components/ui/Button';
import { SkeletonKpiCard, SkeletonDonut, SkeletonBars, SkeletonRow, Skeleton } from '@/components/ui/Skeleton';


// ── Sparkline SVG ─────────────────────────────────────────────────────────────
function Sparkline({ values = [], color = '#1E4F91' }) {
  const w = 72, h = 28;
  const max = Math.max(...values, 1);
  const barW = Math.floor(w / values.length) - 1;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
      {values.map((v, i) => {
        const barH = Math.max(2, Math.round((v / max) * (h - 2)));
        return (
          <rect
            key={i}
            x={i * (barW + 1)}
            y={h - barH}
            width={barW}
            height={barH}
            rx="1"
            fill={color}
            fillOpacity={i === values.length - 1 ? 0.9 : 0.4}
          />
        );
      })}
    </svg>
  );
}

// ── Donut Chart SVG ───────────────────────────────────────────────────────────
function DonutChart({ data }) {
  const cx = 72, cy = 72, r = 54, strokeW = 18;
  const total = data.reduce((s, d) => s + d.jumlah_kasus, 0);
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  const segments = data.map((d) => {
    const frac = total > 0 ? d.jumlah_kasus / total : 0;
    const dash = frac * circumference;
    const seg = { ...d, dash, offset, frac };
    offset += dash;
    return seg;
  });

  return (
    <svg width={144} height={144} viewBox="0 0 144 144" aria-hidden="true">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#E4E9F1" strokeWidth={strokeW} />
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={seg.color}
          strokeWidth={strokeW}
          strokeDasharray={`${seg.dash} ${circumference - seg.dash}`}
          strokeDashoffset={-seg.offset + circumference / 4}
          strokeLinecap="butt"
          style={{ transition: 'stroke-dasharray 0.5s ease' }}
        />
      ))}
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="20" fontWeight="700" fill="#0E1A2B">
        {total > 0 ? formatNumber(total) : '—'}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fontSize="10" fill="#64748B">
        klaim
      </text>
    </svg>
  );
}

// ── Flag badge ────────────────────────────────────────────────────────────────
const FLAG_MAP = {
  overstay:              { label: 'Overstay',      bg: 'bg-[#FBE6E3]', text: 'text-[#C8392E]' },
  'upcoding-risk':       { label: 'Upcoding Risk', bg: 'bg-[#FDF1DD]', text: 'text-[#C97A12]' },
  'diagnosa-tidak-sesuai': { label: 'Dx Mismatch', bg: 'bg-[#FBE6E3]', text: 'text-[#C8392E]' },
  'los-pendek':          { label: 'LOS Pendek',    bg: 'bg-[#E1F0FA]', text: 'text-[#1E78B8]' },
};

function FlagBadge({ flag }) {
  if (!flag) return <span className="text-[#94A3B8] text-xs">—</span>;
  const f = FLAG_MAP[flag] ?? { label: flag, bg: 'bg-[#E4E9F1]', text: 'text-[#64748B]' };
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold', f.bg, f.text)}>
      <Flag size={10} />
      {f.label}
    </span>
  );
}

function SeverityBadge({ level }) {
  const map = {
    '0':   { label: 'Sev 0',   bg: 'bg-[#E4E9F1]', text: 'text-[#64748B]' },
    'I':   { label: 'Sev I',   bg: 'bg-[#E4F4EB]', text: 'text-[#2E9A5A]' },
    'II':  { label: 'Sev II',  bg: 'bg-[#E1F0FA]', text: 'text-[#1E78B8]' },
    'III': { label: 'Sev III', bg: 'bg-[#E8F0FB]', text: 'text-[#1E4F91]' },
  };
  const v = map[level] ?? map['0'];
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded-full text-xs font-bold', v.bg, v.text)}>
      {v.label}
    </span>
  );
}

// ── Risk score badge ──────────────────────────────────────────────────────────
function RiskScore({ score }) {
  const color =
    score >= 80 ? 'text-[#C8392E]' :
    score >= 60 ? 'text-[#C97A12]' :
    'text-[#1E78B8]';
  return <span className={cn('font-bold tabular-nums', color)}>{score}</span>;
}

// ── Section header badge ──────────────────────────────────────────────────────
function SectionBadge({ label }) {
  return (
    <span className="px-2 py-0.5 rounded-md bg-[#E8F0FB] text-[#1E4F91] text-[10px] font-mono font-semibold tracking-wide">
      {label}
    </span>
  );
}

// ── KPI Card ──────────────────────────────────────────────────────────────────
function KpiCard({ label, value, delta, positive, sparkValues, color, icon: Icon }) {
  return (
    <div className="bg-white border border-[#E4E9F1] rounded-2xl px-5 py-4 flex flex-col gap-2 shadow-sm relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className={cn('w-7 h-7 rounded-lg flex items-center justify-center', color ?? 'bg-[#E8F0FB]')}>
              <Icon size={14} className="text-white" />
            </div>
            <span className="text-xs text-[#64748B] font-medium">{label}</span>
          </div>
          <div className="text-2xl font-bold text-[#0E1A2B] leading-none mt-1">{value}</div>
        </div>
        <div className="mt-1">
          <Sparkline values={sparkValues} color={positive === false ? '#C8392E' : '#1E4F91'} />
        </div>
      </div>
      {delta != null && (
        <div className={cn('flex items-center gap-1 text-xs font-medium', positive ? 'text-[#2E9A5A]' : 'text-[#C8392E]')}>
          {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {delta}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const navigate = useNavigate();
  const { activeJobId, importJobs } = useApp();

  const [summary, setSummary] = useState(null);
  const [severity, setSeverity] = useState([]);
  const [discharge, setDischarge] = useState([]);
  const [caseType, setCaseType] = useState([]);
  const [cmg, setCmg] = useState([]);
  const [riskyClaims, setRiskyClaims] = useState([]);
  const [ruleResults, setRuleResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClaim, setSelectedClaim] = useState(null);

  const activeJob = importJobs.find(
    (j) => String(j.id ?? j.import_job_id) === String(activeJobId)
  );

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const id = activeJobId;
    try {
      const [sumRes, sevRes, disRes, ctRes, cmgRes, clRes, rrRes] = await Promise.allSettled([
        getDashboardSummary(id),
        getDashboardSeverity(id),
        getDashboardDischarge(id),
        getDashboardCaseType(id),
        getDashboardCmg(id),
        getClaims(id, { limit: 5, sort: 'score', order: 'desc', flag: true }),
        getAnalysisResults(id, { limit: 10 }),
      ]);

      setSummary(sumRes.status === 'fulfilled' ? (sumRes.value.data?.data ?? sumRes.value.data) : null);
      setSeverity(sevRes.status === 'fulfilled' ? (sevRes.value.data?.data ?? sevRes.value.data ?? []) : []);
      setDischarge(disRes.status === 'fulfilled' ? (disRes.value.data?.data ?? disRes.value.data ?? []) : []);
      setCaseType(ctRes.status === 'fulfilled' ? (ctRes.value.data?.data ?? ctRes.value.data ?? []) : []);
      setCmg(cmgRes.status === 'fulfilled' ? (cmgRes.value.data?.data ?? cmgRes.value.data ?? []) : []);
      setRiskyClaims(clRes.status === 'fulfilled' ? (clRes.value.data?.data ?? clRes.value.data ?? []) : []);
      setRuleResults(rrRes.status === 'fulfilled' ? (rrRes.value.data?.data ?? rrRes.value.data ?? []) : []);
    } catch {
      // error handled per-request above via Promise.allSettled
    } finally {
      setLoading(false);
    }
  }, [activeJobId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const sum = summary ?? {};
  const totalSeverity = severity.reduce((a, b) => a + b.jumlah_kasus, 0);
  const maxDischarge = Math.max(...discharge.map((d) => d.jumlah_kasus), 1);
  const maxCmg = Math.max(...cmg.map((d) => d.jumlah_kasus), 1);

  // Merge rule results into claims for risk score
  const claimsWithScore = riskyClaims.map((c) => {
    const rule = ruleResults.find((r) => r.claim_id === c.id);
    return { ...c, score: rule?.score_generated ?? null, riskKategori: rule?.kategori ?? null };
  }).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  const caseTypeIcons = { 'Rawat Inap': '🏥', 'Rawat Jalan': '🚶', 'IGD': '🚨', 'ICU': '🫀' };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0E1A2B]">Dashboard Klaim BPJS</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            {activeJob
              ? <>Batch aktif: <span className="font-semibold text-[#1E4F91]">{activeJob.filename ?? activeJob.file_name ?? activeJob.id}</span> · {dateID(activeJob.created_at)}</>
              : 'Tidak ada batch aktif dipilih.'}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            variant="secondary" size="md"
            onClick={fetchAll}
            icon={RefreshCw}
            className={loading ? '[&>svg]:animate-spin' : ''}
          >
            Segarkan
          </Button>
          <Button variant="secondary" size="md" icon={FileText}>Export PDF</Button>
          <Button onClick={() => navigate('/analysis')} icon={Play}>Jalankan Analisis</Button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {loading ? (
          [1,2,3,4].map((k) => <SkeletonKpiCard key={k} />)
        ) : (
          <>
            <KpiCard label="Total Klaim" value={formatNumber(sum.total_klaim)} delta="+124 dari batch sebelumnya" positive={true} sparkValues={[3800,3950,4050,4100,4200,4250,4287]} color="bg-[#1E4F91]" icon={FileCheck} />
            <KpiCard label="Tarif INA-CBG" value={rupiahShort(sum.total_tarif_inacbg)} delta="Rp 1,5 M vs bulan lalu" positive={true} sparkValues={[14,14.5,15,15.2,15.8,16,16.3]} color="bg-[#2E9A5A]" icon={DollarSign} />
            <KpiCard label="Selisih Tarif" value={rupiahShort(Math.abs(sum.selisih))} delta={sum.selisih < 0 ? 'RS lebih tinggi dari INA-CBG' : 'INA-CBG lebih tinggi'} positive={sum.selisih >= 0} sparkValues={[2.1,2.3,2.4,2.5,2.5,2.5,2.5]} color="bg-[#C8392E]" icon={TrendingDown} />
            <KpiCard label="Klaim Ditandai" value={`${formatNumber(sum.flagged)} (${sum.flagged_pct}%)`} delta={`${sum.flagged_pct}% dari total klaim`} positive={false} sparkValues={[540,558,570,580,590,602,612]} color="bg-[#C97A12]" icon={AlertTriangle} />
          </>
        )}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Severity Donut */}
        <div className="bg-white border border-[#E4E9F1] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#0E1A2B]">Distribusi Severity Level</h2>
            <SectionBadge label="claim_severity_view" />
          </div>
          {loading ? <SkeletonDonut /> : (
          <div className="flex items-center gap-6">
            <div className="shrink-0">
              <DonutChart data={severity} />
            </div>
            <div className="flex-1 flex flex-col gap-2.5">
              {severity.map((s) => {
                const pct = totalSeverity > 0 ? Math.round((s.jumlah_kasus / totalSeverity) * 100) : 0;
                return (
                  <div key={s.kategori} className="flex flex-col gap-0.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: s.color }} />
                        <span className="text-xs font-medium text-[#0E1A2B]">{s.kategori}</span>
                      </div>
                      <span className="text-xs text-[#64748B]">{pct}%</span>
                    </div>
                    <div className="flex items-center justify-between pl-4">
                      <span className="text-xs text-[#64748B]">{formatNumber(s.jumlah_kasus)} kasus</span>
                      <span className="text-xs font-medium text-[#0E1A2B]">{rupiahShort(s.total_tarif)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          )}
        </div>

        {/* Discharge Status */}
        <div className="bg-white border border-[#E4E9F1] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#0E1A2B]">Discharge Status</h2>
            <SectionBadge label="claim_discharge_view" />
          </div>
          {loading ? <SkeletonBars count={6} /> : (
          <div className="flex flex-col gap-3">
            {discharge.map((d) => {
              const pct = maxDischarge > 0 ? (d.jumlah_kasus / maxDischarge) * 100 : 0;
              return (
                <div key={d.discharge_status} className="flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-[#0E1A2B] font-medium">{d.discharge_status}</span>
                    <span className="text-[#64748B] tabular-nums">{formatNumber(d.jumlah_kasus)}</span>
                  </div>
                  <div className="h-2 bg-[#F5F7FB] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#1E4F91] rounded-full transition-all duration-700"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>

      {/* ── Second Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Tipe Kasus */}
        <div className="bg-white border border-[#E4E9F1] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#0E1A2B]">Tipe Kasus</h2>
            <SectionBadge label="claim_type_case_view" />
          </div>
          {loading ? <SkeletonBars count={4} /> : (
          <div className="flex flex-col gap-2">
            {caseType.map((ct) => (
              <div key={ct.tipe_kasus} className="flex items-center gap-3 p-3 rounded-xl bg-[#F5F7FB] hover:bg-[#EEF2F8] transition-colors">
                <div className="text-xl">{caseTypeIcons[ct.tipe_kasus] ?? '🏷️'}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-[#0E1A2B]">{ct.tipe_kasus}</span>
                    <span className="text-sm font-bold text-[#1E4F91]">{formatNumber(ct.jumlah_kasus)}</span>
                  </div>
                  <div className="text-xs text-[#64748B] mt-0.5">{rupiahShort(ct.total_tarif)}</div>
                </div>
              </div>
            ))}
          </div>
          )}
        </div>

        {/* Top 10 CMG */}
        <div className="bg-white border border-[#E4E9F1] rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[#0E1A2B]">Top 10 CMG</h2>
            <SectionBadge label="claim_cmg_view" />
          </div>
          {loading ? <SkeletonBars count={10} /> : (
          <div className="flex flex-col gap-2.5">
            {cmg.map((c, i) => {
              const pct = maxCmg > 0 ? (c.jumlah_kasus / maxCmg) * 100 : 0;
              return (
                <div key={c.cmg} className="flex flex-col gap-0.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[#94A3B8] font-mono w-4 text-right">{i + 1}</span>
                      <span className="text-[#0E1A2B] font-medium truncate max-w-[180px]">{c.cmg}</span>
                    </div>
                    <span className="text-[#64748B] tabular-nums shrink-0">{formatNumber(c.jumlah_kasus)}</span>
                  </div>
                  <div className="h-1.5 bg-[#F5F7FB] rounded-full overflow-hidden ml-6">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, background: `hsl(${210 + i * 6}, 65%, ${45 - i * 1.5}%)` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          )}
        </div>
      </div>

      {/* ── Risky Claims Table ── */}
      <div className="bg-white border border-[#E4E9F1] rounded-2xl shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E4E9F1]">
          <div>
            <h2 className="text-sm font-semibold text-[#0E1A2B]">Klaim Berisiko Tertinggi</h2>
            <p className="text-xs text-[#64748B] mt-0.5">Berdasarkan skor analisis rule engine</p>
          </div>
          <button
            onClick={() => navigate('/claims')}
            className="flex items-center gap-1 text-xs font-medium text-[#1E4F91] hover:underline"
          >
            Lihat semua <ChevronRight size={12} />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b border-[#E4E9F1] bg-[#FAFBFD]">
                {['Pasien', 'MRN', 'INA-CBG', 'Diagnosa', 'LOS', 'Tarif RS', 'Tarif INA-CBG', 'Kategori Risiko', 'Skor'].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-xs font-semibold text-[#64748B] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} cols={9} />)
              ) : claimsWithScore.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => setSelectedClaim(c)}
                  className="border-b border-[#E4E9F1] hover:bg-[#F5F7FB] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-[#0E1A2B] whitespace-nowrap">{c.nama_pasien}</div>
                    <div className="text-xs text-[#64748B]">{c.dpjp}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{c.mrn}</td>
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs font-semibold text-[#1E4F91]">{c.inacbg}</div>
                    <SeverityBadge level={c.severity_level} />
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#64748B] max-w-[120px] truncate">{c.diaglist}</td>
                  <td className="px-4 py-3 text-center">
                    <span className="px-2 py-0.5 rounded-lg bg-[#F5F7FB] text-xs font-semibold text-[#0E1A2B]">{c.los}h</span>
                  </td>
                  <td className="px-4 py-3 text-right font-medium text-[#0E1A2B] whitespace-nowrap">{rupiahShort(c.tarif_rs)}</td>
                  <td className={cn('px-4 py-3 text-right font-medium whitespace-nowrap', c.tarif_inacbg < c.tarif_rs ? 'text-[#C8392E]' : 'text-[#2E9A5A]')}>
                    {rupiahShort(c.tarif_inacbg)}
                  </td>
                  <td className="px-4 py-3">
                    <FlagBadge flag={c.flag} />
                  </td>
                  <td className="px-4 py-3 text-center">
                    {c.score != null ? <RiskScore score={c.score} /> : <span className="text-[#94A3B8]">—</span>}
                  </td>
                </tr>
              ))}
              {claimsWithScore.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-[#94A3B8]">
                    Tidak ada data klaim berisiko.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Claim Detail Modal ── */}
      {selectedClaim && (
        <ClaimDetailModal
          claim={selectedClaim}
          ruleResults={ruleResults.filter((r) => r.claim_id === selectedClaim.id)}
          onClose={() => setSelectedClaim(null)}
        />
      )}
    </div>
  );
}
