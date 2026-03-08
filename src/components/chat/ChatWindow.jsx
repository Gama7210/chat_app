import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import MessageBubble   from './MessageBubble';
import MessageInput    from './MessageInput';
import TypingIndicator from './TypingIndicator';
import { getSocket }   from '../../services/socketService';
import api from '../../services/api';
import styled from 'styled-components';

const COLORS = ['#7c3aed','#a855f7','#ec4899','#3b82f6','#10b981','#f59e0b'];
const getColor = (name) => COLORS[(name?.charCodeAt(0) || 0) % COLORS.length];

function addUnique(prev, msg) {
  if (!msg?.id) return prev;
  if (prev.some(m => m.id === msg.id)) return prev;
  return [...prev, msg];
}

// Componente de fondo japonés animado MEJORADO
function JapaneseMatrixBackground() {
  // Caracteres japoneses (hiragana, katakana)
  const chars = [
    'ア','イ','ウ','エ','オ','カ','キ','ク','ケ','コ','サ','シ','ス','セ','ソ',
    'タ','チ','ツ','テ','ト','ナ','ニ','ヌ','ネ','ノ','ハ','ヒ','フ','ヘ','ホ',
    'マ','ミ','ム','メ','モ','ヤ','ユ','ヨ','ラ','リ','ル','レ','ロ','ワ','ヲ',
    'ン','ガ','ギ','グ','ゲ','ゴ','ザ','ジ','ズ','ゼ','ゾ','ダ','ヂ','ヅ','デ',
    'ド','バ','ビ','ブ','ベ','ボ','パ','ピ','プ','ペ','ポ','あ','い','う','え',
    'お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て',
    'と','な','に','ぬ','ね','の','は','ひ','ふ','へ','ほ','ま','み','む','め',
    'も','や','ゆ','よ','ら','り','る','れ','ろ','わ','を','ん'
  ];

  // Generar una matriz de 30x30 caracteres (900 celdas)
  const matrixChars = [];
  for (let i = 0; i < 900; i++) {
    matrixChars.push(chars[Math.floor(Math.random() * chars.length)]);
  }

  return (
    <StyledMatrixWrapper>
      <div className="jp-matrix-container">
        <div className="jp-matrix">
          {matrixChars.map((char, index) => (
            <span key={index} className="matrix-char" style={{
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`,
            }}>
              {char}
            </span>
          ))}
        </div>
      </div>
    </StyledMatrixWrapper>
  );
}

const StyledMatrixWrapper = styled.div`
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  overflow: hidden;
  pointer-events: none;
  background: #0a0a14;

  .jp-matrix-container {
    position: relative;
    width: 100%;
    height: 100%;
    overflow: hidden;
  }

  .jp-matrix {
    position: absolute;
    top: 0;
    left: 0;
    width: 200%;
    height: 200%;
    display: grid;
    grid-template-columns: repeat(40, 1fr);
    grid-template-rows: repeat(40, 1fr);
    transform: rotate(3deg) scale(1.2) translateX(-10%) translateY(-10%);
    animation: matrix-scroll 60s linear infinite;
  }

  @keyframes matrix-scroll {
    0% {
      transform: rotate(3deg) scale(1.2) translateX(-10%) translateY(-10%);
    }
    100% {
      transform: rotate(3deg) scale(1.2) translateX(10%) translateY(10%);
    }
  }

  .matrix-char {
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-family: "Courier New", "MS Gothic", monospace;
    font-weight: bold;
    color: rgba(0, 200, 255, 0.35);
    text-shadow: 
      0 0 8px rgba(0, 200, 255, 0.5),
      0 0 15px rgba(100, 100, 255, 0.3);
    animation: matrix-pulse 4s ease-in-out infinite;
    transform-origin: center;
    user-select: none;
    transition: all 0.3s ease;
  }

  @keyframes matrix-pulse {
    0%, 100% {
      color: rgba(0, 200, 255, 0.3);
      text-shadow: 0 0 8px rgba(0, 200, 255, 0.4);
      transform: scale(1);
    }
    25% {
      color: rgba(255, 100, 200, 0.6);
      text-shadow: 0 0 15px rgba(255, 100, 200, 0.6);
      transform: scale(1.2);
    }
    50% {
      color: rgba(200, 100, 255, 0.7);
      text-shadow: 0 0 20px rgba(200, 100, 255, 0.8);
      transform: scale(1.3);
    }
    75% {
      color: rgba(100, 255, 200, 0.5);
      text-shadow: 0 0 15px rgba(100, 255, 200, 0.6);
      transform: scale(1.1);
    }
  }

  /* Efecto de líneas brillantes que pasan */
  &::after {
    content: '';
    position: absolute;
    top: -50%;
    left: -50%;
    width: 200%;
    height: 200%;
    background: linear-gradient(
      45deg,
      transparent 30%,
      rgba(100, 200, 255, 0.05) 50%,
      transparent 70%
    );
    animation: matrix-shine 15s linear infinite;
    pointer-events: none;
    z-index: 1;
  }

  @keyframes matrix-shine {
    0% {
      transform: translateX(-100%) translateY(-100%) rotate(45deg);
    }
    100% {
      transform: translateX(100%) translateY(100%) rotate(45deg);
    }
  }
`;

// Avatar del header — escucha avatar:updated en tiempo real
function ChatHeaderAvatar({ userId, username }) {
  const [err, setErr] = useState(false);
  const [ts,  setTs]  = useState(Date.now());

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const onAvatarUpdated = ({ userId: uid, ts: newTs }) => {
      if (String(uid) === String(userId)) {
        setErr(false);
        setTs(newTs || Date.now());
      }
    };
    socket.on('avatar:updated', onAvatarUpdated);
    return () => socket.off('avatar:updated', onAvatarUpdated);
  }, [userId]);

  const letter = username?.[0]?.toUpperCase() || '?';
  const color  = getColor(username);

  if (err) return (
    <div style={{
      width:40, height:40, borderRadius:'50%', flexShrink:0,
      background: color, display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:14, fontWeight:700, color:'white', boxShadow:`0 0 12px ${color}50`,
    }}>{letter}</div>
  );
  return (
    <img
      src={`/api/users/avatar/${userId}?t=${ts}`}
      alt={username}
      style={{
        width:40, height:40, borderRadius:'50%', objectFit:'cover', flexShrink:0,
        boxShadow:`0 0 0 2px var(--bg,#07071a), 0 0 0 3px ${color}`,
      }}
      onError={() => setErr(true)}
    />
  );
}

// Modal de confirmación para eliminar
function ConfirmDeleteModal({ onConfirm, onCancel, loading }) {
  return (
    <motion.div
      initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      style={{
        position:'fixed', inset:0, zIndex:100,
        background:'rgba(0,0,0,.7)', backdropFilter:'blur(10px)',
        display:'flex', alignItems:'center', justifyContent:'center', padding:16,
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ scale:.85, opacity:0, y:20 }}
        animate={{ scale:1,   opacity:1, y:0  }}
        exit={{ scale:.9, opacity:0 }}
        transition={{ type:'spring', damping:22 }}
        onClick={e => e.stopPropagation()}
        style={{
          maxWidth:360, width:'100%',
          background:'rgba(14,14,42,.95)',
          border:'1px solid rgba(244,63,94,.25)',
          borderRadius:20, padding:24,
          boxShadow:'0 8px 48px rgba(0,0,0,.5)',
          textAlign:'center',
        }}
      >
        <motion.div
          animate={{ rotate:[0,-10,10,-10,0] }}
          transition={{ delay:.2, duration:.5 }}
          style={{ fontSize:48, marginBottom:16 }}
        >🗑️</motion.div>

        <h3 style={{ color:'var(--text)', fontWeight:700, fontSize:18, marginBottom:8 }}>
          ¿Eliminar conversación?
        </h3>
        <p style={{ color:'var(--muted)', fontSize:13, lineHeight:1.6, marginBottom:20 }}>
          Se borrarán <strong style={{ color:'#fb7185' }}>todos los mensajes, imágenes, videos y audios</strong> de esta conversación. Esta acción no se puede deshacer.
        </p>

        <div style={{ display:'flex', gap:10 }}>
          <button
            onClick={onCancel}
            disabled={loading}
            style={{
              flex:1, padding:'10px', borderRadius:12, border:'1px solid var(--border)',
              background:'transparent', color:'var(--muted)', cursor:'pointer',
              fontSize:13, fontWeight:500, transition:'all .2s',
            }}
            onMouseEnter={e => { e.currentTarget.style.color='var(--text)'; e.currentTarget.style.background='rgba(255,255,255,.05)'; }}
            onMouseLeave={e => { e.currentTarget.style.color='var(--muted)'; e.currentTarget.style.background='transparent'; }}
          >Cancelar</button>

          <button
            onClick={onConfirm}
            disabled={loading}
            style={{
              flex:1, padding:'10px', borderRadius:12, border:'none',
              background:'linear-gradient(135deg,#e11d48,#f43f5e)',
              color:'white', cursor: loading ? 'not-allowed':'pointer',
              fontSize:13, fontWeight:600,
              boxShadow:'0 4px 16px rgba(244,63,94,.35)',
              opacity: loading ? .6 : 1,
              display:'flex', alignItems:'center', justifyContent:'center', gap:8,
              transition:'all .2s',
            }}
          >
            {loading ? (
              <>
                <span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }}/>
                Eliminando...
              </>
            ) : '🗑️ Sí, eliminar'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ChatWindow({ conversation, currentUser, chatUser, onConversationDeleted }) {
  const [messages,       setMessages]       = useState([]);
  const [isTyping,       setIsTyping]       = useState(false);
  const [loading,        setLoading]        = useState(true);
  const [error,          setError]          = useState(null);
  const [showDeleteModal,setShowDeleteModal] = useState(false);
  const [deleting,       setDeleting]       = useState(false);
  const [cleared,        setCleared]        = useState(false);
  const bottomRef  = useRef(null);
  const convIdRef  = useRef(conversation.id);

  // Cargar historial
  useEffect(() => {
    convIdRef.current = conversation.id;
    setLoading(true);
    setMessages([]);
    setIsTyping(false);
    setError(null);
    setCleared(false);

    api.get(`/messages/${conversation.id}`)
       .then(r => setMessages(r.data.messages || []))
       .catch(() => setError({ message:'Error al cargar mensajes', solution:'Recarga la página' }))
       .finally(() => setLoading(false));

    const socket = getSocket();
    if (socket) {
      socket.emit('join:conversation', conversation.id);
      socket.emit('messages:read', { conversationId: conversation.id });
    }
  }, [conversation.id]);

  // Socket: mensajes + conversación eliminada por el otro
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onMessage = (msg) => {
      const cid = msg.conversationId ?? msg.conversation_id;
      if (String(cid) !== String(convIdRef.current)) return;
      setMessages(prev => addUnique(prev, msg));
      setCleared(false);
      socket.emit('messages:read', { conversationId: convIdRef.current });
    };

    const onTyping = ({ userId, isTyping: t }) => {
      if (String(userId) !== String(currentUser.id)) setIsTyping(t);
    };

    const onCleared = ({ conversationId: cid }) => {
      if (String(cid) === String(convIdRef.current)) {
        setMessages([]);
        setCleared(true);
      }
    };

    socket.on('message:received',      onMessage);
    socket.on('typing:update',         onTyping);
    socket.on('conversation:cleared',  onCleared);

    return () => {
      socket.off('message:received',     onMessage);
      socket.off('typing:update',        onTyping);
      socket.off('conversation:cleared', onCleared);
    };
  }, [currentUser.id]);

  // Scroll automático
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior:'smooth' });
  }, [messages, isTyping]);

  const sendMessage = useCallback((content) => {
    const socket = getSocket();
    if (!socket) return;
    socket.emit('message:send', { conversationId: conversation.id, content }, (res) => {
      if (res?.status === 'blocked') {
        setError({ message:`🚫 ${res.reason}`, solution:res.solution, type:'blocked' });
        setTimeout(() => setError(null), 5000);
      } else if (res?.status === 'error') {
        setError(res);
        setTimeout(() => setError(null), 5000);
      }
    });
  }, [conversation.id]);

  const handleFileSent = useCallback(() => {}, []);

  // Eliminar conversación
  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/messages/${conversation.id}/clear`);
      setShowDeleteModal(false);
      setMessages([]);
      setCleared(true);
    } catch (err) {
      setShowDeleteModal(false);
      setError({ message:'Error al eliminar', solution:'Intenta de nuevo' });
      setTimeout(() => setError(null), 4000);
    } finally {
      setDeleting(false);
    }
  };

  const border  = 'rgba(120,80,255,.15)';
  const surface = 'rgba(10,10,28,.8)';

  return (
    <div style={{ 
      display:'flex', 
      flexDirection:'column', 
      height:'100%', 
      overflow:'hidden', 
      position:'relative',
      background: '#0a0a14',
    }}>
      
      {/* Fondo japonés animado - AHORA MÁS VISIBLE */}
      <JapaneseMatrixBackground />

      {/* Overlay MÍNIMO para mantener legibilidad sin opacar el fondo */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(135deg, rgba(10,10,20,0.2) 0%, rgba(20,10,30,0.3) 100%)',
        pointerEvents: 'none',
        zIndex: 1,
      }} />

      {/* ── Header ────────────────────────────────────────── */}
      <div style={{
        flexShrink:0, padding:'12px 16px',
        display:'flex', alignItems:'center', gap:12,
        borderBottom:`1px solid ${border}`,
        background:'rgba(10,10,30,.7)', 
        backdropFilter:'blur(20px)',
        position: 'relative',
        zIndex: 2,
      }}>
        <ChatHeaderAvatar userId={chatUser?.id} username={chatUser?.username} />

        <div style={{ flex:1, minWidth:0 }}>
          <p style={{ color:'var(--text)', fontWeight:600, fontSize:15, lineHeight:1.3 }}>
            {chatUser?.username}
          </p>
          <p style={{ fontSize:12, color:'var(--muted)', marginTop:2 }}>
            {isTyping
              ? <span style={{ color:'#a855f7' }}>✍️ escribiendo...</span>
              : <span>🔒 Chat privado cifrado</span>
            }
          </p>
        </div>

        {/* Botón eliminar conversación */}
        <motion.button
          whileTap={{ scale:.9 }}
          onClick={() => setShowDeleteModal(true)}
          title="Eliminar conversación"
          style={{
            padding:'8px 12px', borderRadius:10,
            border:'1px solid rgba(244,63,94,.2)',
            background:'transparent', cursor:'pointer',
            color:'#f87171', fontSize:13, fontWeight:500,
            display:'flex', alignItems:'center', gap:6,
            transition:'all .2s', flexShrink:0,
          }}
          onMouseEnter={e => { e.currentTarget.style.background='rgba(244,63,94,.1)'; e.currentTarget.style.borderColor='rgba(244,63,94,.4)'; }}
          onMouseLeave={e => { e.currentTarget.style.background='transparent'; e.currentTarget.style.borderColor='rgba(244,63,94,.2)'; }}
        >
          <span>🗑️</span>
          <span style={{ display:'none' }} className="sm:inline">Eliminar</span>
        </motion.button>
      </div>

      {/* ── Mensajes ──────────────────────────────────────── */}
      <div style={{
        flex:1, overflowY:'auto', padding:'20px 16px 8px',
        display:'flex', flexDirection:'column', gap:2,
        scrollbarWidth:'thin',
        position: 'relative',
        zIndex: 2,
      }}>
        {loading ? (
          <div style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div style={{
              width:36, height:36, borderRadius:'50%',
              border:'3px solid rgba(124,58,237,.2)', borderTopColor:'var(--accent,#7c3aed)',
              animation:'spin .8s linear infinite',
            }}/>
          </div>

        ) : cleared ? (
          <motion.div
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:12 }}
          >
            <motion.div animate={{ y:[0,-8,0] }} transition={{ duration:3, repeat:Infinity }}>
              <span style={{ fontSize:52 }}>🗑️</span>
            </motion.div>
            <p style={{ color:'var(--text)', fontWeight:600 }}>Conversación eliminada</p>
            <p style={{ color:'var(--muted)', fontSize:13 }}>Todos los archivos fueron borrados</p>
          </motion.div>

        ) : messages.length === 0 ? (
          <motion.div
            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
            style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', textAlign:'center', gap:12 }}
          >
            <motion.div animate={{ y:[0,-8,0] }} transition={{ duration:3, repeat:Infinity }}>
              <span style={{ fontSize:52 }}>👋</span>
            </motion.div>
            <p style={{ color:'var(--text)', fontWeight:600 }}>Inicia la conversación</p>
            <p style={{ color:'var(--muted)', fontSize:13 }}>Los mensajes están cifrados con AES-256</p>
          </motion.div>

        ) : (
          messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              isOwn={String(msg.sender_id ?? msg.senderId) === String(currentUser.id)}
              prevMsg={messages[i - 1]}
            />
          ))
        )}

        {isTyping && <TypingIndicator />}

        {/* Error inline */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              style={{
                margin:'4px auto', maxWidth:340, borderRadius:14, padding:'10px 14px', fontSize:13,
                background: error.type==='blocked' ? 'rgba(251,146,60,.1)' : 'rgba(244,63,94,.1)',
                border:`1px solid ${error.type==='blocked' ? 'rgba(251,146,60,.3)' : 'rgba(244,63,94,.3)'}`,
              }}
            >
              <p style={{ fontWeight:600, color: error.type==='blocked' ? '#fb923c' : '#fb7185' }}>{error.message}</p>
              {error.solution && <p style={{ marginTop:3, fontSize:12, color: error.type==='blocked' ? '#fdba74':'#fca5a5' }}>💡 {error.solution}</p>}
            </motion.div>
          )}
        </AnimatePresence>

        <div ref={bottomRef} style={{ height:1, flexShrink:0 }} />
      </div>

      {/* ── Input ─────────────────────────────────────────── */}
      <div style={{ 
        flexShrink:0,
        position: 'relative',
        zIndex: 2,
      }}>
        <MessageInput
          onSend={sendMessage}
          onFileSent={handleFileSent}
          conversationId={conversation.id}
          currentUserId={currentUser.id}
        />
      </div>

      {/* ── Modal confirmar eliminar ───────────────────────── */}
      <AnimatePresence>
        {showDeleteModal && (
          <ConfirmDeleteModal
            onConfirm={handleDelete}
            onCancel={() => setShowDeleteModal(false)}
            loading={deleting}
          />
        )}
      </AnimatePresence>
    </div>
  );
}