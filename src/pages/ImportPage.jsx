import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Upload,
  FileText,
  Eye,
  RefreshCw,
  Search,
  Info,
  CheckCircle2,
  Loader2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Download,
  AlertTriangle,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { normalizeImportJob } from '@/contexts/AppContext';
import { uploadClaims, getImportJobs } from '@/lib/api';
import { cn, formatNumber, dateID, timeID } from '@/lib/utils';
import Button from '@/components/ui/Button';

// ── Column guide ──────────────────────────────────────────────────────────────
const COLUMNS = [
  { name: 'kode_rs',         desc: 'Kode Rumah Sakit (7 digit)' },
  { name: 'sep',             desc: 'Nomor SEP unik per klaim' },
  { name: 'mrn',             desc: 'Medical Record Number pasien' },
  { name: 'nama_pasien',     desc: 'Nama lengkap pasien' },
  { name: 'tgl_masuk',       desc: 'Tanggal masuk (YYYY-MM-DD)' },
  { name: 'tgl_pulang',      desc: 'Tanggal pulang (YYYY-MM-DD)' },
  { name: 'diaglist',        desc: 'Daftar diagnosa ICD-10 (;)' },
  { name: 'proclist',        desc: 'Daftar prosedur ICD-9CM (;)' },
  { name: 'inacbg',          desc: 'Kode INA-CBG hasil grouper' },
  { name: 'tarif_inacbg',    desc: 'Tarif RS dari INA-CBG (Rp)' },
  { name: 'tarif_rs',        desc: 'Tarif RS yang ditagihkan (Rp)' },
  { name: 'dpjp',            desc: 'Nama Dokter Penanggung Jawab' },
  { name: 'discharge_status',desc: 'Status pulang pasien' },
  { name: 'severity_level',  desc: 'Severity level 0 / I / II / III' },
];

const TABS = ['Semua', 'Selesai', 'Berjalan', 'Gagal'];
const STATUS_MAP = { semua: null, selesai: 'selesai', berjalan: 'berjalan', gagal: 'gagal' };

// ── Status pill ───────────────────────────────────────────────────────────────
function StatusPill({ status }) {
  const map = {
    // backend values
    completed:  { label: 'Selesai',   icon: CheckCircle2, bg: 'bg-[#E4F4EB]', text: 'text-[#2E9A5A]' },
    running:    { label: 'Memproses', icon: Loader2,      bg: 'bg-[#E8F0FB]', text: 'text-[#1E4F91]' },
    processing: { label: 'Memproses', icon: Loader2,      bg: 'bg-[#E8F0FB]', text: 'text-[#1E4F91]' },
    queued:     { label: 'Antrian',   icon: Loader2,      bg: 'bg-[#E8F0FB]', text: 'text-[#1E4F91]' },
    failed:     { label: 'Gagal',     icon: XCircle,      bg: 'bg-[#FBE6E3]', text: 'text-[#C8392E]' },
    // legacy display values
    selesai:    { label: 'Selesai',   icon: CheckCircle2, bg: 'bg-[#E4F4EB]', text: 'text-[#2E9A5A]' },
    berjalan:   { label: 'Memproses', icon: Loader2,      bg: 'bg-[#E8F0FB]', text: 'text-[#1E4F91]' },
    gagal:      { label: 'Gagal',     icon: XCircle,      bg: 'bg-[#FBE6E3]', text: 'text-[#C8392E]' },
  };
  const v = map[status?.toLowerCase()] ?? map.completed;
  const Icon = v.icon;
  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold', v.bg, v.text)}>
      <Icon size={11} className={status === 'berjalan' ? 'animate-spin' : ''} />
      {v.label}
    </span>
  );
}

// ── Upload zone ───────────────────────────────────────────────────────────────
function UploadZone({ onFileSelected }) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileSelected(file);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      className={cn(
        'border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-150',
        dragging
          ? 'border-[#1E4F91] bg-[#E8F0FB]'
          : 'border-[#D1D9E6] bg-[#FAFBFD] hover:border-[#1E4F91]/50 hover:bg-[#F5F7FB]'
      )}
    >
      <div className={cn('w-14 h-14 rounded-2xl flex items-center justify-center transition-all', dragging ? 'bg-[#1E4F91]' : 'bg-[#E8F0FB]')}>
        <Upload size={24} className={dragging ? 'text-white' : 'text-[#1E4F91]'} />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-[#0E1A2B]">
          Tarik file ke sini atau klik untuk pilih
        </p>
        <p className="text-xs text-[#64748B] mt-1">Format: .txt · INA-CBG grouper output</p>
      </div>
      <Button type="button" onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}>
        Pilih Berkas
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept=".txt,.csv"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileSelected(file);
          e.target.value = '';
        }}
      />
    </div>
  );
}

