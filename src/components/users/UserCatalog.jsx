import { useState, useEffect, memo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../../services/socketService';
import api from '../../services/api';
import UserProfileModal from './UserProfileModal';

const COLORS = ['bg-indigo-600','bg-purple-600','bg-pink-600','bg-blue-600','bg-green-600','bg-orange-600'];

const StableAvatar = memo(function StableAvatar({ userId, username, isOnline }) {
  const [imgError, setImgError] = useState(false);
  const [timestamp, setTimestamp] = useState(Date.now());
  const userIdRef = useRef(userId);
  const initial = username?.[0]?.toUpperCase() || '?';
  const color = COLORS[(username?.charCodeAt(0) || 0) % COLORS.length];

  // Escuchar evento de actualización de avatar
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onAvatarUpdated = ({ userId: uid, ts: newTs }) => {
      if (String(uid) === String(userIdRef.current)) {
        setImgError(false); // resetear error por si antes fallaba
        setTimestamp(newTs || Date.now());
      }
    };

    socket.on('avatar:updated', onAvatarUpdated);
    return () => socket.off('avatar:updated', onAvatarUpdated);
  }, []);

  return (
    <div className="relative shrink-0">
      {imgError ? (
        <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center font-bold text-white text-sm`}>
          {initial}
        </div>
      ) : (
        <img 
          src={`/api/users/avatar/${userId}?t=${timestamp}`} 
          alt={username}
          className="w-10 h-10 rounded-full object-cover bg-gray-700"
          onError={() => setImgError(true)} 
        />
      )}
      <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-gray-900
        ${isOnline ? 'bg-green-500' : 'bg-gray-600'}`} />
    </div>
  );
});

export default function UserCatalog({ onStartChat, onlineUsers = [], activeUserId }) {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [profileUser, setProfileUser] = useState(null);

  useEffect(() => {
    api.get('/users')
      .then(r => setUsers(r.data.users))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return (
    <div className="space-y-2">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="h-14 bg-gray-800 rounded-xl animate-pulse" />
      ))}
    </div>
  );

  return (
    <>
      <div className="space-y-1">
        <input 
          type="text" 
          value={search} 
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar usuarios..." 
          className="input-field text-sm py-2 mb-2" 
        />

        {filtered.length === 0 ? (
          <p className="text-gray-500 text-sm text-center py-6">
            {users.length === 0 ? 'No hay otros usuarios registrados' : 'No se encontraron usuarios'}
          </p>
        ) : (
          filtered.map((user, i) => {
            const isOnline = onlineUsers.includes(user.id) || onlineUsers.includes(String(user.id));
            const isActive = activeUserId === user.id;
            return (
              <motion.div 
                key={user.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-150
                  ${isActive ? 'bg-primary-600/20 border border-primary-600/40' : 'border border-transparent hover:bg-gray-800'}`}
              >
                {/* Avatar clickeable → ver perfil */}
                <button onClick={() => setProfileUser(user)} className="shrink-0 hover:opacity-80 transition-opacity">
                  <StableAvatar userId={user.id} username={user.username} isOnline={isOnline} />
                </button>

                {/* Info → abrir chat */}
                <button className="flex-1 min-w-0 text-left" onClick={() => onStartChat(user)}>
                  <p className="text-white text-sm font-medium truncate">{user.username}</p>
                  <p className="text-xs truncate flex items-center gap-1">
                    <span className={isOnline ? 'text-green-400' : 'text-gray-500'}>
                      {isOnline ? '● En línea' : '○ Desconectado'}
                    </span>
                    {user.status_emoji && user.status_text && (
                      <span className="text-gray-500">· {user.status_emoji} {user.status_text}</span>
                    )}
                  </p>
                </button>

                {/* Botón chat rápido */}
                <button 
                  onClick={() => onStartChat(user)}
                  className="p-1.5 text-gray-500 hover:text-primary-400 hover:bg-gray-700 rounded-lg transition-all shrink-0"
                  title="Iniciar chat"
                >💬</button>
              </motion.div>
            );
          })
        )}
      </div>

      {/* Modal de perfil de usuario */}
      <AnimatePresence>
        {profileUser && (
          <UserProfileModal
            userId={profileUser.id}
            username={profileUser.username}
            onClose={() => setProfileUser(null)}
            onStartChat={() => { onStartChat(profileUser); setProfileUser(null); }}
          />
        )}
      </AnimatePresence>
    </>
  );
}       