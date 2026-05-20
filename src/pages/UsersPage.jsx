import { useState, useEffect, useCallback } from 'react';
import {
  UserPlus,
  Search,
  Edit2,
  UserX,
  Users,
  UserCheck,
  UserMinus,
  X,
  ChevronDown,
  Eye,
  EyeOff,
  Loader2,
} from 'lucide-react';
import { cn, formatNumber, initials } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';
import { getUsers, createUser, updateUser } from '@/lib/api';
import Button from '@/components/ui/Button';
import Pagination from '@/components/ui/Pagination';


const ROLES = ['Admin', 'Analis Klaim', 'Coder', 'Verifikator', 'DPJP'];
const DEPARTMENTS = ['Casemix', 'BPJS', 'Bedah', 'IT', 'Manajemen', 'Lainnya'];

// ── Styles ────────────────────────────────────────────────────────────────────
const ROLE_COLORS = {
  'Admin':        'bg-[#E8F0FB] text-[#1E4F91]',
  'Analis Klaim': 'bg-[#FDF1DD] text-[#C97A12]',
  'Coder':        'bg-[#E4F4EB] text-[#2E9A5A]',
  'Verifikator':  'bg-[#E1F0FA] text-[#1E78B8]',
  'DPJP':         'bg-[#F3EEF9] text-[#7C3AED]',
};

const AVATAR_COLORS = [
  'bg-[#E8F0FB] text-[#1E4F91]',
  'bg-[#E4F4EB] text-[#2E9A5A]',
  'bg-[#FDF1DD] text-[#C97A12]',
  'bg-[#E1F0FA] text-[#1E78B8]',
  'bg-[#F3EEF9] text-[#7C3AED]',
  'bg-[#FBE6E3] text-[#C8392E]',
];

// ── Sub-components ────────────────────────────────────────────────────────────
function Avatar({ name, index }) {
  return (
    <div className={cn(
      'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
      AVATAR_COLORS[index % AVATAR_COLORS.length]
    )}>
      {initials(name)}
    </div>
  );
}

function RoleBadge({ role }) {
  const cls = ROLE_COLORS[role] ?? 'bg-[#E4E9F1] text-[#64748B]';
  return (
    <span className={cn('inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold', cls)}>
      {role}
    </span>
  );
}

function StatusPill({ status }) {
  const isActive = status === 'active';
  return (
    <span className={cn(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold',
      isActive ? 'bg-[#E4F4EB] text-[#2E9A5A]' : 'bg-[#E4E9F1] text-[#64748B]'
    )}>
      <span className={cn('w-1.5 h-1.5 rounded-full', isActive ? 'bg-[#2E9A5A]' : 'bg-[#94A3B8]')} />
      {isActive ? 'Aktif' : 'Nonaktif'}
    </span>
  );
}

