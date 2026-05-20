import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Upload,
  Search,
  ChevronDown,
  Edit2,
  Trash2,
  Archive,
  Play,
  Loader2,
  CheckCircle2,
  ArchiveX,
  Activity,
  Clock,
  X,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getRules, createRule, updateRule, activateRule, archiveRule } from '@/lib/api';
import { cn, formatNumber, dateID } from '@/lib/utils';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';


const CATEGORIES = ['Overstay', 'Upcoding Risk', 'Diagnosa Tidak Sesuai', 'LOS Pendek', 'Readmisi', 'Duplikat', 'Tarif'];

// ── Styles ────────────────────────────────────────────────────────────────────
const SEV_STYLES = {
  high:   { bg: 'bg-[#FBE6E3]', text: 'text-[#C8392E]', label: 'high' },
  medium: { bg: 'bg-[#FDF1DD]', text: 'text-[#C97A12]', label: 'medium' },
  low:    { bg: 'bg-[#E4E9F1]', text: 'text-[#64748B]', label: 'low' },
};

// ── Sub-components ────────────────────────────────────────────────────────────
function SeverityBadge({ severity }) {
  const s = SEV_STYLES[severity] ?? { bg: 'bg-[#E4E9F1]', text: 'text-[#64748B]', label: severity };
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold', s.bg, s.text)}>
      {s.label}
    </span>
  );
}

function StatusPill({ status }) {
  const isActive = status === 'active';
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold',
      isActive ? 'bg-[#E4F4EB] text-[#1E6B40]' : 'bg-[#E4E9F1] text-[#64748B]'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-[#2E9A5A]' : 'bg-[#94A3B8]')} />
      {isActive ? 'Aktif' : 'Diarsip'}
    </span>
  );
}

function KpiMini({ icon: Icon, iconBg, label, value }) {
  return (
    <div className="bg-white border border-[#E4E9F1] rounded-xl px-4 py-3 flex items-center gap-3 shadow-sm">
      <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', iconBg)}>
        <Icon size={16} />
      </div>
      <div>
        <div className="text-xl font-bold text-[#0E1A2B] leading-none">{value}</div>
        <div className="text-[11px] text-[#64748B] mt-0.5">{label}</div>
      </div>
    </div>
  );
}

