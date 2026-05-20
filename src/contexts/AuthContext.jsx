import { createContext, useContext, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as apiLogin, api } from '@/lib/api';

const AuthContext = createContext(null);

// Decode JWT payload tanpa library eksternal
function decodeJwt(token) {
  try {
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(base64));
  } catch {
    return null;
  }
}

function loadFromStorage() {
  try {
    const token = localStorage.getItem('token') ?? null;
    const raw = localStorage.getItem('user');
    const user = raw ? JSON.parse(raw) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const initial = loadFromStorage();

  const [token, setToken] = useState(initial.token);
  const [user, setUser] = useState(initial.user);

  const login = useCallback(async (username, password) => {
    let newToken, newUser;

    // 1. Login → { success, message, data: { access_token }, meta }
    const res = await apiLogin(username, password);
    newToken = res.data?.data?.access_token ?? res.data?.access_token;

    if (!newToken) throw new Error('Token tidak diterima dari server');

    // 2. Simpan token dulu supaya request berikutnya bisa pakai auth
    localStorage.setItem('token', newToken);

    // 3. Decode JWT: { sub: userId, username, role }
    const decoded = decodeJwt(newToken);

    // 4. Fetch profil lengkap user (nama, dsb)
    try {
      const userRes = await api.get(`/users/username/${decoded?.username ?? username}`);
      const userData = userRes.data?.data ?? userRes.data;
      newUser = {
        id:        userData.id,
        username:  userData.username,
        name:      userData.name ?? userData.username,
        role:      userData.role,
        is_active: userData.is_active,
      };
    } catch {
      // Fallback ke data dari JWT jika endpoint user gagal
      newUser = {
        id:       decoded?.sub,
        username: decoded?.username ?? username,
        name:     decoded?.username ?? username,
        role:     decoded?.role ?? 'Staff',
      };
    }

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
    return newUser;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    navigate('/login', { replace: true });
  }, [navigate]);

  const value = {
    user,
    token,
    login,
    logout,
    isAuthenticated: Boolean(token),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}

export default AuthContext;
