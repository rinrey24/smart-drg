import axios from 'axios';

// Base URL sudah include /api prefix (dari .env: http://localhost:3000/api)
const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';

export const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor — attach Bearer token dari localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 global
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Hanya redirect jika user SEBELUMNYA sudah login (ada token).
      // Jika belum punya token sama sekali, tidak perlu redirect —
      // cukup reject promise dan biarkan halaman login bekerja normal.
      const wasLoggedIn = !!localStorage.getItem('token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (wasLoggedIn && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ─── Helper ──────────────────────────────────────────────────────────────────
// Semua response backend berbentuk { message, data, meta }
// Helper ini mengekstrak data array dari paginated response
export const unwrap = (res) => res.data?.data ?? res.data;
export const unwrapList = (res) => {
  const d = res.data;
  return {
    items: d?.data ?? [],
    pagination: d?.meta?.pagination ?? null,
  };
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
// POST /auth/login  body: { username, password }  → { access_token }
export const login = (username, password) =>
  api.post('/auth/login', { username, password });

// ─── Users ───────────────────────────────────────────────────────────────────
// GET  /users?page&limit&search   → paginated { data: User[] }
export const getUsers = (params) => api.get('/users', { params });

// GET  /users/:id
export const getUserById = (id) => api.get(`/users/${id}`);

// GET  /users/username/:username
export const getUserByUsername = (username) =>
  api.get(`/users/username/${username}`);

// POST /users  body: { username, name, password, role }
export const createUser = (data) => api.post('/users', data);

// PUT  /users/:id  body: partial user
export const updateUser = (id, data) => api.put(`/users/${id}`, data);

// ─── Import Jobs ──────────────────────────────────────────────────────────────
// GET  /claims/import?page&limit  → paginated ImportJob[]
export const getImportJobs = (params) =>
  api.get('/claims/import', { params });

// GET  /claims/import/status/:jobId  → ImportJob status
export const getImportJobStatus = (jobId) =>
  api.get(`/claims/import/status/${jobId}`);

// GET  /claims/import/:id
export const getImportJobById = (id) => api.get(`/claims/import/${id}`);

// POST /claims/import  multipart file upload
export const uploadClaims = (file, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  return api.post('/claims/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (e) => {
      if (onProgress && e.total) {
        onProgress(Math.round((e.loaded * 100) / e.total));
      }
    },
  });
};

// ─── Claims ───────────────────────────────────────────────────────────────────
// GET  /claims?page&limit&search  → semua klaim paginated
export const getAllClaims = (params) => api.get('/claims', { params });

// GET  /claims/:import_job_id?page&limit&search  → klaim by job
export const getClaims = (importJobId, params) =>
  api.get(`/claims/${importJobId}`, { params });

// GET  /claims/detail/:id  → single claim (not yet implemented in backend — modal falls back to prop)
export const getClaimById = (id) => api.get(`/claims/detail/${id}`);

// DELETE /claims/:import_job_id
export const deleteClaimsByJob = (importJobId) =>
  api.delete(`/claims/${importJobId}`);

// ─── Analyze ─────────────────────────────────────────────────────────────────
// POST /analyze  body: { import_job_id }  → enqueue analysis
export const runAnalysis = (importJobId) =>
  api.post('/analyze', { import_job_id: importJobId });

// GET  /analyze/:import_job_id?page&limit&category  → hasil analisis
export const getAnalysisResults = (importJobId, params) =>
  api.get(`/analyze/${importJobId}`, { params });

// ─── Dashboard ────────────────────────────────────────────────────────────────
// GET /dashboard/summary-all/:import_job_id
export const getDashboardSummary = (importJobId) =>
  api.get(`/dashboard/summary-all/${importJobId}`);

// GET /dashboard/severity-level/:import_job_id
export const getDashboardSeverity = (importJobId) =>
  api.get(`/dashboard/severity-level/${importJobId}`);

// GET /dashboard/discharge/:import_job_id
export const getDashboardDischarge = (importJobId) =>
  api.get(`/dashboard/discharge/${importJobId}`);