// ── Rule Modal ────────────────────────────────────────────────────────────────
function RuleModal({ rule, onClose, onSave }) {
  const isEdit = !!rule;
  const [form, setForm] = useState(
    rule
      ? { name: rule.name, description: rule.description, category: rule.category, severity: rule.severity }
      : { name: '', description: '', category: 'Overstay', severity: 'medium' }
  );
  const [errors, setErrors] = useState({});
  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Nama rule wajib diisi';
    if (!form.description.trim()) errs.description = 'Deskripsi wajib diisi';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E9F1]">
          <div>
            <h2 className="text-sm font-bold text-[#0E1A2B]">{isEdit ? 'Edit Rule' : 'Buat Rule Baru'}</h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {isEdit ? 'Perbarui konfigurasi rule yang sudah ada.' : 'Definisikan aturan deteksi anomali klaim.'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#E4E9F1] transition-colors">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          <div>
            <label className="block text-xs font-semibold text-[#0E1A2B] mb-1.5">Nama Rule</label>
            <input
              type="text" value={form.name} onChange={(e) => set('name', e.target.value)}
              placeholder="Contoh: Overstay Threshold"
              className={cn(
                'w-full px-3 py-2 text-xs rounded-lg border bg-white text-[#0E1A2B] outline-none transition-all placeholder:text-[#94A3B8]',
                errors.name ? 'border-[#C8392E]' : 'border-[#E4E9F1] focus:border-[#1E4F91]/50'
              )}
            />
            {errors.name && <p className="text-[11px] text-[#C8392E] mt-1">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#0E1A2B] mb-1.5">Deskripsi</label>
            <textarea
              value={form.description} onChange={(e) => set('description', e.target.value)}
              rows={2} placeholder="Jelaskan kondisi yang ditrigger oleh rule ini…"
              className={cn(
                'w-full px-3 py-2 text-xs rounded-lg border bg-white text-[#0E1A2B] outline-none transition-all resize-none placeholder:text-[#94A3B8]',
                errors.description ? 'border-[#C8392E]' : 'border-[#E4E9F1] focus:border-[#1E4F91]/50'
              )}
            />
            {errors.description && <p className="text-[11px] text-[#C8392E] mt-1">{errors.description}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0E1A2B] mb-1.5">Kategori</label>
              <div className="relative">
                <select value={form.category} onChange={(e) => set('category', e.target.value)}
                  className="appearance-none w-full pl-3 pr-7 py-2 text-xs rounded-lg border border-[#E4E9F1] bg-white text-[#0E1A2B] outline-none focus:border-[#1E4F91]/50 cursor-pointer">
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0E1A2B] mb-1.5">Severity</label>
              <div className="relative">
                <select value={form.severity} onChange={(e) => set('severity', e.target.value)}
                  className="appearance-none w-full pl-3 pr-7 py-2 text-xs rounded-lg border border-[#E4E9F1] bg-white text-[#0E1A2B] outline-none focus:border-[#1E4F91]/50 cursor-pointer">
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <Button type="button" variant="outline" size="md" className="flex-1" onClick={onClose}>Batal</Button>
            <Button type="submit" size="md" className="flex-1">{isEdit ? 'Simpan Perubahan' : 'Buat Rule'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteModal({ rule, onClose, onConfirm }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-10 h-10 rounded-full bg-[#FBE6E3] flex items-center justify-center mx-auto mb-4">
          <Trash2 size={18} className="text-[#C8392E]" />
        </div>
        <h2 className="text-sm font-bold text-[#0E1A2B] text-center">Hapus Rule</h2>
        <p className="text-xs text-[#64748B] text-center mt-2">
          Apakah Anda yakin ingin menghapus rule{' '}
          <span className="font-semibold text-[#0E1A2B]">"{rule?.name}"</span>?
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-2 mt-5">
          <Button type="button" variant="outline" size="md" className="flex-1" onClick={onClose}>Batal</Button>
          <Button type="button" variant="danger" size="md" className="flex-1" onClick={onConfirm}>Hapus</Button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RulesPage() {
  const { toast } = useApp();

  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('all');
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [severityFilter, setSeverityFilter] = useState('');
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  const [deletingRule, setDeletingRule] = useState(null);

  const fetchRules = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getRules();
      const data = res.data?.data ?? res.data ?? [];
      setRules(Array.isArray(data) ? data : []);
    } catch {
      setRules([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRules(); }, [fetchRules]);

  const allRules     = rules;
  const activeRules  = rules.filter((r) => r.status === 'active');
  const archivedRules = rules.filter((r) => r.status === 'archived');
  const totalTriggers = activeRules.reduce((a, r) => a + (r.triggers ?? 0), 0);

  const filtered = rules.filter((r) => {
    if (tab === 'active'   && r.status !== 'active')   return false;
    if (tab === 'archived' && r.status !== 'archived') return false;
    if (search && !r.name.toLowerCase().includes(search.toLowerCase()) &&
        !r.description.toLowerCase().includes(search.toLowerCase())) return false;
    if (categoryFilter && r.category !== categoryFilter) return false;
    if (severityFilter && r.severity !== severityFilter) return false;
    return true;
  });

  // Reset to page 1 when any filter changes
  useEffect(() => { setPage(1); }, [tab, search, categoryFilter, severityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleToggleStatus = async (rule) => {
    const next = rule.status === 'active' ? 'archived' : 'active';
    // Optimistic update
    setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, status: next } : r));
    try {
      if (next === 'active') await activateRule(rule.id);
      else                   await archiveRule(rule.id);
      toast(`Rule "${rule.name}" ${next === 'active' ? 'diaktifkan' : 'diarsipkan'}.`, 'success');
    } catch {
      // Rollback on error
      setRules((prev) => prev.map((r) => r.id === rule.id ? { ...r, status: rule.status } : r));
      toast(`Gagal mengubah status rule "${rule.name}".`, 'error');
    }
  };

  const openCreate = () => { setEditingRule(null); setShowModal(true); };
  const openEdit   = (rule) => { setEditingRule(rule); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingRule(null); };

  const handleSave = async (form) => {
    const today = new Date().toISOString().slice(0, 10);
    if (editingRule) {
      try { await updateRule(editingRule.id, form); } catch { /* offline ok */ }
      setRules((prev) => prev.map((r) =>
        r.id === editingRule.id ? { ...r, ...form, updated: today } : r
      ));
      toast(`Rule "${form.name}" berhasil diperbarui.`, 'success');
    } else {
      const newRule = {
        id: `r-${String(Date.now()).slice(-4)}`,
        ...form,
        status: 'active',
        triggers: 0,
        created_by: 'andini.p',
        updated: today,
      };
      try { await createRule(form); } catch { /* offline ok */ }
      setRules((prev) => [...prev, newRule]);
      toast(`Rule "${form.name}" berhasil dibuat.`, 'success');
    }
    closeModal();
  };

  const handleDelete = () => {
    setRules((prev) => prev.filter((r) => r.id !== deletingRule.id));
    toast(`Rule "${deletingRule.name}" berhasil dihapus.`, 'success');
    setDeletingRule(null);
  };

  const tabs = [
    { key: 'all',      label: 'Semua',    count: allRules.length },
    { key: 'active',   label: 'Aktif',    count: activeRules.length },
    { key: 'archived', label: 'Arsip',    count: archivedRules.length },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0E1A2B]">Rule Engine</h1>
          <p className="text-sm text-[#64748B] mt-0.5">
            Kelola aturan deteksi anomali klaim. Setiap rule menghasilkan skor &amp; pesan pada hasil analisis.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" icon={Upload}>Import rules</Button>
          <Button onClick={openCreate} icon={Plus}>Buat Rule Baru</Button>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiMini icon={CheckCircle2} iconBg="bg-[#E4F4EB] text-[#2E9A5A]" label="Active Rules"            value={activeRules.length} />
        <KpiMini icon={ArchiveX}    iconBg="bg-[#E4E9F1] text-[#64748B]"  label="Archived Rules"          value={archivedRules.length} />
        <KpiMini icon={Activity}    iconBg="bg-[#FDF1DD] text-[#C97A12]"  label="Total Triggers Batch Ini" value={formatNumber(totalTriggers)} />
        <KpiMini icon={Clock}       iconBg="bg-[#E8F0FB] text-[#1E4F91]"  label="Last Run"                value="05 Mei 2026" />
      </div>

      {/* ── Table card ── */}
      <div className="bg-white border border-[#E4E9F1] rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-0 border-b border-[#E4E9F1]">
          {/* Tabs */}
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-1 py-3 text-xs font-semibold border-b-2 transition-all -mb-px whitespace-nowrap mr-3',
                tab === t.key
                  ? 'border-[#1E4F91] text-[#1E4F91]'
                  : 'border-transparent text-[#64748B] hover:text-[#0E1A2B]'
              )}
            >
              {t.label} ({t.count})
            </button>
          ))}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-[#E4E9F1] bg-[#FAFBFD]">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Cari rule…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E4E9F1] bg-white text-[#0E1A2B] placeholder:text-[#94A3B8] outline-none focus:border-[#1E4F91]/50 transition-all"
            />
          </div>

          {/* Category filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 text-xs rounded-lg border border-[#E4E9F1] bg-white text-[#0E1A2B] outline-none focus:border-[#1E4F91]/50 cursor-pointer"
            >
              <option value="">Semua kategori</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
          </div>

          {/* Severity filter */}
          <div className="relative">
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="appearance-none pl-3 pr-7 py-1.5 text-xs rounded-lg border border-[#E4E9F1] bg-white text-[#0E1A2B] outline-none focus:border-[#1E4F91]/50 cursor-pointer"
            >
              <option value="">Semua severity</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
          </div>

          <div className="ml-auto text-xs text-[#64748B]">{formatNumber(filtered.length)} rule</div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E4E9F1] bg-[#FAFBFD] text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Rule</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Kategori</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Severity</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Status</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B] text-right">Trigger (30d)</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Pembuat</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Diubah</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <Loader2 size={22} className="animate-spin text-[#1E4F91] mx-auto" />
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-sm text-[#94A3B8]">
                    Tidak ada rule yang cocok
                  </td>
                </tr>
              ) : (
                paginated.map((rule) => (
                  <tr key={rule.id} className="border-b border-[#E4E9F1] hover:bg-[#F5F7FB] transition-colors">
                    {/* Name + desc */}
                    <td className="px-4 py-3 max-w-[280px]">
                      <div className="font-semibold text-xs text-[#0E1A2B]">{rule.name}</div>
                      <div className="text-[11px] text-[#64748B] mt-0.5">{rule.description}</div>
                    </td>

                    {/* Kategori */}
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border border-[#E4E9F1] bg-white text-[#64748B]">
                        {rule.category}
                      </span>
                    </td>

                    {/* Severity */}
                    <td className="px-4 py-3"><SeverityBadge severity={rule.severity} /></td>

                    {/* Status */}
                    <td className="px-4 py-3"><StatusPill status={rule.status} /></td>

                    {/* Triggers */}
                    <td className="px-4 py-3 text-right">
                      <span className="font-bold text-xs text-[#0E1A2B] tabular-nums">{formatNumber(rule.triggers)}</span>
                    </td>

                    {/* Pembuat */}
                    <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{rule.created_by}</td>

                    {/* Diubah */}
                    <td className="px-4 py-3 text-xs text-[#64748B] whitespace-nowrap">{dateID(rule.updated)}</td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        {/* Arsip / Aktifkan text button */}
                        {rule.status === 'archived' ? (
                          <button
                            onClick={() => handleToggleStatus(rule)}
                            className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-[#E4F4EB] text-[#2E9A5A] hover:bg-[#d0eddf] transition-all"
                          >
                            Aktifkan
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleStatus(rule)}
                            className="px-2 py-1 text-[11px] font-semibold rounded-lg border border-[#E4E9F1] text-[#64748B] hover:bg-[#F5F7FB] transition-all"
                          >
                            Arsip
                          </button>
                        )}
                        {/* Edit icon */}
                        <button
                          onClick={() => openEdit(rule)}
                          title="Edit"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#64748B] hover:bg-[#E8F0FB] hover:text-[#1E4F91] transition-all"
                        >
                          <Edit2 size={13} />
                        </button>
                        {/* Delete icon */}
                        <button
                          onClick={() => setDeletingRule(rule)}
                          title="Hapus"
                          className="w-7 h-7 flex items-center justify-center rounded-lg text-[#64748B] hover:bg-[#FBE6E3] hover:text-[#C8392E] transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
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

      {/* ── Modals ── */}
      {showModal && (
        <RuleModal rule={editingRule} onClose={closeModal} onSave={handleSave} />
      )}
      {deletingRule && (
        <DeleteModal rule={deletingRule} onClose={() => setDeletingRule(null)} onConfirm={handleDelete} />
      )}
    </div>
  );
}
