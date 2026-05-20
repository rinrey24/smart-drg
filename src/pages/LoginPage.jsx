import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  Eye,
  EyeOff,
  BarChart2,
  ShieldCheck,
  TrendingUp,
  Building2,
  ChevronRight,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import BrandMark from '@/components/ui/BrandMark';

const STAT_CARDS = [
  { label: 'Klaim Terproses', value: '2.184.530', icon: BarChart2 },
  { label: 'Rata-rata Akurasi', value: '98,4%', icon: TrendingUp },
  { label: 'Potensi Selisih Dicegah', value: 'Rp 42,8 M', icon: ShieldCheck },
  { label: 'RS Terhubung', value: '137', icon: Building2 },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const { toast } = useApp();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Username dan password wajib diisi.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
      toast('Login berhasil. Selamat datang!', 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        'Username atau password salah. Silakan coba lagi.';
      setError(msg);
      toast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = () => {
    setUsername('andini.p');
    setPassword('smartdrg2026');
  };

  return (
    <div className="min-h-screen flex bg-[#F5F7FB]">
      {/* ── Left Panel (desktop only) ── */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[56%] flex-col relative overflow-hidden bg-gradient-to-br from-[#0E2D5C] via-[#1E4F91] to-[#1C6B5E]">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-white/5 blur-3xl" />
          <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full bg-[#2E9A5A]/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#1E78B8]/5 blur-3xl" />
        </div>

        <div className="relative flex flex-col flex-1 px-10 py-10 xl:px-14 xl:py-12">
          {/* Logo + Brand */}
          <div className="flex items-center gap-3">
            <div className="shadow-lg">
              <BrandMark size={44} />
            </div>
            <div>
              <div className="text-white text-lg font-bold leading-none">Smart Drg</div>
              <div className="text-blue-200 text-xs font-medium mt-0.5">Analisa & Pencegahan Klaim BPJS</div>
            </div>
          </div>

          {/* Tagline */}
          <div className="mt-12 xl:mt-16">
            <h1 className="text-white text-3xl xl:text-4xl font-bold leading-snug max-w-sm">
              Klaim BPJS yang lebih{' '}
              <span className="text-[#4FD1A0]">akurat</span>,{' '}
              <span className="text-[#60B8F4]">transparan</span>,{' '}
              dan{' '}
              <span className="text-[#F4C24F]">terkendali</span>.
            </h1>
            <p className="mt-4 text-blue-100/80 text-sm xl:text-base leading-relaxed max-w-xs">
              Platform analitik berbasis rule engine & AI untuk deteksi
              dini potensi fraud, upcoding, dan ketidaksesuaian koding
              klaim INA-CBG rumah sakit.
            </p>
          </div>

          {/* Stat Cards */}
          <div className="mt-10 xl:mt-12 grid grid-cols-2 gap-3">
            {STAT_CARDS.map(({ label, value, icon: Icon }) => (
              <div
                key={label}
                className="bg-white/8 backdrop-blur-sm border border-white/12 rounded-2xl p-4 flex flex-col gap-2"
              >
                <Icon size={16} className="text-[#4FD1A0]" />
                <div className="text-white font-bold text-lg leading-none">{value}</div>
                <div className="text-blue-100/70 text-xs">{label}</div>
              </div>
            ))}
          </div>

          {/* CTA decoration */}
          <div className="mt-8 flex items-center gap-2 text-blue-100/60 text-xs">
            <div className="flex -space-x-2">
              {['SM', 'DP', 'HK', 'AW'].map((i) => (
                <div
                  key={i}
                  className="w-7 h-7 rounded-full bg-gradient-to-br from-[#2E9A5A] to-[#1E78B8] border-2 border-[#1E4F91] flex items-center justify-center text-[9px] text-white font-bold"
                >
                  {i}
                </div>
              ))}
            </div>
            <span>137 rumah sakit mitra aktif</span>
            <ChevronRight size={12} />
          </div>

          {/* Footer */}
          <div className="mt-auto text-blue-200/40 text-xs">
            © 2026 Smart Drg • v2.4.1
          </div>
        </div>
      </div>

      {/* ── Right Panel (login form) ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 sm:px-10">
        {/* Mobile brand logo */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <div className="mb-2"><BrandMark size={56} /></div>
          <div className="text-[#0E1A2B] text-xl font-bold">Smart Drg</div>
          <div className="text-[#64748B] text-sm">Analisa & Pencegahan Klaim BPJS</div>
        </div>

        <div className="w-full max-w-[400px]">
          <h2 className="text-[#0E1A2B] text-2xl font-bold mb-1">Masuk ke Smart Drg</h2>
          <p className="text-[#64748B] text-sm mb-8">Gunakan akun yang diberikan oleh administrator RS.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-[#0E1A2B] mb-1.5">
                Username
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="username Anda"
                  className={cn(
                    'w-full pl-9 pr-4 py-2.5 rounded-xl border text-sm text-[#0E1A2B]',
                    'bg-white placeholder:text-[#94A3B8] outline-none',
                    'focus:ring-2 focus:ring-[#1E4F91]/20 focus:border-[#1E4F91]',
                    'transition-all duration-150',
                    error ? 'border-[#C8392E]' : 'border-[#E4E9F1]'
                  )}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-[#0E1A2B] mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#64748B]" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className={cn(
                    'w-full pl-9 pr-10 py-2.5 rounded-xl border text-sm text-[#0E1A2B]',
                    'bg-white placeholder:text-[#94A3B8] outline-none',
                    'focus:ring-2 focus:ring-[#1E4F91]/20 focus:border-[#1E4F91]',
                    'transition-all duration-150',
                    error ? 'border-[#C8392E]' : 'border-[#E4E9F1]'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0E1A2B] transition-colors"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <p className="text-[#C8392E] text-xs font-medium flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C8392E] inline-block" />
                {error}
              </p>
            )}

            {/* Remember me + Lupa password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-[#64748B] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="w-4 h-4 rounded border-[#E4E9F1] accent-[#1E4F91] cursor-pointer"
                />
                Ingat saya
              </label>
              <a
                href="#"
                className="text-sm text-[#1E4F91] font-medium hover:underline"
              >
                Lupa password?
              </a>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={cn(
                'w-full py-2.5 rounded-xl text-white text-sm font-semibold',
                'bg-[#1E4F91] hover:bg-[#1a4580] active:bg-[#163a70]',
                'transition-all duration-150 shadow-sm',
                'flex items-center justify-center gap-2',
                loading && 'opacity-70 cursor-not-allowed'
              )}
            >
              {loading ? (
                <>
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Memverifikasi…
                </>
              ) : (
                'Masuk'
              )}
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 rounded-xl border border-[#E4E9F1] bg-[#FAFBFD] p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-[#64748B] uppercase tracking-wide">Demo Credentials</p>
              <button
                type="button"
                onClick={fillDemo}
                className="text-xs text-[#1E4F91] font-medium hover:underline"
              >
                Isi otomatis
              </button>
            </div>
            <div className="flex flex-col gap-1 font-mono text-xs text-[#0E1A2B]">
              <div className="flex gap-2">
                <span className="text-[#64748B] w-20">Username</span>
                <span className="font-semibold">andini.p</span>
              </div>
              <div className="flex gap-2">
                <span className="text-[#64748B] w-20">Password</span>
                <span className="font-semibold">smartdrg2026</span>
              </div>
            </div>
          </div>

          {/* Security note */}
          <p className="mt-5 text-center text-xs text-[#94A3B8] flex items-center justify-center gap-1.5">
            <ShieldCheck size={12} className="text-[#2E9A5A]" />
            Akses dilindungi dengan JWT &amp; SSO Rumah Sakit.
          </p>
        </div>
      </div>
    </div>
  );
}
