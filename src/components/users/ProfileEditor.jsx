import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { getSocket } from '../../services/socketService';
import api from '../../services/api';

export default function ProfileEditor({ onClose, onAvatarUpdated }) {
  const { user, setUser }       = useAuth();
  const [preview,  setPreview]  = useState(null);
  const [file,     setFile]     = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState(null);
  const [success,  setSuccess]  = useState(false);
  const [selfTs,   setSelfTs]   = useState(Date.now());
  const inputRef = useRef(null);

  // Escuchar el evento de actualización del propio avatar
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onUpdate = ({ userId, ts }) => {
      if (String(userId) === String(user?.id)) setSelfTs(ts || Date.now());
    };
    socket.on('avatar:updated', onUpdate);
    return () => socket.off('avatar:updated', onUpdate);
  }, [user?.id]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { setError('Solo se permiten imágenes'); return; }
    if (f.size > 5 * 1024 * 1024)    { setError('La imagen no puede superar 5 MB'); return; }
    setError(null);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const handleSave = async () => {
    if (!file) return;
    setSaving(true);
    setError(null);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const { data } = await api.post('/users/avatar', formData);
      // Actualizar estado global del usuario
      setUser(prev => ({ ...prev, avatarUpdated: data.ts }));
      setSelfTs(data.ts);
      // Notificar al Dashboard para que también refresque el avatar del header
      onAvatarUpdated?.(data.ts);
      setSuccess(true);
      setTimeout(() => { onClose?.(); }, 1400);
    } catch (err) {
      setError(err.response?.data?.message || 'Error al guardar la imagen');
    } finally {
      setSaving(false);
    }
  };

  const avatarSrc = preview
    ? preview
    : user?.id ? `/api/users/avatar/${user.id}?t=${selfTs}` : null;

  const letter = user?.username?.[0]?.toUpperCase() || '?';
  const colors = ['#7c3aed','#a855f7','#ec4899','#3b82f6','#10b981','#f59e0b'];
  const color  = colors[(user?.username?.charCodeAt(0) || 0) % colors.length];

  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:16 }}>

      {/* Avatar clicable */}
      <div
        onClick={() => inputRef.current?.click()}
        style={{ position:'relative', cursor:'pointer' }}
      >
        <motion.div whileHover={{ scale:1.04 }} style={{ position:'relative' }}>
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt="Avatar"
              style={{
                width:100, height:100, borderRadius:'50%', objectFit:'cover',
                border:`3px solid ${color}`,
                boxShadow:`0 0 24px ${color}40`,
              }}
              onError={e => { e.target.style.display='none'; }}
            />
          ) : (
            <div style={{
              width:100, height:100, borderRadius:'50%',
              background: color, display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:36, fontWeight:700, color:'white',
              boxShadow:`0 0 24px ${color}50`,
            }}>{letter}</div>
          )}

          {/* Overlay hover */}
          <motion.div
            initial={{ opacity:0 }} whileHover={{ opacity:1 }}
            style={{
              position:'absolute', inset:0, borderRadius:'50%',
              background:'rgba(0,0,0,.55)',
              display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
              gap:4,
            }}
          >
            <span style={{ fontSize:22 }}>📷</span>
            <span style={{ color:'white', fontSize:11, fontWeight:600 }}>Cambiar</span>
          </motion.div>
        </motion.div>
      </div>

      <input ref={inputRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleFileChange} />

      {/* Info del usuario */}
      <div style={{ textAlign:'center' }}>
        <p style={{ color:'var(--text)', fontWeight:700, fontSize:16 }}>{user?.username}</p>
        <p style={{ color:'var(--muted)', fontSize:13, marginTop:3 }}>{user?.email}</p>
      </div>

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
            style={{ color:'#fb7185', fontSize:13, textAlign:'center' }}
          >⚠️ {error}</motion.p>
        )}
      </AnimatePresence>

      {/* Éxito */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity:0, scale:.9 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0 }}
            style={{
              padding:'8px 16px', borderRadius:10, fontSize:13, fontWeight:600,
              background:'rgba(16,185,129,.12)', border:'1px solid rgba(16,185,129,.3)',
              color:'#34d399', display:'flex', alignItems:'center', gap:8,
            }}
          >
            <span>✅</span> Foto actualizada en tiempo real
          </motion.div>
        )}
      </AnimatePresence>

      {/* Botón guardar */}
      <AnimatePresence>
        {file && !success && (
          <motion.button
            initial={{ opacity:0, y:8, scale:.95 }}
            animate={{ opacity:1, y:0, scale:1 }}
            exit={{ opacity:0 }}
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{ width:'100%', padding:'10px', fontSize:14 }}
          >
            {saving ? (
              <span style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                <span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }}/>
                Guardando...
              </span>
            ) : '💾 Guardar foto de perfil'}
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}