import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import api from '../../services/api';

const COLORS = ['bg-indigo-600','bg-purple-600','bg-pink-600','bg-blue-600','bg-green-600','bg-orange-600'];

export default function UserProfileModal({ userId, username, onClose, onStartChat }) {
  const [userData, setUserData] = useState(null);
  const [imgError, setImgError] = useState(false);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    api.get(`/users/${userId}/profile`)
       .then(r => setUserData(r.data.user))
       .catch(() => setUserData(null))
       .finally(() => setLoading(false));
  }, [userId]);

  const initial = username?.[0]?.toUpperCase() || '?';
  const color   = COLORS[(username?.charCodeAt(0) || 0) % COLORS.length];

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Desconocido';
    return new Date(dateStr).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatLastSeen = (dateStr) => {
    if (!dateStr) return 'Nunca';
    const d = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - d) / 60000);
    if (diff < 1)   return 'Justo ahora';
    if (diff < 60)  return `Hace ${diff} minutos`;
    if (diff < 1440) return `Hace ${Math.floor(diff / 60)} horas`;
    return formatDate(dateStr);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 20 }}
        animate={{ scale: 1,    opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0 }}
        transition={{ type: 'spring', damping: 20 }}
        className="card max-w-sm w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header con fondo degradado */}
        <div className="relative h-24 bg-gradient-to-br from-primary-700 to-purple-700 -mx-4 -mt-4 mb-0">
          <button onClick={onClose}
            className="absolute top-3 right-3 text-white/70 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-all"
          >✕</button>
        </div>

        {/* Avatar centrado sobre el degradado */}
        <div className="flex flex-col items-center -mt-12 mb-4">
          {loading ? (
            <div className="w-24 h-24 rounded-full bg-gray-700 animate-pulse border-4 border-gray-900" />
          ) : imgError || !userData?.avatar_path ? (
            <div className={`w-24 h-24 ${color} rounded-full flex items-center justify-center text-4xl font-bold text-white border-4 border-gray-900`}>
              {initial}
            </div>
          ) : (
            <img
              src={`/api/users/avatar/${userId}`}
              alt={username}
              className="w-24 h-24 rounded-full object-cover border-4 border-gray-900 bg-gray-700"
              onError={() => setImgError(true)}
            />
          )}

          {/* Nombre y estado */}
          <h2 className="text-white font-bold text-xl mt-3">{username}</h2>
          {userData && (
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-xl">{userData.status_emoji || '🟢'}</span>
              <span className="text-gray-300 text-sm">{userData.status_text || 'Disponible para chatear'}</span>
            </div>
          )}
        </div>

        {/* Info */}
        {!loading && userData && (
          <div className="space-y-3 mb-5">
            <div className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">📧</span>
              <div>
                <p className="text-gray-500 text-xs">Correo</p>
                <p className="text-white text-sm">{userData.email}</p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">🕐</span>
              <div>
                <p className="text-gray-500 text-xs">Última vez visto</p>
                <p className="text-white text-sm">{formatLastSeen(userData.last_seen)}</p>
              </div>
            </div>
            <div className="bg-gray-800 rounded-xl p-3 flex items-center gap-3">
              <span className="text-xl">📅</span>
              <div>
                <p className="text-gray-500 text-xs">Miembro desde</p>
                <p className="text-white text-sm">{formatDate(userData.created_at)}</p>
              </div>
            </div>
          </div>
        )}

        {loading && (
          <div className="flex justify-center py-6">
            <div className="w-6 h-6 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Botón chatear */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => { onStartChat?.(); onClose(); }}
          className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
        >
          <span>💬</span> Enviar mensaje
        </motion.button>
      </motion.div>
    </motion.div>
  );
}