// ── Upload progress ───────────────────────────────────────────────────────────
function UploadProgress({ file, progress, status, rowsProcessed }) {
  return (
    <div className="border border-[#E4E9F1] rounded-2xl p-4 bg-white flex flex-col gap-3">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#E8F0FB] flex items-center justify-center">
          <FileText size={18} className="text-[#1E4F91]" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-[#0E1A2B] truncate">{file.name}</p>
          <p className="text-xs text-[#64748B]">{(file.size / 1024).toFixed(1)} KB</p>
        </div>
        <StatusPill status={status} />
      </div>

      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between text-xs text-[#64748B]">
          <span>{rowsProcessed != null ? `${formatNumber(rowsProcessed)} baris diproses` : 'Mengunggah…'}</span>
          <span>{progress}%</span>
        </div>
        <div className="h-2 bg-[#F5F7FB] rounded-full overflow-hidden">
          <div
            className={cn('h-full rounded-full transition-all duration-500', status === 'gagal' ? 'bg-[#C8392E]' : 'bg-[#1E4F91]')}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <p className="text-xs text-[#94A3B8] font-mono">
        POST /claims/import · Bull queue: analyze@1
      </p>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ImportPage() {
  const navigate = useNavigate();
  const { toast, refreshImportJobs, setActiveJobId } = useApp();

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('berjalan');
  const [rowsProcessed, setRowsProcessed] = useState(null);

  const [jobs, setJobs] = useState([]);
  const [loadingJobs, setLoadingJobs] = useState(true);
  const [activeTab, setActiveTab] = useState('Semua');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const pageSize = 8;

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true);
    try {
      const res = await getImportJobs({ page: 1, limit: 100 });
      const raw = res.data?.data ?? res.data ?? [];
      const data = Array.isArray(raw) ? raw.map(normalizeImportJob) : [];
      setJobs(data);
    } catch {
      setJobs([]);
    } finally {
      setLoadingJobs(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleFileSelected = async (file) => {
    setUploadFile(file);
    setUploadProgress(0);
    setUploadStatus('berjalan');
    setRowsProcessed(null);

    try {
      const res = await uploadClaims(file, (pct) => setUploadProgress(pct));
      // Backend response: { message, data: { import_job_id } }
      const importJobId = res.data?.data?.import_job_id ?? res.data?.import_job_id;
      setUploadProgress(100);
      setUploadStatus('completed');
      setRowsProcessed(null); // akan diupdate saat proses selesai
      if (importJobId) setActiveJobId(importJobId);
      toast('Berkas berhasil diunggah! Sedang diproses...', 'success');
      await refreshImportJobs();
      fetchJobs();
    } catch (err) {
      setUploadStatus('failed');
      const msg = err?.response?.data?.message ?? 'Gagal mengunggah berkas. Coba lagi.';
      toast(msg, 'error');
    }
  };

  // Filter jobs — handle both backend (completed/running/failed) dan legacy (selesai/berjalan/gagal)
  const filtered = jobs.filter((j) => {
    const s = j.status?.toLowerCase() ?? '';
    const isSelesai  = s === 'completed' || s === 'selesai';
    const isBerjalan = s === 'running' || s === 'processing' || s === 'queued' || s === 'berjalan';
    const isGagal    = s === 'failed' || s === 'error' || s === 'gagal';
    const tabFilter =
      activeTab === 'Semua'   ? true :
      activeTab === 'Selesai' ? isSelesai :
      activeTab === 'Berjalan'? isBerjalan :
      isGagal;
    const searchFilter = !search
      || (j.filename ?? j.file_name ?? '').toLowerCase().includes(search.toLowerCase())
      || String(j.id).toLowerCase().includes(search.toLowerCase());
    return tabFilter && searchFilter;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="flex flex-col gap-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0E1A2B]">Import Klaim INA-CBG</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Upload berkas output grouper INA-CBG untuk diproses.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="md" icon={Info}>Lihat format</Button>
          <Button variant="secondary" size="md" icon={Download}>Template</Button>
          <Button variant="primary" size="lg" icon={FileSpreadsheet}>Import CSV</Button>
        </div>
      </div>

      {/* ── Two column ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Upload card */}
        <div className="lg:col-span-3 bg-white border border-[#E4E9F1] rounded-2xl p-5 shadow-sm flex flex-col gap-4">
          <h2 className="text-sm font-semibold text-[#0E1A2B]">Upload Berkas</h2>

          {!uploadFile ? (
            <UploadZone onFileSelected={handleFileSelected} />
          ) : (
            <>
              <UploadProgress
                file={uploadFile}
                progress={uploadProgress}
                status={uploadStatus}
                rowsProcessed={rowsProcessed}
              />
              {(uploadStatus === 'selesai' || uploadStatus === 'gagal') && (
                <button
                  onClick={() => { setUploadFile(null); setUploadProgress(0); }}
                  className="self-start text-xs text-[#1E4F91] font-medium hover:underline"
                >
                  Upload berkas lain
                </button>
              )}
            </>
          )}

          {/* Info notes */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-[#FDF1DD] border border-[#C97A12]/20">
            <AlertTriangle size={14} className="text-[#C97A12] mt-0.5 shrink-0" />
            <p className="text-xs text-[#C97A12] leading-relaxed">
              Pastikan berkas sesuai format kolom yang ditentukan. Berkas yang tidak valid akan menyebabkan proses gagal.
            </p>
          </div>
        </div>

        {/* Column guide */}
        <div className="lg:col-span-2 bg-white border border-[#E4E9F1] rounded-2xl p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-[#0E1A2B] mb-3">Pedoman Berkas</h2>
          <p className="text-xs text-[#64748B] mb-3">Kolom yang wajib ada dalam berkas .txt (tab-separated):</p>
          <div className="flex flex-col gap-0.5 max-h-72 overflow-y-auto pr-1">
            {COLUMNS.map((col, i) => (
              <div key={col.name} className="flex items-start gap-2 py-1.5 border-b border-[#F5F7FB] last:border-0">
                <span className="text-[#94A3B8] font-mono text-[10px] w-5 text-right mt-0.5">{i + 1}</span>
                <div className="flex-1">
                  <span className="font-mono text-xs font-semibold text-[#1E4F91]">{col.name}</span>
                  <span className="text-xs text-[#64748B] ml-1.5">{col.desc}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Riwayat Import ── */}
      <div className="bg-white border border-[#E4E9F1] rounded-2xl shadow-sm overflow-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-b border-[#E4E9F1]">
          <h2 className="text-sm font-semibold text-[#0E1A2B]">Riwayat Import</h2>
          <div className="flex items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                placeholder="Cari berkas atau job ID…"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E4E9F1] bg-[#F5F7FB] text-[#0E1A2B] placeholder:text-[#94A3B8] outline-none focus:border-[#1E4F91]/50 w-48 transition-all"
              />
            </div>
            <button
              onClick={fetchJobs}
              className="p-1.5 rounded-lg border border-[#E4E9F1] text-[#64748B] hover:text-[#0E1A2B] transition-all"
            >
              <RefreshCw size={14} className={loadingJobs ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-0 px-5 border-b border-[#E4E9F1]">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setPage(1); }}
              className={cn(
                'px-3 py-2.5 text-xs font-semibold border-b-2 transition-all -mb-px',
                activeTab === tab
                  ? 'border-[#1E4F91] text-[#1E4F91]'
                  : 'border-transparent text-[#64748B] hover:text-[#0E1A2B]'
              )}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E4E9F1] bg-[#FAFBFD] text-left">
                {['Berkas', 'Job ID', 'Status', 'Progress', 'Total', 'Diproses', 'Mulai', 'Selesai', ''].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-xs font-semibold text-[#64748B] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loadingJobs ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center">
                    <Loader2 size={20} className="animate-spin text-[#1E4F91] mx-auto" />
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-sm text-[#94A3B8]">
                    Tidak ada riwayat import.
                  </td>
                </tr>
              ) : (
                paginated.map((job) => (
                  <tr key={job.id} className="border-b border-[#E4E9F1] hover:bg-[#F5F7FB] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText size={14} className="text-[#64748B] shrink-0" />
                        <span className="font-medium text-[#0E1A2B] text-xs max-w-[140px] truncate">
                          {job.filename ?? job.file_name ?? '—'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{job.id}</td>
                    <td className="px-4 py-3">
                      <StatusPill status={job.status} />
                    </td>
                    <td className="px-4 py-3 min-w-[100px]">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 bg-[#F5F7FB] rounded-full overflow-hidden">
                          <div
                            className={cn('h-full rounded-full', job.status === 'gagal' ? 'bg-[#C8392E]' : 'bg-[#2E9A5A]')}
                            style={{ width: `${job.progress ?? 0}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[#64748B] tabular-nums w-8 text-right">{job.progress ?? 0}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-right text-[#64748B]">{formatNumber(job.total ?? 0)}</td>
                    <td className="px-4 py-3 text-xs text-right text-[#64748B]">{formatNumber(job.processed ?? 0)}</td>
                    <td className="px-4 py-3 text-xs text-[#64748B] whitespace-nowrap">
                      <div>{dateID(job.started_at)}</div>
                      <div className="text-[#94A3B8]">{timeID(job.started_at)}</div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[#64748B] whitespace-nowrap">
                      {(job.finished_at ?? job.completed_at) ? (
                        <>
                          <div>{dateID(job.finished_at ?? job.completed_at)}</div>
                          <div className="text-[#94A3B8]">{timeID(job.finished_at ?? job.completed_at)}</div>
                        </>
                      ) : (
                        <span className="text-[#94A3B8]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => {
                          const jobId = job.id ?? job.import_job_id;
                          setActiveJobId(String(jobId));
                          navigate('/claims');
                        }}
                        className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E4F91] hover:bg-[#E8F0FB] transition-all"
                        title="Lihat klaim"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-[#E4E9F1]">
          <span className="text-xs text-[#64748B]">
            {filtered.length} entri · halaman {page} dari {totalPages}
          </span>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-1.5 rounded-lg border border-[#E4E9F1] text-[#64748B] hover:text-[#0E1A2B] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-1.5 rounded-lg border border-[#E4E9F1] text-[#64748B] hover:text-[#0E1A2B] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
