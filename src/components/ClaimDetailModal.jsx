import { useEffect, useState, useCallback } from 'react';
import {
  X,
  Edit2,
  ExternalLink,
  AlertTriangle,
  ShieldAlert,
  Info,
  CheckCircle2,
  ChevronRight,
  Stethoscope,
  Calendar,
  Clock,
  User,
  Activity,
  Layers,
} from 'lucide-react';
import { getClaimById, getAnalysisResults } from '@/lib/api';
import { cn, rupiah, dateID, initials } from '@/lib/utils';

// ── Helpers ───────────────────────────────────────────────────────────────────
const SEV_LEVEL_STYLES = {
  '0':   { bg: 'bg-[#E4E9F1]', text: 'text-[#64748B]', label: 'Sev 0' },
  'I':   { bg: 'bg-[#E4F4EB]', text: 'text-[#2E9A5A]', label: 'Sev I' },
  'II':  { bg: 'bg-[#E1F0FA]', text: 'text-[#1E78B8]', label: 'Sev II' },
  'III': { bg: 'bg-[#E8F0FB]', text: 'text-[#1E4F91]', label: 'Sev III' },
};

const RULE_SEV_STYLES = {
  high:   { bg: 'bg-[#FBE6E3]', text: 'text-[#C8392E]', label: 'Tinggi',  icon: ShieldAlert },
  medium: { bg: 'bg-[#FDF1DD]', text: 'text-[#C97A12]', label: 'Sedang',  icon: AlertTriangle },
  low:    { bg: 'bg-[#E1F0FA]', text: 'text-[#1E78B8]', label: 'Rendah',  icon: Info },
};

function RuleSeverityBadge({ severity }) {
  const s = RULE_SEV_STYLES[severity] ?? RULE_SEV_STYLES.low;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold', s.bg, s.text)}>
      {s.label}
    </span>
  );
}

