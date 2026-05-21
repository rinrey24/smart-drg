import { useState, useEffect, useCallback } from 'react';
import {
  Wifi,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Globe,
  Clock,
  Sun,
  Moon,
  Info,
  Trash2,
  AlertTriangle,
  Building2,
  Hash,
  Tag,
  Loader2,
} from 'lucide-react';
import { useApp } from '@/contexts/AppContext';
import { getHospitals, updateHospital } from '@/lib/api';
import { cn } from '@/lib/utils';

// ── Tabs ──────────────────────────────────────────────────────────────────────
const TABS = [
  { key: 'umum',   label: 'Umum'      },
  { key: 'profil', label: 'Profil RS' },
];

// ── Sub-components ────────────────────────────────────────────────────────────
function Section({ title, description, children }) {
  return (
    <div className="bg-white border border-[#E4E9F1] rounded-2xl shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-[#E4E9F1] bg-[#FAFBFD]">
        <h2 className="text-sm font-semibold text-[#0E1A2B]">{title}</h2>
        {description && <p className="text-xs text-[#64748B] mt-0.5">{description}</p>}
      </div>
      <div className="px-6 py-5 flex flex-col gap-5">{children}</div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-3">
      <div className="sm:w-52 shrink-0">
        <div className="text-xs font-semibold text-[#0E1A2B]">{label}</div>
        {hint && <div className="text-[11px] text-[#64748B] mt-0.5">{hint}</div>}
      </div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function SettingsInput({ value, onChange, type = 'text', placeholder, className, ...rest }) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(
        'w-full px-3 py-2 text-xs rounded-xl border border-[#E4E9F1] bg-white text-[#0E1A2B] placeholder:text-[#94A3B8] outline-none focus:border-[#1E4F91]/60 focus:ring-2 focus:ring-[#1E4F91]/10 transition-all',
        className
      )}
      {...rest}
    />
  );
}

function SelectField({ value, onChange, options }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none px-3 py-2 text-xs rounded-xl border border-[#E4E9F1] bg-white text-[#0E1A2B] outline-none focus:border-[#1E4F91]/60 cursor-pointer pr-8"
      >
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none">
          <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </div>
  );
}

