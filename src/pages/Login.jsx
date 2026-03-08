import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form,    setForm]    = useState({ email: '', password: '' });
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPw,  setShowPw]  = useState(false);
  const { login } = useAuth();
  const navigate  = useNavigate();
  const errorTimer = useRef(null);
  const formRef = useRef(null);

  // Auto-desaparecer error a los 5 segundos
  useEffect(() => {
    if (error) {
      clearTimeout(errorTimer.current);
      errorTimer.current = setTimeout(() => setError(null), 5000);
    }
    return () => clearTimeout(errorTimer.current);
  }, [error]);

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevenir recarga
    e.stopPropagation(); // Detener propagación del evento
    
    setError(null);
    setLoading(true);
    
    try {
      await login(form.email, form.password);
      navigate('/dashboard');
    } catch (err) {
      console.log('Error capturado:', err); // Para debugging
      
      const errData = err.response?.data;
      const status  = err.response?.status;

      // Mensaje específico según el tipo de error
      if (status === 429) {
        setError({
          message:  '⏳ Demasiados intentos',
          solution: 'Espera unos minutos antes de intentar de nuevo',
          type: 'warning'
        });
      } else if (status === 401) {
        setError({
          message:  '🔐 Correo o contraseña incorrectos',
          solution: errData?.solution || 'Verifica tus datos e intenta de nuevo',
          type: 'error'
        });
      } else if (status === 400) {
        setError({
          message:  '⚠️ Datos incompletos',
          solution: errData?.message || 'Asegúrate de llenar correo y contraseña',
          type: 'error'
        });
      } else {
        setError({
          message:  '📡 Error de conexión',
          solution: 'Verifica tu conexión a internet',
          type: 'error'
        });
      }
    } finally {
      setLoading(false);
    }
  };

  // Manejar submit con enter también
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading) {
      handleSubmit(e);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-scene" />
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />

      <motion.div
        initial={{ opacity:0, y:32, scale:.96 }}
        animate={{ opacity:1, y:0,  scale:1   }}
        transition={{ duration:.5, ease:[.22,1,.36,1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale:0, rotate:-20 }}
            animate={{ scale:1, rotate:0   }}
            transition={{ delay:.1, type:'spring', stiffness:200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5 relative"
            style={{
              background:'linear-gradient(135deg,#7c3aed,#a855f7)',
              boxShadow:'0 0 40px rgba(124,58,237,.5), 0 0 80px rgba(124,58,237,.2)',
            }}
          >
            <span className="text-4xl">👨🏼‍💻💬</span>
            <span className="absolute inset-0 rounded-2xl border-2 border-purple-400/30 animate-ping"
              style={{ animationDuration:'2.5s' }} />
          </motion.div>

          <motion.h1
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.2 }}
            className="text-4xl font-bold text-glow"
            style={{ color:'#ede9fe', letterSpacing:'-1px' }}
          >🤳🏼Chatea con tus amigos👥</motion.h1>

          <motion.p
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.3 }}
            className="mt-2 text-sm" style={{ color:'var(--muted)' }}
          >Inicia sesión para continuar</motion.p>

          <motion.div
            initial={{ scaleX:0 }} animate={{ scaleX:1 }} transition={{ delay:.4, duration:.6 }}
            className="accent-line mt-4 mx-auto w-24"
          />
        </div>

        {/* Card */}
        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.25 }}
          className="card"
        >
          <form 
            ref={formRef}
            onSubmit={handleSubmit} 
            onKeyPress={handleKeyPress}
            className="space-y-5"
          >

            {/* Email */}
            <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:.3 }}>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-widest"
                style={{ color:'var(--muted)' }}>Correo electrónico</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">📧</span>
                <input
                  type="email" 
                  value={form.email} 
                  autoComplete="email" 
                  required
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className={`input-field pl-9 ${error?.type === 'error' ? 'border-red-500/50' : ''}`}
                  placeholder="Ingresa un correo válido"
                  disabled={loading}
                />
              </div>
            </motion.div>

            {/* Contraseña */}
            <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:.38 }}>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-widest"
                style={{ color:'var(--muted)' }}>Contraseña</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">🔑</span>
                <input
                  type={showPw ? 'text' : 'password'} 
                  value={form.password}
                  autoComplete="current-password" 
                  required
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={`input-field pl-9 pr-11 ${error?.type === 'error' ? 'border-red-500/50' : ''}`}
                  placeholder="••••••••"
                  disabled={loading}
                />
                <button type="button" onClick={() => setShowPw(p => !p)} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                  style={{ color:'var(--muted)', background:'none', border:'none', cursor:'pointer' }}
                  disabled={loading}
                >{showPw ? '🙈' : '👁️'}</button>
              </div>
            </motion.div>

            {/* Error con barra de progreso de 5s */}
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error-message"
                  initial={{ opacity:0, y:-10, scale:0.95 }}
                  animate={{ opacity:1, y:0, scale:1 }}
                  exit={{ opacity:0, y:-5, scale:0.95 }}
                  transition={{ duration:0.2 }}
                  className="rounded-xl overflow-hidden border border-red-500/30 bg-red-500/10"
                >
                  <div className="p-3">
                    <p className="text-red-400 font-semibold text-sm">
                      {error.message}
                    </p>
                    {error.solution && (
                      <p className="text-red-300/90 text-xs mt-1">
                        💡 {error.solution}
                      </p>
                    )}
                  </div>
                  {/* Barra de progreso que se vacía en 5s */}
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: '0%' }}
                    transition={{ duration: 5, ease: 'linear' }}
                    className="h-0.5 bg-gradient-to-r from-red-500 to-red-400"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón enviar */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.45 }}>
              <button 
                type="submit" 
                className="btn-primary w-full py-3 text-base" 
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Iniciando sesión...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    Iniciar Sesión <span>→</span>
                  </span>
                )}
              </button>
            </motion.div>
          </form>

          {/* Links */}
          <motion.div
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.5 }}
            className="mt-6 pt-5 flex flex-col items-center gap-2 text-sm"
            style={{ borderTop:'1px solid var(--border)' }}
          >
            <Link to="/forgot-password" className="transition-colors hover:text-purple-400"
              style={{ color:'var(--muted)' }}>
              ¿Olvidaste tu contraseña?
            </Link>
            <p style={{ color:'var(--muted)' }}>
              ¿Sin cuenta?{' '}
              <Link to="/register" className="font-semibold transition-colors hover:text-purple-300"
                style={{ color:'var(--accent2,#a855f7)' }}>
                Regístrate aquí
              </Link>
            </p>
          </motion.div>
        </motion.div>

        <motion.p
          initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.6 }}
          className="text-center text-xs mt-5 flex items-center justify-center gap-1.5"
          style={{ color:'var(--muted)' }}
        >
          <span>🔒</span> Cifrado extremo a extremo con AES-256
        </motion.p>
      </motion.div>
    </div>
  );
}