function ScoreCircle({ score }) {
  const color =
    score >= 80 ? '#C8392E' :
    score >= 60 ? '#C97A12' :
    '#1E78B8';
  const r = 16, circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg width={48} height={48} viewBox="0 0 48 48" className="-rotate-90">
        <circle cx={24} cy={24} r={r} fill="none" stroke="#E4E9F1" strokeWidth={4} />
        <circle
          cx={24} cy={24} r={r} fill="none"
          stroke={color} strokeWidth={4}
          strokeDasharray={`${dash} ${circ - dash}`}
          strokeLinecap="round"
        />
      </svg>
      <span
        className="absolute inset-0 flex items-center justify-center text-[11px] font-bold"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

function DataRow({ label, value, mono = false }) {
  return (
    <div className="flex items-start justify-between gap-3 py-2 border-b border-[#F5F7FB] last:border-0">
      <span className="text-xs text-[#64748B] shrink-0 mt-0.5">{label}</span>
      <span className={cn('text-xs font-medium text-[#0E1A2B] text-right', mono && 'font-mono')}>{value ?? '—'}</span>
    </div>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ClaimDetailModal({ claim: initialClaim, ruleResults: propRuleResults, onClose }) {
  const [claim, setClaim] = useState(initialClaim);
  const [ruleResults, setRuleResults] = useState(propRuleResults ?? []);
  const [loading, setLoading] = useState(false);

  // Fetch fresh data if we only have a partial claim object
  useEffect(() => {
    let cancelled = false;
    const fetchDetail = async () => {
      if (!initialClaim?.id) return;
      setLoading(true);
      try {
        const [claimRes, ruleRes] = await Promise.allSettled([
          getClaimById(initialClaim.id),
          getAnalysisResults(null, { claim_id: initialClaim.id }),
        ]);
        if (!cancelled) {
          if (claimRes.status === 'fulfilled') setClaim(claimRes.value.data ?? initialClaim);
          if (ruleRes.status === 'fulfilled') {
            const rd = ruleRes.value.data?.data ?? ruleRes.value.data ?? [];
            setRuleResults(rd.length ? rd : (propRuleResults ?? []));
          } else {
            setRuleResults(propRuleResults ?? []);
          }
        }
      } catch {
        if (!cancelled) setRuleResults(propRuleResults ?? []);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchDetail();
    return () => { cancelled = true; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialClaim?.id]);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Prevent body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const c = claim;
  const selisih = (c.tarif_inacbg ?? 0) - (c.tarif_rs ?? 0);
  const diagList = c.diaglist ? c.diaglist.split(';').map((d) => d.trim()).filter(Boolean) : [];
  const procList = c.proclist ? c.proclist.split(';').map((p) => p.trim()).filter(Boolean) : [];
  const sevStyle = SEV_LEVEL_STYLES[c.severity_level] ?? SEV_LEVEL_STYLES['0'];

  return (
    <div
      className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-label={`Detail klaim ${c.id}`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[#0E1A2B]/50 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Modal panel */}
      <div className="relative w-full sm:max-w-3xl bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[88vh] overflow-hidden">
        {/* ── Header ── */}
        <div className="flex items-start gap-3 px-6 py-4 border-b border-[#E4E9F1] shrink-0">
          {/* Avatar */}
          <div className="w-10 h-10 rounded-xl bg-[#E8F0FB] flex items-center justify-center text-sm font-bold text-[#1E4F91] shrink-0">
            {initials(c.nama_pasien)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-[#64748B]">Klaim · ID {c.id}</span>
              {c.flag && (
                <span className="px-2 py-0.5 rounded-full bg-[#FBE6E3] text-[#C8392E] text-[10px] font-semibold">
                  {c.flag}
                </span>
              )}
            </div>
            <h2 className="text-base font-bold text-[#0E1A2B] mt-0.5">{c.nama_pasien}</h2>
            <div className="flex items-center gap-3 flex-wrap mt-0.5">
              <span className="font-mono text-xs text-[#64748B]">MRN {c.mrn}</span>
              <span className="text-[#E4E9F1]">·</span>
              <span className="font-mono text-xs text-[#94A3B8] truncate max-w-[200px]">{c.sep}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-[#E4E9F1] text-[#64748B] hover:text-[#0E1A2B] hover:border-[#1E4F91]/30 transition-all">
              <Edit2 size={12} />
              Edit
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#64748B] hover:text-[#0E1A2B] hover:bg-[#F5F7FB] transition-all"
              aria-label="Tutup modal"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6 flex flex-col gap-5">
            {/* ── Stat boxes ── */}
            <div className="grid grid-cols-3 gap-3">
              <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#FAFBFD] border border-[#E4E9F1]">
                <span className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">Tarif RS</span>
                <span className="text-base font-bold text-[#0E1A2B] leading-none">{rupiah(c.tarif_rs)}</span>
              </div>
              <div className="flex flex-col gap-1 p-3 rounded-xl bg-[#FAFBFD] border border-[#E4E9F1]">
                <span className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">Tarif INA-CBG</span>
                <span className="text-base font-bold text-[#0E1A2B] leading-none">{rupiah(c.tarif_inacbg)}</span>
              </div>
              <div className={cn('flex flex-col gap-1 p-3 rounded-xl border', selisih < 0 ? 'bg-[#FBE6E3] border-[#C8392E]/20' : 'bg-[#E4F4EB] border-[#2E9A5A]/20')}>
                <span className="text-[10px] text-[#64748B] font-medium uppercase tracking-wide">Selisih</span>
                <span className={cn('text-base font-bold leading-none', selisih < 0 ? 'text-[#C8392E]' : 'text-[#2E9A5A]')}>
                  {selisih >= 0 ? '+' : ''}{rupiah(selisih)}
                </span>
              </div>
            </div>

            {/* ── Two columns ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {/* Left: claim data */}
              <div>
                <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2">Detail Klaim</h3>
                <div className="flex flex-col">
                  <DataRow label="DPJP" value={c.dpjp} />
                  <DataRow label="Tgl Masuk" value={dateID(c.admission_date)} />
                  <DataRow label="Tgl Pulang" value={dateID(c.discharge_date)} />
                  <DataRow label="LOS" value={`${c.los} hari`} />
                  <DataRow label="Tipe Kasus" value={c.tipe_kasus === 'RI' ? 'Rawat Inap' : c.tipe_kasus === 'RJ' ? 'Rawat Jalan' : c.tipe_kasus} />
                  <DataRow label="Discharge" value={c.discharge_status} />
                  <DataRow label="INA-CBG" value={c.inacbg} mono />
                  <DataRow label="Deskripsi" value={c.deskripsi_inacbg} />
                  <DataRow
                    label="Severity"
                    value={
                      <span className={cn('inline-block px-2 py-0.5 rounded-full text-[11px] font-bold', sevStyle.bg, sevStyle.text)}>
                        {sevStyle.label}
                      </span>
                    }
                  />
                  <DataRow label="CMG" value={c.cmg} mono />
                </div>
              </div>

              {/* Right: diagnosa + prosedur */}
              <div className="flex flex-col gap-4">
                {/* Diagnosa */}
                <div>
                  <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Stethoscope size={12} />
                    Diagnosa ICD-10
                  </h3>
                  {diagList.length === 0 ? (
                    <span className="text-xs text-[#94A3B8]">Tidak ada diagnosa</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {diagList.map((d, i) => (
                        <span
                          key={i}
                          className={cn(
                            'inline-block px-2.5 py-1 rounded-lg font-mono text-xs font-semibold',
                            i === 0
                              ? 'bg-[#E8F0FB] text-[#1E4F91] border border-[#1E4F91]/20'
                              : 'bg-[#F5F7FB] text-[#64748B] border border-[#E4E9F1]'
                          )}
                          title={i === 0 ? 'Diagnosa primer' : `Diagnosa sekunder ${i}`}
                        >
                          {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Prosedur */}
                <div>
                  <h3 className="text-xs font-semibold text-[#64748B] uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Activity size={12} />
                    Prosedur ICD-9CM
                  </h3>
                  {procList.length === 0 ? (
                    <span className="text-xs text-[#94A3B8]">Tidak ada prosedur</span>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {procList.map((p, i) => (
                        <span
                          key={i}
                          className="inline-block px-2.5 py-1 rounded-lg bg-[#E4F4EB] text-[#2E9A5A] border border-[#2E9A5A]/20 font-mono text-xs font-semibold"
                        >
                          {p}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Divider ── */}
            <div className="border-t border-[#E4E9F1]" />

            {/* ── Rule Engine Results ── */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-[#0E1A2B]">
                    {ruleResults.length} rule check dijalankan.
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    {ruleResults.length === 0
                      ? 'Tidak ada temuan dari rule engine untuk klaim ini.'
                      : `${ruleResults.filter((r) => r.triggered).length} temuan aktif.`}
                  </p>
                </div>
                <a
                  href="/analysis"
                  className="flex items-center gap-1 text-xs font-medium text-[#1E4F91] hover:underline"
                >
                  Lihat Semua Analisis <ChevronRight size={12} />
                </a>
              </div>

              {ruleResults.length === 0 ? (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-[#E4F4EB] border border-[#2E9A5A]/20">
                  <CheckCircle2 size={16} className="text-[#2E9A5A] shrink-0" />
                  <span className="text-sm text-[#2E9A5A] font-medium">Tidak ada temuan anomali pada klaim ini.</span>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {ruleResults.map((rule, i) => {
                    const s = RULE_SEV_STYLES[rule.severity] ?? RULE_SEV_STYLES.low;
                    const Icon = s.icon;
                    return (
                      <div
                        key={i}
                        className={cn(
                          'flex items-start gap-3 p-4 rounded-xl border',
                          rule.severity === 'high'
                            ? 'bg-[#FBE6E3]/50 border-[#C8392E]/20'
                            : rule.severity === 'medium'
                            ? 'bg-[#FDF1DD]/50 border-[#C97A12]/20'
                            : 'bg-[#E1F0FA]/50 border-[#1E78B8]/20'
                        )}
                      >
                        {/* Score circle */}
                        <ScoreCircle score={rule.score_generated ?? 0} />

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="text-sm font-semibold text-[#0E1A2B]">{rule.kategori}</span>
                            <RuleSeverityBadge severity={rule.severity} />
                          </div>
                          <p className="text-xs text-[#64748B] leading-relaxed">{rule.message_generated}</p>
                          <div className="mt-2 flex items-center gap-1.5">
                            <span className="font-mono text-[10px] text-[#94A3B8] bg-[#F5F7FB] px-2 py-0.5 rounded border border-[#E4E9F1]">
                              {rule.source}
                            </span>
                          </div>
                        </div>

                        {/* Icon */}
                        <div className={cn('shrink-0', s.text)}>
                          <Icon size={18} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