// ── Hospital Profile Tab ──────────────────────────────────────────────────────
function HospitalProfileTab() {
  const { toast } = useApp();

  const [profileId, setProfileId] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [saving,    setSaving]    = useState(false);
  const [dirty,     setDirty]     = useState(false);
  const [form, setForm] = useState({
    kode_rs: '', nama: '', kelas: 'B', alamat: '', telepon: '', max_rj: '', max_ri: '',
  });

  const setF = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await getHospitals({ page: 1, limit: 1 });
      const raw  = res.data?.data ?? res.data ?? [];
      const item = Array.isArray(raw) ? raw[0] : raw;
      if (item?.id) {
        setProfileId(item.id);
        setForm({
          kode_rs: item.code    ?? '',
          nama:    item.name    ?? '',
          kelas:   item.class   ?? 'B',
          alamat:  item.address ?? '',
          telepon: item.phone   ?? '',
          max_rj:  item.max_visit_rj_permonth != null ? String(item.max_visit_rj_permonth) : '',
          max_ri:  item.max_visit_ri_permonth != null ? String(item.max_visit_ri_permonth) : '',
        });
      }
    } catch {
      // API not available — leave empty form
    }
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchProfile(); }, [fetchProfile]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!profileId) return;
    setSaving(true);
    try {
      await updateHospital(profileId, {
        code:                  form.kode_rs,
        name:                  form.nama,
        class:                 form.kelas,
        address:               form.alamat,
        phone:                 form.telepon || null,
        max_visit_rj_permonth: form.max_rj ? Number(form.max_rj) : null,
        max_visit_ri_permonth: form.max_ri ? Number(form.max_ri) : null,
      });
      setDirty(false);
      toast('Profil rumah sakit berhasil disimpan.', 'success');
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Gagal menyimpan perubahan.';
      toast(Array.isArray(msg) ? msg.join(', ') : msg, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-[#E4E9F1] rounded-2xl shadow-sm p-12 flex items-center justify-center gap-2 text-sm text-[#94A3B8]">
        <Loader2 size={16} className="animate-spin" />
        Memuat profil rumah sakit...
      </div>
    );
  }

  if (!profileId) {
    return (
      <div className="bg-white border border-[#E4E9F1] rounded-2xl shadow-sm p-12 text-center">
        <Building2 size={32} className="text-[#94A3B8] mx-auto mb-3" />
        <p className="text-sm font-semibold text-[#0E1A2B]">Data rumah sakit belum tersedia</p>
        <p className="text-xs text-[#64748B] mt-1">
          Hubungi administrator untuk mengisi data profil rumah sakit.
        </p>
      </div>
    );
  }

  const saveBtn = (
    <div className="flex justify-end pt-1">
      <button
        type="submit"
        disabled={saving || !dirty}
        className={cn(
          'flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-xl transition-all shadow-sm',
          dirty && !saving
            ? 'bg-[#1E4F91] text-white hover:bg-[#1a4580]'
            : 'bg-[#E4E9F1] text-[#94A3B8] cursor-not-allowed'
        )}
      >
        {saving && <Loader2 size={13} className="animate-spin" />}
        Simpan Perubahan
      </button>
    </div>
  );

  return (
    <form onSubmit={handleSave} className="flex flex-col gap-6">
      {/* ── Identitas ── */}
      <Section
        title="Identitas Rumah Sakit"
        description="Informasi dasar rumah sakit yang terdaftar pada sistem Smart DRG"
      >
        <Field label="Kode RS" hint="Kode unik RS pada sistem INA-CBG — tidak dapat diubah">
          <span className="inline-block font-mono text-xs font-semibold text-[#1E4F91] bg-[#E8F0FB] px-3 py-2 rounded-xl border border-[#E4E9F1]">
            {form.kode_rs || '—'}
          </span>
        </Field>

        <Field label="Nama Rumah Sakit" hint="Nama resmi sesuai izin operasional">
          <SettingsInput
            value={form.nama}
            onChange={(v) => setF('nama', v)}
            placeholder="RSUD Cipto Mangunkusumo"
          />
        </Field>

        <Field label="Kelas RS" hint="Kelas pelayanan berdasarkan PERMENKES">
          <div className="flex items-center gap-2 flex-wrap">
            {['A', 'B', 'C', 'D'].map((k) => (
              <button
                key={k}
                type="button"
                onClick={() => setF('kelas', k)}
                className={cn(
                  'px-4 py-2 text-xs font-semibold rounded-xl border transition-all',
                  form.kelas === k
                    ? 'border-[#1E4F91] bg-[#E8F0FB] text-[#1E4F91]'
                    : 'border-[#E4E9F1] bg-white text-[#64748B] hover:text-[#0E1A2B]'
                )}
              >
                Kelas {k}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Alamat / Kota" hint="Lokasi rumah sakit">
          <SettingsInput
            value={form.alamat}
            onChange={(v) => setF('alamat', v)}
            placeholder="Jl. Diponegoro No.71, Jakarta Pusat"
          />
        </Field>

        <Field label="Nomor Telepon" hint="Nomor telepon utama RS">
          <SettingsInput
            value={form.telepon}
            onChange={(v) => setF('telepon', v)}
            placeholder="021-1234567"
          />
        </Field>
      </Section>

      {/* ── Batas Kunjungan ── */}
      <Section
        title="Batas Kunjungan per Bulan"
        description="Kapasitas kunjungan maksimal yang dapat diklaim ke BPJS setiap bulan"
      >
        <Field label="Rawat Jalan (RJ)" hint="Maks. kunjungan rawat jalan per bulan">
          <div className="flex items-center gap-2">
            <SettingsInput
              type="number"
              min="0"
              value={form.max_rj}
              onChange={(v) => setF('max_rj', v)}
              placeholder="0"
              className="max-w-[200px]"
            />
            <span className="text-xs text-[#64748B] shrink-0">kunjungan / bulan</span>
          </div>
        </Field>

        <Field label="Rawat Inap (RI)" hint="Maks. kunjungan rawat inap per bulan">
          <div className="flex items-center gap-2">
            <SettingsInput
              type="number"
              min="0"
              value={form.max_ri}
              onChange={(v) => setF('max_ri', v)}
              placeholder="0"
              className="max-w-[200px]"
            />
            <span className="text-xs text-[#64748B] shrink-0">kunjungan / bulan</span>
          </div>
        </Field>

        {saveBtn}
      </Section>
    </form>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { toast } = useApp();
  const [activeTab, setActiveTab] = useState('umum');

  // API Connection
  const [apiEndpoint, setApiEndpoint] = useState('https://api.bpjs-kesehatan.go.id/v1');
  const [apiKey, setApiKey]           = useState('bpjs_sk_live_••••••••••••••••••••••••');
  const [showApiKey, setShowApiKey]   = useState(false);
  const [testStatus, setTestStatus]   = useState(null); // null | 'testing' | 'ok' | 'fail'

  // Preferences
  const [language, setLanguage] = useState('id');
  const [timezone, setTimezone] = useState('WIB');
  const [theme,    setTheme]    = useState('light');

  const handleTestConnection = async () => {
    setTestStatus('testing');
    await new Promise((r) => setTimeout(r, 1200));
    const ok = Math.random() > 0.3;
    setTestStatus(ok ? 'ok' : 'fail');
    toast(
      ok ? 'Koneksi berhasil — latensi 142 ms.' : 'Koneksi gagal — periksa endpoint atau API key.',
      ok ? 'success' : 'error'
    );
  };

  const handleSave = () => toast('Pengaturan berhasil disimpan.', 'success');

  return (
    <div className="flex flex-col gap-6 max-w-3xl">
      {/* ── Header ── */}
      <div>
        <h1 className="text-xl font-bold text-[#0E1A2B]">Pengaturan</h1>
        <p className="text-sm text-[#64748B] mt-0.5">
          Konfigurasi koneksi API, preferensi sistem, dan profil rumah sakit
        </p>
      </div>

      {/* ── Tab Bar ── */}
      <div className="flex items-center border-b border-[#E4E9F1] -mb-2">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'px-4 py-2.5 text-xs font-semibold border-b-2 -mb-px transition-all',
              activeTab === tab.key
                ? 'border-[#1E4F91] text-[#1E4F91]'
                : 'border-transparent text-[#64748B] hover:text-[#0E1A2B]'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── Tab: Umum ── */}
      {activeTab === 'umum' && (
        <>
          {/* API Connection */}
          <Section
            title="Koneksi API BPJS"
            description="Konfigurasi endpoint dan kunci autentikasi layanan BPJS Kesehatan"
          >
            <Field label="Endpoint URL" hint="URL dasar API BPJS Kesehatan">
              <SettingsInput
                value={apiEndpoint}
                onChange={setApiEndpoint}
                placeholder="https://api.bpjs-kesehatan.go.id/v1"
              />
            </Field>

            <Field label="API Key" hint="Kunci rahasia — jangan bagikan">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <SettingsInput
                    type={showApiKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={setApiKey}
                    placeholder="bpjs_sk_live_…"
                    className="pr-9"
                  />
                  <button
                    type="button"
                    onClick={() => setShowApiKey((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                  >
                    {showApiKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                </div>
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testStatus === 'testing'}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-[#E4E9F1] bg-white text-[#1E4F91] hover:bg-[#E8F0FB] disabled:opacity-60 transition-all shrink-0"
                >
                  <Wifi size={13} className={testStatus === 'testing' ? 'animate-pulse' : ''} />
                  Test Koneksi
                </button>
              </div>
              {testStatus === 'ok' && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#2E9A5A]">
                  <CheckCircle2 size={12} /> Koneksi berhasil — latensi 142 ms
                </div>
              )}
              {testStatus === 'fail' && (
                <div className="flex items-center gap-1.5 mt-2 text-[11px] text-[#C8392E]">
                  <AlertCircle size={12} /> Koneksi gagal — periksa endpoint atau API key
                </div>
              )}
            </Field>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#1E4F91] text-white hover:bg-[#1a4580] transition-all shadow-sm"
              >
                Simpan Perubahan
              </button>
            </div>
          </Section>

          {/* Preferences */}
          <Section
            title="Preferensi Sistem"
            description="Bahasa, zona waktu, dan tampilan antarmuka"
          >
            <Field label="Bahasa" hint="Bahasa antarmuka aplikasi">
              <div className="flex items-center gap-2">
                <Globe size={14} className="text-[#64748B] shrink-0" />
                <SelectField
                  value={language}
                  onChange={setLanguage}
                  options={[
                    { value: 'id', label: 'Bahasa Indonesia' },
                    { value: 'en', label: 'English' },
                  ]}
                />
              </div>
            </Field>

            <Field label="Zona Waktu" hint="Zona waktu untuk tampilan tanggal & jam">
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-[#64748B] shrink-0" />
                <SelectField
                  value={timezone}
                  onChange={setTimezone}
                  options={[
                    { value: 'WIB',  label: 'WIB (UTC+7) — Waktu Indonesia Barat'  },
                    { value: 'WITA', label: 'WITA (UTC+8) — Waktu Indonesia Tengah' },
                    { value: 'WIT',  label: 'WIT (UTC+9) — Waktu Indonesia Timur'  },
                  ]}
                />
              </div>
            </Field>

            <Field label="Tema" hint="Tampilan antarmuka">
              <div className="flex items-center gap-2">
                {[
                  { value: 'light', label: 'Terang', icon: Sun  },
                  { value: 'dark',  label: 'Gelap',  icon: Moon },
                ].map(({ value, label, icon: Icon }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setTheme(value)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 text-xs font-medium rounded-xl border transition-all',
                      theme === value
                        ? 'border-[#1E4F91] bg-[#E8F0FB] text-[#1E4F91] font-semibold'
                        : 'border-[#E4E9F1] bg-white text-[#64748B] hover:text-[#0E1A2B]'
                    )}
                  >
                    <Icon size={13} />
                    {label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={handleSave}
                className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#1E4F91] text-white hover:bg-[#1a4580] transition-all shadow-sm"
              >
                Simpan Perubahan
              </button>
            </div>
          </Section>

          {/* About */}
          <Section
            title="Tentang Aplikasi"
            description="Informasi versi dan identitas sistem"
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-[#F5F7FB] border border-[#E4E9F1]">
                <Building2 size={32} className="text-[#1E4F91] shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-bold text-[#0E1A2B]">Smart DRG — Sistem Analisis Klaim BPJS</div>
                  <div className="text-xs text-[#64748B] mt-0.5">Casemix &amp; BPJS Unit</div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E4E9F1]">
                  <Tag size={14} className="text-[#64748B] shrink-0" />
                  <div>
                    <div className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Versi</div>
                    <div className="text-xs font-semibold text-[#0E1A2B] mt-0.5">v1.4.2</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E4E9F1]">
                  <Hash size={14} className="text-[#64748B] shrink-0" />
                  <div>
                    <div className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Build Hash</div>
                    <div className="font-mono text-[11px] font-semibold text-[#0E1A2B] mt-0.5">a3f2b1c9</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E4E9F1]">
                  <Info size={14} className="text-[#64748B] shrink-0" />
                  <div>
                    <div className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Lingkungan</div>
                    <div className="text-xs font-semibold text-[#0E1A2B] mt-0.5">Production</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 rounded-xl border border-[#E4E9F1]">
                  <Building2 size={14} className="text-[#64748B] shrink-0" />
                  <div>
                    <div className="text-[10px] text-[#94A3B8] uppercase tracking-wide">Rumah Sakit</div>
                    <div className="text-xs font-semibold text-[#0E1A2B] mt-0.5">—</div>
                  </div>
                </div>
              </div>
            </div>
          </Section>

          {/* Danger Zone */}
          <div className="bg-white border border-[#FBE6E3] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#FBE6E3] bg-[#FEF6F5]">
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} className="text-[#C8392E]" />
                <h2 className="text-sm font-semibold text-[#C8392E]">Zona Bahaya</h2>
              </div>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Tindakan di bawah ini bersifat permanen dan tidak dapat dibatalkan.
              </p>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-[#E4E9F1] bg-[#FAFBFD]">
                <div>
                  <div className="text-xs font-semibold text-[#0E1A2B]">Hapus Semua Import</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Menghapus seluruh data batch import beserta klaim dan hasil analisis.
                  </div>
                </div>
                <button
                  disabled
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-[#E4E9F1] text-[#94A3B8] bg-[#F5F7FB] cursor-not-allowed opacity-60 shrink-0"
                >
                  <Trash2 size={12} />
                  Hapus Semua Import
                </button>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl border border-[#E4E9F1] bg-[#FAFBFD]">
                <div>
                  <div className="text-xs font-semibold text-[#0E1A2B]">Reset Data Sistem</div>
                  <div className="text-[11px] text-[#64748B] mt-0.5">
                    Mengembalikan semua konfigurasi dan data ke kondisi awal instalasi.
                  </div>
                </div>
                <button
                  disabled
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl border border-[#E4E9F1] text-[#94A3B8] bg-[#F5F7FB] cursor-not-allowed opacity-60 shrink-0"
                >
                  <AlertTriangle size={12} />
                  Reset Data
                </button>
              </div>

              <p className="text-[11px] text-[#94A3B8] flex items-center gap-1.5">
                <Info size={11} />
                Tombol di atas dinonaktifkan untuk mencegah penghapusan data yang tidak disengaja.
                Hubungi administrator untuk tindakan ini.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── Tab: Profil RS ── */}
      {activeTab === 'profil' && <HospitalProfileTab />}
    </div>
  );
}
