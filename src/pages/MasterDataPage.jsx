import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Edit2, Trash2, ChevronDown, X,
  Upload, SlidersHorizontal, Download, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import Pagination from '@/components/ui/Pagination';
import Button from '@/components/ui/Button';
import {
  getHospitals,    createHospital,    updateHospital,
  getDiagnoses,    createDiagnosis,   updateDiagnosis,   deleteDiagnosis,
  getProcedures,   createProcedure,   updateProcedure,   deleteProcedure,
  getCmgs,         createCmg,         updateCmg,         deleteCmg,
  getCaseTypes,    createCaseType,    updateCaseType,    deleteCaseType,
  getDischarges,   createDischarge,   updateDischarge,   deleteDischarge,
} from '@/lib/api';

// ── Normalizers: backend → frontend ──────────────────────────────────────────
const norm = {
  hospital: (b) => ({
    id:      b.id,
    kode_rs: b.code    ?? '',
    nama:    b.name    ?? '',
    kelas:   b.class   ?? 'B',
    kota:    b.address ?? '',
    status:  'active', // backend has no status field
  }),
  diagnosis: (b) => ({
    id:       b.id,
    kode:     b.code        ?? '',
    deskripsi: b.description ?? '',
    kategori: '—',
  }),
  procedure: (b) => ({
    id:       b.id,
    kode:     b.code        ?? '',
    deskripsi: b.description ?? '',
    kategori: '—',
  }),
  cmg: (b) => ({
    id:   b.id,
    kode: b.code_cmg    ?? '',
    nama: b.description ?? '',
  }),
  caseType: (b) => ({
    id:   b.id,
    kode: b.tipe_kasus  ?? '',
    nama: b.description ?? '',
  }),
  discharge: (b) => ({
    id:   b.id,
    kode: b.discharge_status ?? '',
    nama: b.description      ?? '',
  }),
};

// ── Denormalizers: frontend form → backend payload ────────────────────────────
const denorm = {
  hospital:  (f) => ({ code: f.kode_rs, name: f.nama, class: f.kelas, address: f.kota }),
  diagnosis: (f) => ({ code: f.kode, description: f.deskripsi }),
  procedure: (f) => ({ code: f.kode, description: f.deskripsi }),
  cmg:       (f) => ({ code_cmg: f.kode, description: f.nama }),
  caseType:  (f) => ({ tipe_kasus: f.kode, description: f.nama }),
  discharge: (f) => ({ discharge_status: f.kode, description: f.nama }),
};

