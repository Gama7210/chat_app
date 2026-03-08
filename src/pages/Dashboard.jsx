import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { connectSocket, disconnectSocket } from '../services/socketService';
import UserCatalog  from '../components/users/UserCatalog';
import ChatWindow   from '../components/chat/ChatWindow';
import AIChatWindow from '../components/chat/AIChatWindow';
import ProfileModal from '../components/users/ProfileModal';
import api from '../services/api';

const COLORS = ['bg-indigo-600','bg-purple-600','bg-pink-600','bg-blue-600','bg-green-600','bg-orange-600'];

function HeaderAvatar({ user, avatarTs, onClick }) {
  const [imgError, setImgError] = useState(false);
  const [imgKey,   setImgKey]   = useState(0);

  useEffect(() => { setImgError(false); setImgKey(k => k + 1); }, [avatarTs]);

  const initial = user?.username?.[0]?.toUpperCase() || '?';
  const color   = COLORS[(user?.username?.charCodeAt(0) || 0) % COLORS.length];

  return (
    <button onClick={onClick} className="relative group shrink-0" title="Ver mi perfil">
      {imgError ? (
        <div className={`w-10 h-10 ${color} rounded-full flex items-center justify-center font-bold text-white text-sm`}>{initial}</div>
      ) : (
        <img key={imgKey} src={`/api/users/avatar/${user?.id}?t=${avatarTs}`} alt={user?.username}
          className="w-10 h-10 rounded-full object-cover bg-gray-700"
          onError={() => setImgError(true)} />
      )}
      <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <span className="text-xs">✏️</span>
      </div>
      <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900" />
    </button>
  );
}

export default function Dashboard() {
  const { user, logout }   = useAuth();
  const { isDark, toggle } = useTheme();
  const [activeConv,  setActiveConv]  = useState(null);
  const [activeUser,  setActiveUser]  = useState(null);
  const [showProfile, setShowProfile] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [avatarTs,    setAvatarTs]    = useState(Date.now());
  const [showAIChat,  setShowAIChat]  = useState(false);

  useEffect(() => {
    const token  = localStorage.getItem('token');
    const socket = connectSocket(token);
    socket.on('users:online', (users) => setOnlineUsers(users.map(String)));
    socket.on('user:online',  ({ userId }) => setOnlineUsers(prev => [...new Set([...prev, String(userId)])]));
    socket.on('user:offline', ({ userId }) => setOnlineUsers(prev => prev.filter(id => id !== String(userId))));
    return () => disconnectSocket();
  }, []);

  const handleStartChat = async (targetUser) => {
    try {
      setShowAIChat(false);
      const { data } = await api.get(`/users/conversation/${targetUser.id}`);
      setActiveConv(data.conversation);
      setActiveUser(targetUser);
    } catch (err) {
      console.error('Error al abrir conversación:', err);
    }
  };

  const handleOpenAI = () => {
    setShowAIChat(true);
    setActiveConv(null);
    setActiveUser(null);
  };

  return (
    <div className="h-screen flex bg-gray-950 overflow-hidden">

      {/* ── Sidebar ─────────────────────────────── */}
      <motion.aside initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
        className="w-72 flex flex-col bg-gray-900 border-r border-gray-800"
      >
        {/* Header del sidebar */}
        <div className="p-4 border-b border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3 min-w-0">
            <HeaderAvatar user={user} avatarTs={avatarTs} onClick={() => setShowProfile(true)} />
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">{user?.username}</p>
              <p className="text-xs truncate flex items-center gap-1">
                <span>{user?.status_emoji || '🟢'}</span>
                <span className="text-gray-400 truncate">{user?.status_text || 'Disponible para chatear'}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-1 shrink-0">
            <button onClick={toggle}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-all"
              title="Cambiar tema"
            >{isDark ? '☀️' : '🌙'}</button>
            <button onClick={logout}
              className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-all"
              title="Cerrar sesión"
            >🚪</button>
          </div>
        </div>

        {/* ── Botón LLaMA IA ──────────────────── */}
        <div className="px-3 pt-3">
          <motion.button
            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
            onClick={handleOpenAI}
            className="w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all"
            style={{
              background: showAIChat
                ? 'linear-gradient(135deg,rgba(124,58,237,.3),rgba(6,182,212,.2))'
                : 'linear-gradient(135deg,rgba(124,58,237,.12),rgba(6,182,212,.08))',
              border: showAIChat
                ? '1px solid rgba(124,58,237,.5)'
                : '1px solid rgba(124,58,237,.2)',
            }}
          >
            <div style={{
              width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, boxShadow: '0 0 12px rgba(124,58,237,.4)',
            }}>✨</div>
            <div className="min-w-0">
              <p className="text-sm font-bold" style={{ color: '#c4b5fd' }}>LLaMA IA</p>
              <p className="text-xs" style={{ color: '#10b981' }}>● Conectado · LLaMA 3.3 70B</p>
            </div>
            <span style={{
              marginLeft: 'auto', fontSize: 10, color: 'rgba(167,139,250,.9)',
              background: 'rgba(124,58,237,.15)', padding: '2px 7px',
              borderRadius: 99, border: '1px solid rgba(124,58,237,.2)', flexShrink: 0,
            }}>NUEVO</span>
          </motion.button>
        </div>

        {/* Lista de usuarios */}
        <div className="flex-1 overflow-y-auto p-3">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3 px-1">
            Usuarios ({onlineUsers.length} en línea)
          </p>
          <UserCatalog onStartChat={handleStartChat} onlineUsers={onlineUsers} activeUserId={activeUser?.id} />
        </div>
      </motion.aside>

      {/* ── Área principal ───────────────────────── */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {showAIChat ? (
            <motion.div key="ai-chat"
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full"
            >
              <AIChatWindow />
            </motion.div>
          ) : activeConv ? (
            <motion.div key={activeConv.id}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }} transition={{ duration: 0.2 }}
              className="flex-1 flex flex-col h-full"
            >
              <ChatWindow conversation={activeConv} currentUser={user} chatUser={activeUser} />
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center p-8"
            >
              <div className="text-7xl mb-4">💬</div>
              <h2 className="text-2xl font-bold text-white mb-2">Chat Seguro</h2>
              <p className="text-gray-400 max-w-sm">Selecciona un usuario para iniciar una conversación cifrada con AES-256.</p>
              <p className="text-gray-600 text-sm mt-2">O prueba el asistente de IA integrado.</p>
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                onClick={handleOpenAI}
                className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white"
                style={{
                  background: 'linear-gradient(135deg,#7c3aed,#06b6d4)',
                  boxShadow: '0 4px 20px rgba(124,58,237,.35)',
                  border: 'none', cursor: 'pointer',
                }}
              >✨ Chatear con LLaMA IA</motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* ── Modal Mi Perfil ──────────────────────── */}
      <AnimatePresence>
        {showProfile && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowProfile(false)}
          >
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }} transition={{ type: 'spring', damping: 20 }}
              className="card max-w-md w-full max-h-[90vh] overflow-y-auto"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">Mi Perfil</h3>
                <button onClick={() => setShowProfile(false)}
                  className="text-gray-400 hover:text-white w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-700 transition-all"
                >✕</button>
              </div>
              <ProfileModal
                onClose={() => setShowProfile(false)}
                onAvatarUpdated={() => setAvatarTs(Date.now())}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}