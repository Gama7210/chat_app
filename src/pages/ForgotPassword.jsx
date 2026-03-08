import { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('');
  const [error,   setError]   = useState(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data || { message: 'Error', solution: 'Intenta de nuevo' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      <div className="bg-scene" /><div className="orb orb-1" /><div className="orb orb-2" />

      <motion.div
        initial={{ opacity:0, y:32, scale:.96 }}
        animate={{ opacity:1, y:0,  scale:1   }}
        transition={{ duration:.5, ease:[.22,1,.36,1] }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale:0 }} animate={{ scale:1 }}
            transition={{ delay:.1, type:'spring', stiffness:200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-5"
            style={{ background:'linear-gradient(135deg,#7c3aed,#a855f7)', boxShadow:'0 0 40px rgba(124,58,237,.5)' }}
          >
            <span className="text-4xl">🔄</span>
          </motion.div>

          <motion.h1
            initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay:.2 }}
            className="text-4xl font-bold text-glow" style={{ color:'#ede9fe', letterSpacing:'-1px' }}
          >Recuperar Acceso</motion.h1>

          <motion.p
            initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:.3 }}
            className="mt-2 text-sm" style={{ color:'var(--muted)' }}
          >Te enviaremos una nueva contraseña por correo</motion.p>
        </div>

        <motion.div
          initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} transition={{ delay:.25 }}
          className="card"
        >
          <AnimatePresence mode="wait">
            {success ? (
              <motion.div
                key="success"
                initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
                className="text-center py-6"
              >
                <motion.div
                  initial={{ scale:0 }} animate={{ scale:1 }}
                  transition={{ type:'spring', stiffness:200 }}
                  className="text-6xl mb-4"
                >📬</motion.div>
                <p className="font-bold text-lg mb-2" style={{ color:'#4ade80' }}>¡Correo enviado!</p>
                <p className="text-sm" style={{ color:'var(--muted)' }}>
                  Si el correo está registrado, recibirás tu nueva contraseña en unos minutos.
                </p>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="space-y-5"
                initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
              >
                <motion.div initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:.3 }}>
                  <label className="block text-xs font-semibold mb-2 uppercase tracking-widest" style={{ color:'var(--muted)' }}>
                    Correo electrónico
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-base pointer-events-none">📧</span>
                    <input
                      type="email" value={email} onChange={e => setEmail(e.target.value)}
                      className="input-field pl-9" placeholder="tu@correo.com" required
                    />
                  </div>
                </motion.div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity:0, y:-8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
                      className="rounded-xl p-3 text-sm"
                      style={{ background:'rgba(244,63,94,.12)', border:'1px solid rgba(244,63,94,.3)', color:'#fb7185' }}
                    >
                      ⚠️ {error.message}
                    </motion.div>
                  )}
                </AnimatePresence>

                <button type="submit" className="btn-primary w-full py-3 text-base" disabled={loading}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span style={{ width:16,height:16,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }} />
                      Enviando...
                    </span>
                  ) : 'Enviar nueva contraseña'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-5 pt-5 text-center" style={{ borderTop:'1px solid var(--border)' }}>
            <Link to="/login" className="text-sm transition-colors hover:text-purple-400" style={{ color:'var(--muted)' }}>
              ← Volver al login
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}