// ── Config per type ───────────────────────────────────────────────────────────
const TYPE_CONFIG = {
  hospitals: {
    title:       'Rumah Sakit',
    subtitle:    'Master RS terdaftar pada Smart Drg. Kode RS digunakan oleh parser file INA-CBG.',
    addLabel:    'Tambah RS',
    importLabel: 'Import CSV',
    pkKey:       'kode_rs',
    normalize:   norm.hospital,
    apiGet:      (p) => getHospitals(p),
    apiCreate:   (f) => createHospital(denorm.hospital(f)),
    apiUpdate:   (id, f) => updateHospital(id, denorm.hospital(f)),
    apiDelete:   null, // no DELETE /hospitals/:id in backend
    fields: [
      { key: 'kode_rs', label: 'Kode RS',           type: 'text',   placeholder: '0301R001',               readonlyOnEdit: true },
      { key: 'nama',    label: 'Nama Rumah Sakit',   type: 'text',   placeholder: 'RSUD Cipto Mangunkusumo' },
      { key: 'kelas',   label: 'Kelas',              type: 'select', options: ['A', 'B', 'C', 'D'] },
      { key: 'kota',    label: 'Alamat / Kota',      type: 'text',   placeholder: 'Jakarta Pusat' },
    ],
    columns:   ['Kode RS', 'Nama Rumah Sakit', 'Kelas', 'Kota', ''],
    searchKey: (r) => r.nama + r.kode_rs,
    renderRow: (row) => [
      <span className="font-mono text-xs font-semibold text-[#1E4F91]">{row.kode_rs}</span>,
      <span className="text-xs text-[#0E1A2B] font-medium">{row.nama}</span>,
      <span className={cn(
        'inline-block px-2 py-0.5 rounded-full text-[11px] font-bold',
        row.kelas === 'A' ? 'bg-[#E8F0FB] text-[#1E4F91]' : 'bg-[#E4F4EB] text-[#2E9A5A]'
      )}>{row.kelas}</span>,
      <span className="text-xs text-[#64748B]">{row.kota}</span>,
    ],
  },

  diagnoses: {
    title:     'Diagnosa ICD-10',
    subtitle:  'Daftar kode diagnosa internasional berdasarkan standar ICD-10 WHO.',
    addLabel:  'Tambah Diagnosa',
    pkKey:     'kode',
    normalize: norm.diagnosis,
    apiGet:    (p) => getDiagnoses(p),
    apiCreate: (f) => createDiagnosis(denorm.diagnosis(f)),
    apiUpdate: (id, f) => updateDiagnosis(id, denorm.diagnosis(f)),
    apiDelete: (id) => deleteDiagnosis(id),
    fields: [
      { key: 'kode',     label: 'Kode ICD-10', type: 'text', placeholder: 'I21.4', readonlyOnEdit: true },
      { key: 'deskripsi', label: 'Deskripsi',  type: 'text', placeholder: 'Non-ST Elevation Acute Myocardial Infarction' },
    ],
    columns:   ['Kode ICD-10', 'Deskripsi', ''],
    searchKey: (r) => r.kode + r.deskripsi,
    renderRow: (row) => [
      <span className="inline-block px-2 py-0.5 rounded-md bg-[#E8F0FB] text-[#1E4F91] font-mono text-xs font-bold">{row.kode}</span>,
      <span className="text-xs text-[#0E1A2B]">{row.deskripsi}</span>,
    ],
  },

  procedures: {
    title:     'Prosedur ICD-9-CM',
    subtitle:  'Daftar kode tindakan dan prosedur medis berdasarkan standar ICD-9-CM.',
    addLabel:  'Tambah Prosedur',
    pkKey:     'kode',
    normalize: norm.procedure,
    apiGet:    (p) => getProcedures(p),
    apiCreate: (f) => createProcedure(denorm.procedure(f)),
    apiUpdate: (id, f) => updateProcedure(id, denorm.procedure(f)),
    apiDelete: (id) => deleteProcedure(id),
    fields: [
      { key: 'kode',      label: 'Kode ICD-9-CM', type: 'text', placeholder: '00.66', readonlyOnEdit: true },
      { key: 'deskripsi', label: 'Deskripsi',      type: 'text', placeholder: 'Percutaneous transluminal coronary angioplasty' },
    ],
    columns:   ['Kode ICD-9-CM', 'Deskripsi', ''],
    searchKey: (r) => r.kode + r.deskripsi,
    renderRow: (row) => [
      <span className="inline-block px-2 py-0.5 rounded-md bg-[#FDF1DD] text-[#C97A12] font-mono text-xs font-bold">{row.kode}</span>,
      <span className="text-xs text-[#0E1A2B]">{row.deskripsi}</span>,
    ],
  },

  cmgs: {
    title:     'CMG',
    subtitle:  'Case Mix Group — pengelompokan kasus INA-CBG berdasarkan diagnosis utama.',
    addLabel:  'Tambah CMG',
    pkKey:     'kode',
    normalize: norm.cmg,
    apiGet:    (p) => getCmgs(p),
    apiCreate: (f) => createCmg(denorm.cmg(f)),
    apiUpdate: (id, f) => updateCmg(id, denorm.cmg(f)),
    apiDelete: (id) => deleteCmg(id),
    fields: [
      { key: 'kode', label: 'Kode CMG',  type: 'text', placeholder: 'A', readonlyOnEdit: true },
      { key: 'nama', label: 'Nama CMG',  type: 'text', placeholder: 'Infectious & Parasitic Diseases' },
    ],
    columns:   ['Kode', 'Nama CMG', ''],
    searchKey: (r) => r.kode + r.nama,
    renderRow: (row) => [
      <span className="inline-block px-2 py-0.5 rounded-md bg-[#E4E9F1] text-[#0E1A2B] font-mono text-xs font-bold w-8 text-center">{row.kode}</span>,
      <span className="text-xs text-[#0E1A2B]">{row.nama}</span>,
    ],
  },

  casetypes: {
    title:     'Tipe Kasus',
    subtitle:  'Jenis pelayanan rawat yang digunakan pada pengkodean klaim INA-CBG.',
    addLabel:  'Tambah Tipe Kasus',
    pkKey:     'kode',
    normalize: norm.caseType,
    apiGet:    (p) => getCaseTypes(p),
    apiCreate: (f) => createCaseType(denorm.caseType(f)),
    apiUpdate: (id, f) => updateCaseType(id, denorm.caseType(f)),
    apiDelete: (id) => deleteCaseType(id),
    fields: [
      { key: 'kode', label: 'Kode',           type: 'text', placeholder: 'RI', readonlyOnEdit: true },
      { key: 'nama', label: 'Nama Tipe Kasus', type: 'text', placeholder: 'Rawat Inap' },
    ],
    columns:   ['Kode', 'Nama Tipe Kasus', ''],
    searchKey: (r) => r.kode + r.nama,
    renderRow: (row) => [
      <span className="inline-block px-2 py-0.5 rounded-md bg-[#E1F0FA] text-[#1E78B8] font-mono text-xs font-bold">{row.kode}</span>,
      <span className="text-xs text-[#0E1A2B]">{row.nama}</span>,
    ],
  },

  discharges: {
    title:     'Discharge Status',
    subtitle:  'Status kepulangan pasien yang digunakan dalam klasifikasi klaim BPJS.',
    addLabel:  'Tambah Discharge',
    pkKey:     'kode',
    normalize: norm.discharge,
    apiGet:    (p) => getDischarges(p),
    apiCreate: (f) => createDischarge(denorm.discharge(f)),
    apiUpdate: (id, f) => updateDischarge(id, denorm.discharge(f)),
    apiDelete: (id) => deleteDischarge(id),
    fields: [
      { key: 'kode', label: 'Kode',          type: 'text', placeholder: '1', readonlyOnEdit: true },
      { key: 'nama', label: 'Nama Discharge', type: 'text', placeholder: 'Atas izin dokter' },
    ],
    columns:   ['Kode', 'Nama Discharge', ''],
    searchKey: (r) => r.kode + r.nama,
    renderRow: (row) => [
      <span className="inline-block px-2 py-0.5 rounded-md bg-[#E4F4EB] text-[#2E9A5A] font-mono text-xs font-bold w-8 text-center">{row.kode}</span>,
      <span className="text-xs text-[#0E1A2B]">{row.nama}</span>,
    ],
  },
};