function StatCard({ icon: Icon, iconBg, label, value }) {
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

// ── User Modal ────────────────────────────────────────────────────────────────
function UserModal({ user, onClose, onSave }) {
  const isEdit = !!user;
  const [form, setForm] = useState(
    user
      ? { name: user.name, username: user.username, role: user.role, department: user.department, status: user.status, password: '' }
      : { name: '', username: '', role: 'Coder', department: 'Casemix', status: 'active', password: '' }
  );
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!form.name.trim()) errs.name = 'Nama wajib diisi';
    if (!form.username.trim()) errs.username = 'Username wajib diisi';
    if (!isEdit && !form.password.trim()) errs.password = 'Password wajib diisi saat membuat akun baru';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E4E9F1] sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-sm font-bold text-[#0E1A2B]">{isEdit ? 'Edit Pengguna' : 'Tambah Pengguna Baru'}</h2>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {isEdit ? `Mengedit akun ${user.username}` : 'Buat akun baru untuk sistem'}
            </p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-[#64748B] hover:bg-[#E4E9F1] transition-colors">
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[#0E1A2B] mb-1.5">Nama Lengkap</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              placeholder="dr. Andini Pratiwi"
              className={cn(
                'w-full px-3 py-2 text-xs rounded-lg border bg-white text-[#0E1A2B] outline-none transition-all placeholder:text-[#94A3B8]',
                errors.name ? 'border-[#C8392E]' : 'border-[#E4E9F1] focus:border-[#1E4F91]/50'
              )}
            />
            {errors.name && <p className="text-[11px] text-[#C8392E] mt-1">{errors.name}</p>}
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-[#0E1A2B] mb-1.5">Username</label>
            <input
              type="text"
              value={form.username}
              onChange={(e) => set('username', e.target.value)}
              placeholder="andini.p"
              readOnly={isEdit}
              className={cn(
                'w-full px-3 py-2 text-xs rounded-lg border bg-white text-[#0E1A2B] outline-none transition-all placeholder:text-[#94A3B8] font-mono',
                isEdit ? 'bg-[#F5F7FB] cursor-not-allowed opacity-70 border-[#E4E9F1]' : '',
                errors.username ? 'border-[#C8392E]' : 'border-[#E4E9F1] focus:border-[#1E4F91]/50'
              )}
            />
            {isEdit && <p className="text-[10px] text-[#94A3B8] mt-0.5">Username tidak dapat diubah</p>}
            {errors.username && <p className="text-[11px] text-[#C8392E] mt-1">{errors.username}</p>}
          </div>

          {/* Password */}
          <div>
            <label className="block text-xs font-semibold text-[#0E1A2B] mb-1.5">
              Password {isEdit && <span className="font-normal text-[#94A3B8]">(kosongkan jika tidak diganti)</span>}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={form.password}
                onChange={(e) => set('password', e.target.value)}
                placeholder={isEdit ? '••••••••' : 'Minimal 8 karakter'}
                className={cn(
                  'w-full pl-3 pr-10 py-2 text-xs rounded-lg border bg-white text-[#0E1A2B] outline-none transition-all placeholder:text-[#94A3B8]',
                  errors.password ? 'border-[#C8392E]' : 'border-[#E4E9F1] focus:border-[#1E4F91]/50'
                )}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#64748B] hover:text-[#0E1A2B] transition-colors"
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {errors.password && <p className="text-[11px] text-[#C8392E] mt-1">{errors.password}</p>}
          </div>

          {/* Role + Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#0E1A2B] mb-1.5">Role</label>
              <div className="relative">
                <select
                  value={form.role}
                  onChange={(e) => set('role', e.target.value)}
                  className="appearance-none w-full pl-3 pr-7 py-2 text-xs rounded-lg border border-[#E4E9F1] bg-white text-[#0E1A2B] outline-none focus:border-[#1E4F91]/50 cursor-pointer"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#0E1A2B] mb-1.5">Departemen</label>
              <div className="relative">
                <select
                  value={form.department}
                  onChange={(e) => set('department', e.target.value)}
                  className="appearance-none w-full pl-3 pr-7 py-2 text-xs rounded-lg border border-[#E4E9F1] bg-white text-[#0E1A2B] outline-none focus:border-[#1E4F91]/50 cursor-pointer"
                >
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#64748B] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-semibold text-[#0E1A2B] mb-1.5">Status</label>
            <div className="flex gap-2">
              {[{ value: 'active', label: 'Aktif' }, { value: 'inactive', label: 'Nonaktif' }].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => set('status', opt.value)}
                  className={cn(
                    'flex-1 py-2 text-xs font-semibold rounded-lg border transition-all',
                    form.status === opt.value
                      ? opt.value === 'active'
                        ? 'bg-[#E4F4EB] border-[#2E9A5A] text-[#2E9A5A]'
                        : 'bg-[#E4E9F1] border-[#94A3B8] text-[#64748B]'
                      : 'border-[#E4E9F1] text-[#94A3B8] hover:bg-[#F5F7FB]'
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 pt-1">
            <Button type="button" variant="outline" size="md" className="flex-1" onClick={onClose}>Batal</Button>
            <Button type="submit" size="md" className="flex-1">{isEdit ? 'Simpan Perubahan' : 'Tambah Pengguna'}</Button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Normalise user dari backend: { id, username, name, role, is_active }
// ke format frontend: { id, username, name, role, status: 'active'/'inactive' }
function normalizeUser(u) {
  return {
    ...u,
    status: u.is_active !== false ? 'active' : 'inactive',
    department: u.department ?? '—',
    last_active: u.updated_at ?? u.created_at ?? null,
  };
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const { toast } = useApp();

  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [page, setPage]         = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [showModal, setShowModal]   = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  // ─── Fetch users dari API ───────────────────────────────────────────────────
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getUsers({ page: 1, limit: 200 });
      const raw = res.data?.data ?? res.data ?? [];
      const list = Array.isArray(raw) ? raw.map(normalizeUser) : [];
      setUsers(list);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const totalUsers    = users.length;
  const activeUsers   = users.filter((u) => u.status === 'active').length;
  const inactiveUsers = users.filter((u) => u.status === 'inactive').length;

  const filtered = search
    ? users.filter((u) =>
        (u.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (u.username ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (u.role ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (u.department ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : users;

  // Reset page when search/data changes
  useEffect(() => { setPage(1); }, [search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const paginated  = filtered.slice((page - 1) * pageSize, page * pageSize);

  const handleToggleStatus = async (user) => {
    const nextActive = user.status !== 'active';
    // Optimistic update
    setUsers((prev) => prev.map((u) =>
      u.id === user.id ? { ...u, status: nextActive ? 'active' : 'inactive', is_active: nextActive } : u
    ));
    try {
      await updateUser(user.id, { is_active: nextActive });
      toast(`Akun "${user.name}" ${nextActive ? 'diaktifkan' : 'dinonaktifkan'}.`, 'success');
    } catch {
      // Rollback
      setUsers((prev) => prev.map((u) =>
        u.id === user.id ? { ...u, status: user.status, is_active: !nextActive } : u
      ));
      toast('Gagal mengubah status pengguna.', 'error');
    }
  };

  const openCreate = () => { setEditingUser(null); setShowModal(true); };
  const openEdit   = (user) => { setEditingUser(user); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingUser(null); };

  const handleSave = async (form) => {
    try {
      if (editingUser) {
        // PUT /users/:id — backend: { name, role, is_active }
        const payload = {
          name:      form.name,
          role:      form.role,
          is_active: form.status === 'active',
          ...(form.password?.trim() ? { password: form.password } : {}),
        };
        const res = await updateUser(editingUser.id, payload);
        const updated = normalizeUser(res.data?.data ?? { ...editingUser, ...payload });
        setUsers((prev) => prev.map((u) => u.id === editingUser.id ? updated : u));
        toast(`Akun "${form.name}" berhasil diperbarui.`, 'success');
      } else {
        // POST /users — backend: { username, name, password, role }
        const payload = {
          username: form.username,
          name:     form.name,
          password: form.password,
          role:     form.role,
        };
        const res = await createUser(payload);
        const created = normalizeUser(res.data?.data ?? { ...payload, id: Date.now() });
        setUsers((prev) => [...prev, created]);
        toast(`Akun "${form.name}" berhasil dibuat.`, 'success');
      }
    } catch (err) {
      const msg = err?.response?.data?.message ?? 'Gagal menyimpan data pengguna.';
      toast(msg, 'error');
    }
    closeModal();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-[#0E1A2B]">Pengguna</h1>
          <p className="text-sm text-[#64748B] mt-0.5">Manajemen akun dan hak akses pengguna sistem</p>
        </div>
        <Button onClick={openCreate} icon={UserPlus}>Tambah Pengguna</Button>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={Users}      iconBg="bg-[#E8F0FB] text-[#1E4F91]" label="Total Pengguna" value={formatNumber(totalUsers)} />
        <StatCard icon={UserCheck}  iconBg="bg-[#E4F4EB] text-[#2E9A5A]" label="Aktif"          value={formatNumber(activeUsers)} />
        <StatCard icon={UserMinus}  iconBg="bg-[#E4E9F1] text-[#64748B]" label="Nonaktif"       value={formatNumber(inactiveUsers)} />
      </div>

      {/* ── Table card ── */}
      <div className="bg-white border border-[#E4E9F1] rounded-2xl shadow-sm overflow-hidden">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 px-5 py-3 border-b border-[#E4E9F1] bg-[#FAFBFD]">
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              placeholder="Cari nama, username, role, departemen…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E4E9F1] bg-white text-[#0E1A2B] placeholder:text-[#94A3B8] outline-none focus:border-[#1E4F91]/50 transition-all"
            />
          </div>
          <div className="ml-auto text-xs text-[#64748B]">{formatNumber(filtered.length)} pengguna ditemukan</div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E4E9F1] bg-[#FAFBFD] text-left">
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Nama</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Username</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Role</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Departemen</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Status</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B]">Terakhir Aktif</th>
                <th className="px-4 py-2.5 text-xs font-semibold text-[#64748B] text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-sm text-[#94A3B8]">
                    Tidak ada pengguna yang cocok dengan pencarian.
                  </td>
                </tr>
              ) : (
                paginated.map((user, i) => (
                  <tr key={user.id} className="border-b border-[#E4E9F1] hover:bg-[#F5F7FB] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar name={user.name} index={i} />
                        <div className="font-semibold text-xs text-[#0E1A2B]">{user.name}</div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-[#64748B]">{user.username}</td>
                    <td className="px-4 py-3"><RoleBadge role={user.role} /></td>
                    <td className="px-4 py-3 text-xs text-[#64748B]">{user.department}</td>
                    <td className="px-4 py-3"><StatusPill status={user.status} /></td>
                    <td className="px-4 py-3 text-xs text-[#94A3B8]">{user.last_active}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={() => openEdit(user)}
                          className="flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg border border-[#E4E9F1] text-[#1E4F91] hover:bg-[#E8F0FB] transition-all"
                        >
                          <Edit2 size={10} />
                          Edit
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={cn(
                            'flex items-center gap-1 px-2 py-1 text-[10px] font-semibold rounded-lg border transition-all',
                            user.status === 'active'
                              ? 'border-[#FBE6E3] text-[#C8392E] hover:bg-[#FBE6E3]'
                              : 'border-[#E4F4EB] text-[#2E9A5A] hover:bg-[#E4F4EB]'
                          )}
                        >
                          <UserX size={10} />
                          {user.status === 'active' ? 'Nonaktifkan' : 'Aktifkan'}
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

      {/* ── Modal ── */}
      {showModal && (
        <UserModal
          user={editingUser}
          onClose={closeModal}
          onSave={handleSave}
        />
      )}
    </div>
  );
}
