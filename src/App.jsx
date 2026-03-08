import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Login         from './pages/Login';
import Register      from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import Dashboard     from './pages/Dashboard';

// ── Loader inicial ────────────────────────────────────────────
function FullLoader() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ background:'var(--bg)' }}>
      <div className="relative">
        <div style={{
          width:48, height:48,
          borderRadius:'50%',
          border:'3px solid rgba(124,58,237,.2)',
          borderTopColor:'var(--accent)',
          animation:'spin .8s linear infinite',
        }} />
        <div style={{
          position:'absolute', inset:6,
          borderRadius:'50%',
          border:'2px solid rgba(168,85,247,.2)',
          borderBottomColor:'var(--accent2)',
          animation:'spin 1.2s linear infinite reverse',
        }} />
      </div>
      <p className="text-sm font-medium" style={{ color:'var(--muted)' }}>Cargando...</p>
    </div>
  );
}

// ── Modal de advertencia de inactividad ───────────────────────
function InactivityWarning() {
  const { showWarning, warnSecs, extendSession, logout } = useAuth();

  const mins = Math.floor(warnSecs / 60);
  const secs = warnSecs % 60;
  const pct  = (warnSecs / 120) * 100;

  return (
    <AnimatePresence>
      {showWarning && (
        <motion.div
          initial={{ opacity:0 }}
          animate={{ opacity:1 }}
          exit={{ opacity:0 }}
          className="fixed inset-0 z-[999] flex items-center justify-center p-4"
          style={{ background:'rgba(0,0,0,.7)', backdropFilter:'blur(8px)' }}
        >
          <motion.div
            initial={{ scale:.85, opacity:0, y:20 }}
            animate={{ scale:1,   opacity:1, y:0  }}
            exit={{ scale:.9, opacity:0 }}
            transition={{ type:'spring', damping:20 }}
            className="card max-w-sm w-full text-center"
          >
            {/* Ícono animado */}
            <motion.div
              animate={{ rotate:[0,-10,10,-10,10,0] }}
              transition={{ delay:.3, duration:.6 }}
              className="text-5xl mb-4"
            >⏰</motion.div>

            <h3 className="text-xl font-bold mb-2" style={{ color:'var(--text)' }}>
              ¿Sigues ahí?
            </h3>
            <p className="text-sm mb-5" style={{ color:'var(--muted)' }}>
              Tu sesión se cerrará por inactividad en:
            </p>

            {/* Countdown */}
            <div className="mb-5">
              <p className="text-4xl font-bold font-mono mb-3"
                style={{ color: warnSecs <= 30 ? '#f43f5e' : '#a855f7' }}
              >
                {mins}:{secs.toString().padStart(2,'0')}
              </p>
              {/* Barra de progreso */}
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(255,255,255,.06)' }}>
                <motion.div
                  className="h-full rounded-full"
                  style={{
                    width:`${pct}%`,
                    background: warnSecs <= 30
                      ? 'linear-gradient(90deg,#f43f5e,#fb7185)'
                      : 'linear-gradient(90deg,var(--accent),var(--accent2))',
                    transition:'width 1s linear, background .3s',
                  }}
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={logout}
                className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all"
                style={{ border:'1px solid var(--border)', color:'var(--muted)' }}
                onMouseEnter={e => e.target.style.color='#f87171'}
                onMouseLeave={e => e.target.style.color='var(--muted)'}
              >
                Cerrar sesión
              </button>
              <button
                onClick={extendSession}
                className="btn-primary flex-1 py-2.5"
              >
                Seguir conectado
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ── Rutas protegidas ──────────────────────────────────────────
function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullLoader />;
  return user ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <FullLoader />;
  return user ? <Navigate to="/dashboard" replace /> : children;
}

// ── App ───────────────────────────────────────────────────────
export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <InactivityWarning />
        <BrowserRouter>
          <Routes>
            <Route path="/"                element={<Navigate to="/login" replace />} />
            <Route path="/login"           element={<PublicRoute><Login /></PublicRoute>} />
            <Route path="/register"        element={<PublicRoute><Register /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
            <Route path="/dashboard"       element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="*"                element={<Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}