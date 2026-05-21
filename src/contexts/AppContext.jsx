import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { getImportJobs } from '@/lib/api';
import AuthContext from './AuthContext';

const AppContext = createContext(null);
let _toastId = 0;

// ── Normalize import job dari backend ke format frontend ──────────────────────
// Backend: { id, filename, status: queued/processing/completed/failed,
//            total_records, processed_records, progress, started_at, completed_at, created_at }
// Frontend: { id, filename, status: selesai/berjalan/gagal,
//             total, processed, progress, started_at, finished_at, created_at }
const JOB_STATUS_MAP = {
  completed:  'completed',
  done:       'completed',   // backend sometimes returns 'DONE'
  processing: 'running',
  queued:     'running',
  pending:    'running',
  running:    'running',
  failed:     'failed',
  error:      'failed',
};

export function normalizeImportJob(job) {
  return {
    ...job,
    // Normalise status ke nilai yang dipakai Topbar JobPicker dot color
    status: JOB_STATUS_MAP[job.status?.toLowerCase()] ?? job.status,
    // Normalise field names
    total:     job.total     ?? job.total_records     ?? 0,
    processed: job.processed ?? job.processed_records ?? 0,
    progress:  job.progress  ?? 0,
    // Normalise tanggal selesai
    finished_at: job.finished_at ?? job.completed_at ?? null,
  };
}


export function AppProvider({ children }) {
  // ─── Read auth token dari AuthContext (AppProvider is nested inside AuthProvider) ─
  const auth = useContext(AuthContext);
  const token = auth?.token ?? localStorage.getItem('token');

  // ─── Active Import Job ──────────────────────────────────────────────────────
  const [activeJobId, setActiveJobIdState] = useState(() =>
    localStorage.getItem('activeJobId') ?? null
  );

  const setActiveJobId = useCallback((id) => {
    setActiveJobIdState(id);
    if (id == null) localStorage.removeItem('activeJobId');
    else localStorage.setItem('activeJobId', String(id));
  }, []);

  // ─── Import Jobs List ───────────────────────────────────────────────────────
  const [importJobs, setImportJobs] = useState([]);

  const fetchImportJobs = useCallback(async () => {
    // Jangan panggil API jika belum login — hindari 401 dan ECONNREFUSED spam
    if (!localStorage.getItem('token')) return;
    try {
      const res = await getImportJobs({ page: 1, limit: 50 });
      // Backend: { message, data: [...], meta: { pagination } }
      const raw = res.data?.data ?? res.data ?? [];
      const jobs = Array.isArray(raw) ? raw.map(normalizeImportJob) : [];

      if (jobs.length > 0) {
        setImportJobs(jobs);
        if (!localStorage.getItem('activeJobId')) {
          setActiveJobId(jobs[0].id ?? null);
        }
        return;
      }
    } catch {
      // Backend tidak tersedia
    }
    setImportJobs([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch hanya saat ada token — juga auto-refresh ketika user login (token berubah dari null → ada)
  useEffect(() => {
    if (token) fetchImportJobs();
    else setImportJobs([]); // bersihkan saat logout
  }, [fetchImportJobs, token]);

  // ─── Toast ──────────────────────────────────────────────────────────────────
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef({});

  const dismissToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    clearTimeout(timersRef.current[id]);
    delete timersRef.current[id];
  }, []);

  const toast = useCallback(
    (message, type = 'info', duration = 4000) => {
      const id = ++_toastId;
      setToasts((prev) => [...prev, { id, message, type }]);
      if (duration > 0) {
        timersRef.current[id] = setTimeout(() => dismissToast(id), duration);
      }
      return id;
    },
    [dismissToast]
  );

  const value = {
    activeJobId,
    setActiveJobId,
    importJobs,
    refreshImportJobs: fetchImportJobs,
    toast,
    toasts,
    dismissToast,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}

export default AppContext;
