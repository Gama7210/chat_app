import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

export default function Register() {
  const [form,    setForm]    = useState({ username: '', email: '' });
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/register', form);
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data || { message: 'Error al registrar', solution: 'Intenta de nuevo' });
    } finally {
      setLoading(false);
    }
  };

  // ── Pantalla de éxito ──────────────────────────────────────
  if (success) return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-scene" /><div className="orb orb-1" /><div className="orb orb-2" />

      <motion.div
        initial={{ opacity:0, scale:.85 }}
        animate={{ opacity:1, scale:1   }}
        transition={{ type:'spring', stiffness:180 }}
        className="card max-w-sm w-full text-center relative z-10"
      >
        <motion.div
          initial={{ scale:0 }} animate={{ scale:1 }}
          transition={{ delay:.2, type:'spring', stiffness:200 }}
          className="text-7xl mb-5"
        >📧</motion.div>

        <h2 className="text-2xl font-bold mb-3" style={{ color:'var(--text)' }}>¡Cuenta creada!</h2>
        <p className="text-sm mb-1" style={{ color:'var(--muted)' }}>
          Revisa tu correo electrónico.
        </p>
        <p className="text-sm mb-7" style={{ color:'var(--muted)' }}>
          Te enviamos tu contraseña de acceso generada automáticamente.
        </p>

        <div className="accent-line mb-7" />

        <motion.div whileTap={{ scale:.97 }}>
          <Link to="/login" className="btn-primary block py-3 text-center">
            Ir al Login →
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-scene" /><div className="orb orb-1" /><div className="orb orb-2" /><div className="orb orb-3" />

      <motion.div
        initial={{ opacity:0, y:32, scale:.96 }}
        animate={{ opacity:1, y:0,  scale:1   }}
        transition={{ duration:.5, ease:[.22,1,.36,1] }}
        className="w-full max-w-md relative z-10"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale:0, rotate:20 }} animate={{ scale:1, rotate:0 }}
            transition={{ delay:.1, type:'spring', stiffness:200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5"
            style={{ background:'linear-gradient(135deg,#7c3aed,#06b6d4)', boxShadow:'0 0 40px rgba(124,58,237,.5)' }}
          >
            <span className="text-4xl">🚀</span>
          </motion.div>

          <motion.h1
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.2 }}
            className="text-4xl font-bold text-glow" style={{ color:'#ede9fe', letterSpacing:'-1px' }}
          >Crear Cuenta</motion.h1>

          <motion.p
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.3 }}
            className="mt-2 text-sm" style={{ color:'var(--muted)' }}
          >Recibirás tu contraseña por correo electrónico</motion.p>

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
          <form onSubmit={handleSubmit} className="space-y-5">

            {/* Username */}
            <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:.3 }}>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color:'var(--muted)' }}>
                Nombre de usuario
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">👤</span>
                <input
                  type="text"
                  value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className="input-field pl-9"
                  placeholder="Ingresa Nombre Completo"
                  required minLength={3} maxLength={30}
                />
              </div>
            </motion.div>

            {/* Email */}
            <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:.38 }}>
              <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color:'var(--muted)' }}>
                Correo electrónico
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none select-none">📧</span>
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  className="input-field pl-9"
                  placeholder="Ingresa un correo electrónico válido"
                  required
                />
              </div>
            </motion.div>

            {/* Info badge */}
            <motion.div
              initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.44 }}
              className="rounded-xl p-3 text-sm flex gap-2 items-start"
              style={{ background:'rgba(6,182,212,.08)', border:'1px solid rgba(6,182,212,.2)', color:'#67e8f9' }}
            >
              <span className="text-base shrink-0">ℹ️</span>
              <span>Se generará una contraseña segura automáticamente y se enviará a tu correo.</span>
            </motion.div>

            {/* Error */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                  className="rounded-xl p-3 text-sm"
                  style={{ background:'rgba(244,63,94,.12)', border:'1px solid rgba(244,63,94,.3)' }}
                >
                  <p className="font-semibold" style={{ color:'#fb7185' }}>⚠️ {error.message}</p>
                  {error.solution && <p className="mt-0.5 text-xs" style={{ color:'#f87171' }}>💡 {error.solution}</p>}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Botón */}
            <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.5 }}>
              <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }} />
                    Creando cuenta...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">Crear Cuenta <span>🚀</span></span>
                )}
              </button>
            </motion.div>
          </form>

          <motion.p
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.55 }}
            className="mt-6 pt-5 text-center text-sm"
            style={{ borderTop:'1px solid var(--border)', color:'var(--muted)' }}
          >
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" className="font-semibold transition-colors hover:text-purple-300" style={{ color:'var(--accent2)' }}>
              Inicia sesión
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}