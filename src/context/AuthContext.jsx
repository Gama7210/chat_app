import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

const INACTIVE_MS = 15 * 60 * 1000; // 15 min
const WARN_MS     =  2 * 60 * 1000; //  2 min de aviso antes

export function AuthProvider({ children }) {
  const [user,        setUser]        = useState(null);
  const [loading,     setLoading]     = useState(true);
  const [token,       setToken]       = useState(() => localStorage.getItem('token') || null);
  const [showWarning, setShowWarning] = useState(false);
  const [warnSecs,    setWarnSecs]    = useState(120);

  const inactiveRef  = useRef(null);
  const warnRef      = useRef(null);
  const countRef     = useRef(null);

  // ── Verificar token al abrir ─────────────────────────────────
  useEffect(() => {
    // Primero revisar si ya expiró por tiempo
    const saved = parseInt(localStorage.getItem('lastActivity') || '0');
    if (saved && Date.now() - saved >= INACTIVE_MS) {
      // Sesión expirada mientras el navegador estaba cerrado
      localStorage.removeItem('token');
      localStorage.removeItem('lastActivity');
      setToken(null);
      setLoading(false);
      return;
    }

    if (!token) { setLoading(false); return; }
    api.get('/auth/me')
       .then(r => setUser(r.data.user))
       .catch(() => { setUser(null); setToken(null); localStorage.removeItem('token'); })
       .finally(() => setLoading(false));
  }, []);

  // ── Logout ────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    clearTimeout(inactiveRef.current);
    clearTimeout(warnRef.current);
    clearInterval(countRef.current);
    setShowWarning(false);
    await api.post('/auth/logout').catch(() => {});
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('lastActivity');
  }, []);

  // ── Reiniciar timers ──────────────────────────────────────────
  const resetTimers = useCallback(() => {
    if (!user) return;
    clearTimeout(inactiveRef.current);
    clearTimeout(warnRef.current);
    clearInterval(countRef.current);
    setShowWarning(false);
    localStorage.setItem('lastActivity', Date.now().toString());

    // Mostrar aviso 2 min antes
    warnRef.current = setTimeout(() => {
      setShowWarning(true);
      setWarnSecs(120);
      countRef.current = setInterval(() =>
        setWarnSecs(s => (s <= 1 ? (clearInterval(countRef.current), 0) : s - 1)), 1000
      );
    }, INACTIVE_MS - WARN_MS);

    // Cerrar sesión
    inactiveRef.current = setTimeout(logout, INACTIVE_MS);
  }, [user, logout]);

  // ── Escuchar actividad ────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    const events = ['mousedown', 'mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    const onActivity = () => resetTimers();
    events.forEach(e => window.addEventListener(e, onActivity, { passive: true }));
    resetTimers();
    return () => {
      events.forEach(e => window.removeEventListener(e, onActivity));
      clearTimeout(inactiveRef.current);
      clearTimeout(warnRef.current);
      clearInterval(countRef.current);
    };
  }, [user, resetTimers]);

  // ── Verificar al volver a la pestaña ──────────────────────────
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState !== 'visible' || !user) return;
      const saved = parseInt(localStorage.getItem('lastActivity') || '0');
      if (saved && Date.now() - saved >= INACTIVE_MS) logout();
      else resetTimers();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [user, logout, resetTimers]);

  // ── Login ─────────────────────────────────────────────────────
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
    localStorage.setItem('lastActivity', Date.now().toString());
    return data;
  };

  const extendSession = () => {
    setShowWarning(false);
    clearInterval(countRef.current);
    resetTimers();
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, logout, setUser, showWarning, warnSecs, extendSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);