// ── Master Data Modal ─────────────────────────────────────────────────────────
function MasterModal({ config, row, onClose, onSave, saving }) {
  const isEdit = !!row;
  const empty = Object.fromEntries((config.fields ?? []).map((f) => [f.key, '']));
  const [form, setForm] = useState(row ? { ...row } : { ...empty });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E9F1]">
          <div>
            <h2 className="text-sm font-bold text-[#0E1A2B]">{isEdit ? 'Edit Data' : config.addLabel}</h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">{config.title}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#E4E9F1] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {(config.fields ?? []).map((field) => (
            <div key={field.key}>
              <label className="block text-xs font-semibold text-[#0E1A2B] mb-1.5">{field.label}</label>
              {field.type === 'select' ? (
                <div className="relative">
                  <select
                    value={form[field.key] ?? ''}
                    onChange={(e) => set(field.key, e.target.value)}
                    disabled={isEdit && field.readonlyOnEdit}
                    className="appearance-none w-full pl-3 pr-7 py-2 text-xs rounded-lg border border-[#E4E9F1] bg-white text-[#0E1A2B] outline-none focus:border-[#1E4F91]/50 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {(field.options ?? []).map((opt) =>
                      typeof opt === 'string'
                        ? <option key={opt} value={opt}>{opt}</option>
                        : <option key={opt.value} value={opt.value}>{opt.label}</option>
                    )}
                  </select>
                  <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
                </div>
              ) : (
                <input
                  type="text"
                  value={form[field.key] ?? ''}
                  onChange={(e) => set(field.key, e.target.value)}
                  placeholder={field.placeholder ?? ''}
                  readOnly={isEdit && field.readonlyOnEdit}
                  required={!field.optional}
                  className={cn(
                    'w-full px-3 py-2 text-xs rounded-lg border border-[#E4E9F1] bg-white text-[#0E1A2B] outline-none transition-all',
                    'placeholder:text-[#94A3B8]',
                    isEdit && field.readonlyOnEdit
                      ? 'bg-[#F5F7FB] cursor-not-allowed opacity-70'
                      : 'focus:border-[#1E4F91]/50'
                  )}
                />
              )}
              {isEdit && field.readonlyOnEdit && (
                <p className="text-[10px] text-[#94A3B8] mt-0.5">Tidak dapat diubah saat mengedit</p>
              )}
            </div>
          ))}

          <div className="flex items-center gap-2 pt-1">
            <Button type="button" variant="outline" size="md" className="flex-1" onClick={onClose} disabled={saving}>
              Batal
            </Button>
            <Button type="submit" size="md" className="flex-1" disabled={saving}>
              {saving ? <Loader2 size={14} className="animate-spin" /> : isEdit ? 'Simpan Perubahan' : 'Tambah'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete Confirmation Modal ─────────────────────────────────────────────────
function DeleteModal({ config, row, onClose, onConfirm, deleting }) {
  const pk = config.pkKey;
  const label = row?.[pk] ?? '';
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
        <div className="w-10 h-10 rounded-full bg-[#FBE6E3] flex items-center justify-center mx-auto mb-4">
          <Trash2 size={18} className="text-[#C8392E]" />
        </div>
        <h2 className="text-sm font-bold text-[#0E1A2B] text-center">Hapus Data</h2>
        <p className="text-xs text-[#64748B] text-center mt-2">
          Apakah Anda yakin ingin menghapus entri{' '}
          <span className="font-semibold text-[#0E1A2B] font-mono">{label}</span>?
          Tindakan ini tidak dapat dibatalkan.
        </p>
        <div className="flex gap-2 mt-5">
          <Button type="button" variant="outline" size="md" className="flex-1" onClick={onClose} disabled={deleting}>
            Batal
          </Button>
          <Button type="button" variant="danger" size="md" className="flex-1" onClick={onConfirm} disabled={deleting}>
            {deleting ? <Loader2 size={14} className="animate-spin" /> : 'Hapus'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ── MasterDataPage (shared component) ────────────────────────────────────────
function MasterDataPage({ type }) {
  const { toast } = useApp();
  const config = TYPE_CONFIG[type];

  const [data,        setData]        = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [page,        setPage]        = useState(1);
  const [pageSize,    setPageSize]    = useState(25);
  const [showModal,   setShowModal]   = useState(false);
  const [editingRow,  setEditingRow]  = useState(null);
  const [deletingRow, setDeletingRow] = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [deleting,    setDeleting]    = useState(false);

  // ── Fetch from API (fallback to mock) ──────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!config) return;
    setLoading(true);
    try {
      const res = await config.apiGet({ page: 1, limit: 500 });
      const raw = res.data?.data ?? res.data ?? [];
      const items = Array.isArray(raw) ? raw.map(config.normalize) : [];
      if (items.length > 0) {
        setData(items);
        setLoading(false);
        return;
      }
    } catch {
      // api error → empty state
    }
    setData([]);
    setLoading(false);
  }, [config]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Reset to page 1 when search or data changes
  useEffect(() => { setPage(1); }, [search, data.length]);

  if (!config) return null;

  const filtered = search
    ? data.filter((r) => config.searchKey(r).toLowerCase().includes(search.toLowerCase()))
    : data;

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  const openCreate = () => { setEditingRow(null); setShowModal(true); };
  const openEdit   = (row) => { setEditingRow(row); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingRow(null); };

  // ── Save (create or update) ────────────────────────────────────────────────
  const handleSave = async (form) => {
    const pk = config.pkKey;
    setSaving(true);
    try {
      if (editingRow) {
        // Update
        await config.apiUpdate(editingRow.id, form);
        setData((prev) => prev.map((r) =>
          r[pk] === editingRow[pk] ? { ...r, ...form } : r
        ));
        toast('Data berhasil diperbarui.', 'success');
      } else {
        // Create
        const res = await config.apiCreate(form);
        const raw = res.data?.data ?? res.data;
        const created = raw ? config.normalize(raw) : { ...form, id: `local-${Date.now()}` };
        setData((prev) => [...prev, created]);
        toast('Data berhasil ditambahkan.', 'success');
      }
      closeModal();
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Gagal menyimpan data. Coba lagi.';
      toast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    const pk = config.pkKey;
    if (!config.apiDelete) {
      toast('Hapus tidak didukung untuk data ini.', 'error');
      setDeletingRow(null);
      return;
    }
    setDeleting(true);
    try {
      await config.apiDelete(deletingRow.id);
      setData((prev) => prev.filter((r) => r[pk] !== deletingRow[pk]));
      toast('Data berhasil dihapus.', 'success');
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Gagal menghapus data.';
      toast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    } finally {
      setDeleting(false);
      setDeletingRow(null);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0E1A2B]">{config.title}</h1>
          <p className="text-sm text-[#64748B] mt-0.5">{config.subtitle}</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {config.importLabel && (
            <Button
              variant="outline"
              icon={Upload}
              onClick={() => toast(`Import ${config.importLabel} — fitur segera hadir`, 'info')}
            >
              {config.importLabel}
            </Button>
          )}
          <Button onClick={openCreate} icon={Plus}>{config.addLabel}</Button>
        </div>
      </div>

      {/* ── Table card ── */}
      <div className="bg-white border border-[#E4E9F1] rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-[#E4E9F1] bg-[#FAFBFD]">
          <div className="relative flex-1 min-w-[180px] max-w-xs">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder={`Cari ${config.title.toLowerCase()}...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E4E9F1] bg-white text-[#0E1A2B] placeholder:text-[#94A3B8] outline-none focus:border-[#1E4F91]/50 transition-all"
            />
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              icon={SlidersHorizontal}
              onClick={() => toast('Filter — fitur segera hadir', 'info')}
            >
              Filter
            </Button>
            <Button
              variant="outline"
              size="sm"
              icon={Download}
              onClick={() => toast('Export data berhasil', 'success')}
            >
              Export
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E4E9F1] bg-[#FAFBFD] text-left">
                {config.columns.map((col, i) => (
                  <th
                    key={i}
                    className={cn(
                      'px-4 py-2.5 text-[10px] font-bold uppercase tracking-widest text-[#64748B]',
                      i === config.columns.length - 1 ? 'text-right' : ''
                    )}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={config.columns.length} className="px-4 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-sm text-[#94A3B8]">
                      <Loader2 size={16} className="animate-spin" />
                      Memuat data...
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={config.columns.length} className="px-4 py-12 text-center text-sm text-[#94A3B8]">
                    Tidak ada data yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                paginated.map((row, idx) => {
                  const cells = config.renderRow(row);
                  return (
                    <tr key={row.id ?? idx} className="border-b border-[#E4E9F1] hover:bg-[#F5F7FB] transition-colors">
                      {cells.map((cell, ci) => (
                        <td key={ci} className="px-4 py-3">{cell}</td>
                      ))}
                      {/* Actions column */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEdit(row)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg border border-[#E4E9F1] text-[#1E4F91] hover:bg-[#E8F0FB] transition-all"
                          >
                            <Edit2 size={10} />
                            Edit
                          </button>
                          {config.apiDelete && (
                            <button
                              onClick={() => setDeletingRow(row)}
                              className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg border border-[#FBE6E3] text-[#C8392E] hover:bg-[#FBE6E3] transition-all"
                            >
                              <Trash2 size={10} />
                              Hapus
                            </button>
                          )}
                        </div>
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

      {/* ── Modals ── */}
      {showModal && (
        <MasterModal
          config={config}
          row={editingRow}
          onClose={closeModal}
          onSave={handleSave}
          saving={saving}
        />
      )}
      {deletingRow && (
        <DeleteModal
          config={config}
          row={deletingRow}
          onClose={() => setDeletingRow(null)}
          onConfirm={handleDelete}
          deleting={deleting}
        />
      )}
    </div>
  );
}

// ── Named exports ─────────────────────────────────────────────────────────────
export function HospitalsPage()  { return <MasterDataPage type="hospitals"  />; }
export function DiagnosesPage()  { return <MasterDataPage type="diagnoses"  />; }
export function ProceduresPage() { return <MasterDataPage type="procedures" />; }
export function CmgsPage()       { return <MasterDataPage type="cmgs"       />; }
export function CaseTypesPage()  { return <MasterDataPage type="casetypes"  />; }
export function DischargesPage() { return <MasterDataPage type="discharges" />; }

export default MasterDataPage;