// GET /dashboard/case-type/:import_job_id
export const getDashboardCaseType = (importJobId) =>
  api.get(`/dashboard/case-type/${importJobId}`);

// GET /dashboard/cmg/:import_job_id
export const getDashboardCmg = (importJobId) =>
  api.get(`/dashboard/cmg/${importJobId}`);

// ─── Rules ───────────────────────────────────────────────────────────────────
// NOTE: Backend has no GET /rules list — page uses mock data as fallback
// GET  /rules  → list (not implemented; page falls back to mock)
export const getRules = (params) => api.get('/rules', { params });

// POST /rules  body: CreateRuleDto
export const createRule = (data) => api.post('/rules', data);

// PUT  /rules/:id  → general update (not in backend; use activateRule/archiveRule instead)
export const updateRule = (id, data) => api.put(`/rules/${id}`, data);

// GET  /rules/:id  → rule detail dengan condition tree
export const getRuleById = (id) => api.get(`/rules/${id}`);

// PATCH /rules/:id/activate
export const activateRule = (id) => api.patch(`/rules/${id}/activate`);

// PATCH /rules/:id/archive
export const archiveRule = (id) => api.patch(`/rules/${id}/archive`);

// ─── Hospitals ───────────────────────────────────────────────────────────────
// Backend fields: { id, code, name, class, address, phone, max_visit_rj_permonth, max_visit_ri_permonth }
export const getHospitals = (params) => api.get('/hospitals', { params });
export const createHospital = (data) => api.post('/hospitals', data);
export const updateHospital = (id, data) => api.put(`/hospitals/${id}`, data);

// ─── Diagnoses ───────────────────────────────────────────────────────────────
// Backend fields: { id, code, description }
export const getDiagnoses = (params) => api.get('/diagnoses', { params });
export const createDiagnosis = (data) => api.post('/diagnoses', data);
export const updateDiagnosis = (id, data) => api.put(`/diagnoses/${id}`, data);
export const deleteDiagnosis = (id) => api.delete(`/diagnoses/${id}`);

// ─── Procedures ──────────────────────────────────────────────────────────────
// Backend fields: { id, code, description }
export const getProcedures = (params) => api.get('/procedures', { params });
export const createProcedure = (data) => api.post('/procedures', data);
export const updateProcedure = (id, data) => api.put(`/procedures/${id}`, data);
export const deleteProcedure = (id) => api.delete(`/procedures/${id}`);

// ─── CMGs ────────────────────────────────────────────────────────────────────
// Backend fields: { id, code_cmg, description, is_active }
export const getCmgs = (params) => api.get('/cmgs', { params });
export const createCmg = (data) => api.post('/cmgs', data);
export const updateCmg = (id, data) => api.put(`/cmgs/${id}`, data);
export const deleteCmg = (id) => api.delete(`/cmgs/${id}`);

// ─── Case Types ───────────────────────────────────────────────────────────────
// Backend fields: { id, tipe_kasus, description, is_active }
export const getCaseTypes = (params) => api.get('/case-types', { params });
export const createCaseType = (data) => api.post('/case-types', data);
export const updateCaseType = (id, data) => api.put(`/case-types/${id}`, data);
export const deleteCaseType = (id) => api.delete(`/case-types/${id}`);

// ─── Discharges ───────────────────────────────────────────────────────────────
// Backend fields: { id, discharge_status, description, is_active }
export const getDischarges = (params) => api.get('/discharges', { params });
export const createDischarge = (data) => api.post('/discharges', data);
export const updateDischarge = (id, data) => api.put(`/discharges/${id}`, data);
export const deleteDischarge = (id) => api.delete(`/discharges/${id}`);

// ─── Overstays ────────────────────────────────────────────────────────────────
export const getOverstays = (params) => api.get('/overstays', { params });
export const createOverstay = (data) => api.post('/overstays', data);
export const updateOverstay = (id, data) => api.put(`/overstays/${id}`, data);
