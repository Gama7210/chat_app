import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import styled from 'styled-components';

// Componente TypingDots (mejorado)
function TypingDots() {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:4, padding:'10px 14px' }}>
      {[0,1,2].map(i => (
        <motion.span key={i}
          animate={{ y:[0,-6,0], opacity:[0.3,1,0.3] }}
          transition={{ duration:0.8, repeat:Infinity, delay: i * 0.15, ease:'easeInOut' }}
          style={{ 
            width:6, height:6, borderRadius:'50%', 
            background:'linear-gradient(135deg,#a78bfa,#2dd4bf)',
            display:'block',
            boxShadow: '0 0 8px rgba(168,85,247,0.4)'
          }}
        />
      ))}
    </div>
  );
}

// Componente MessageBubble (rediseñado)
function MessageBubble({ msg, index }) {
  const isAI = msg.isAI || msg.role === 'assistant' || msg.role === 'model';
  
  return (
    <motion.div
      initial={{ opacity:0, y:15, scale:0.95 }}
      animate={{ opacity:1, y:0, scale:1 }}
      transition={{ duration:0.25, delay: index * 0.03, ease:[0.2,0.9,0.3,1] }}
      style={{
        display:'flex',
        justifyContent: isAI ? 'flex-start' : 'flex-end',
        marginBottom: 16,
        paddingLeft: isAI ? 0 : 48,
        paddingRight: isAI ? 48 : 0,
        alignItems: 'flex-end',
        gap: 8,
      }}
    >
      {isAI && (
        <motion.div
          initial={{ scale:0, rotate: -10 }}
          animate={{ scale:1, rotate: 0 }}
          transition={{ type:'spring', stiffness:350, damping:15, delay: index * 0.03 + 0.1 }}
          style={{
            width: 32, height: 32, borderRadius: '12px', flexShrink: 0,
            background: 'linear-gradient(135deg,#8b5cf6,#14b8a6)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 16, 
            boxShadow: '0 4px 12px rgba(139,92,246,0.3)',
            border: '1px solid rgba(255,255,255,0.1)',
            transform: 'rotate(5deg)',
          }}
        >🤖</motion.div>
      )}
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.2 }}
        style={{
          maxWidth: '68%',
          padding: '12px 16px',
          borderRadius: isAI 
            ? '20px 20px 20px 8px' 
            : '20px 20px 8px 20px',
          fontSize: 14,
          lineHeight: 1.6,
          letterSpacing: '0.01em',
          backdropFilter: 'blur(10px)',
          ...(isAI ? {
            background: 'rgba(30,30,45,0.7)',
            border: '1px solid rgba(139,92,246,0.25)',
            color: '#f1f5f9',
            boxShadow: '0 4px 20px rgba(0,0,0,0.15), 0 0 0 1px rgba(139,92,246,0.1) inset',
          } : {
            background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
            color: 'white',
            boxShadow: '0 8px 20px rgba(124,58,237,0.25)',
            border: '1px solid rgba(255,255,255,0.15)',
          }),
        }}
      >
        <p style={{ margin:0, whiteSpace:'pre-wrap', wordBreak:'break-word' }}>{msg.content}</p>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'flex-end',
          gap: 4,
          marginTop: 6,
          fontSize: 11,
          opacity: 0.6,
          fontFamily: 'JetBrains Mono, monospace',
        }}>
          <span>{isAI ? '🤖 IA' : '👤 Tú'}</span>
          <span style={{ fontSize: 10 }}>•</span>
          <span>{new Date().toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' })}</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Componente WelcomeScreen (mejorado)
function WelcomeScreen({ onSuggestion }) {
  const suggestions = [
    '¿Qué puedes hacer?',
    'Explica AES-256',
    'Escribe un correo formal',
    'Tips de programación',
    'Hacer un resumen',
    'Traducir texto'
  ];
  
  return (
    <motion.div
      initial={{ opacity:0, scale:0.96 }} 
      animate={{ opacity:1, scale:1 }} 
      exit={{ opacity:0, scale:0.96 }}
      transition={{ duration:0.35, ease:[0.2,0.9,0.3,1] }}
      style={{ 
        flex:1, 
        display:'flex', 
        flexDirection:'column', 
        alignItems:'center', 
        justifyContent:'center', 
        padding: 24,
        textAlign:'center' 
      }}
    >
      <motion.div
        animate={{ 
          y:[0,-8,0], 
          rotate:[0,3,-3,0],
          scale: [1,1.05,1]
        }}
        transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }}
        style={{
          width: 70, height: 70, borderRadius: '24px', marginBottom: 20,
          background: 'linear-gradient(135deg,#7c3aed,#14b8a6)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32,
          boxShadow: '0 10px 30px rgba(124,58,237,0.3)',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >🤖</motion.div>
      
      <motion.h2 
        initial={{ opacity:0, y:12 }} 
        animate={{ opacity:1, y:0 }} 
        transition={{ delay:0.1 }}
        style={{ 
          fontSize: 22, 
          fontWeight: 700, 
          color: '#f1f5f9', 
          marginBottom: 6,
          letterSpacing: '-0.3px',
        }}
      >Asistente LLaMA 3.3</motion.h2>
      
      <motion.p 
        initial={{ opacity:0, y:8 }} 
        animate={{ opacity:1, y:0 }} 
        transition={{ delay:0.15 }}
        style={{ 
          fontSize: 13, 
          color: '#94a3b8', 
          maxWidth: 280, 
          lineHeight: 1.6, 
          marginBottom: 24,
        }}
      >Potenciado por Groq · Respuestas rápidas y precisas</motion.p>
      
      <motion.div 
        initial={{ opacity:0, y:8 }} 
        animate={{ opacity:1, y:0 }} 
        transition={{ delay:0.2 }}
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: 8, 
          maxWidth: 360,
          width: '100%',
        }}
      >
        {suggestions.map((s, i) => (
          <motion.button 
            key={s}
            initial={{ opacity:0, y:8 }} 
            animate={{ opacity:1, y:0 }} 
            transition={{ delay: 0.2 + i * 0.03 }}
            whileHover={{ scale: 1.03, y: -2 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onSuggestion(s)}
            style={{
              padding: '10px 12px', 
              borderRadius: 14, 
              fontSize: 12, 
              fontWeight: 500, 
              cursor: 'pointer',
              background: 'rgba(30,30,45,0.6)',
              border: '1px solid rgba(139,92,246,0.2)',
              color: '#cbd5e1',
              backdropFilter: 'blur(8px)',
              textAlign: 'left',
              transition: 'all 0.2s',
            }}
          >{s}</motion.button>
        ))}
      </motion.div>
    </motion.div>
  );
}

// Componente RobotAvatar (más pequeño y mejorado)
function RobotAvatar() {
  return (
    <StyledRobotWrapper>
      <div className="robot-container">
        <div className="area" />
        <div className="area" />
        <div className="area" />
        <div className="area" />
        <div className="area" />
        <div className="area" />
        <div className="area" />
        <div className="area" />
        <div className="area" />
        <div className="area" />
        <div className="area" />
        <div className="area" />
        <div className="area" />
        <div className="area" />
        <div className="area" />
        <div className="container-wrap">
          <input type="checkbox" />
          <div className="card">
            <div className="background-blur-balls">
              <div className="balls">
                <span className="ball rosa" />
                <span className="ball violet" />
                <span className="ball green" />
                <span className="ball cyan" />
              </div>
            </div>
            <div className="content-card">
              <div className="background-blur-card">
                <div className="eyes">
                  <span className="eye" />
                  <span className="eye" />
                </div>
                <div className="eyes happy">
                  <svg fill="none" viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M8.28386 16.2843C8.9917 15.7665 9.8765 14.731 12 14.731C14.1235 14.731 15.0083 15.7665 15.7161 16.2843C17.8397 17.8376 18.7542 16.4845 18.9014 15.7665C19.4323 13.1777 17.6627 11.1066 17.3088 10.5888C16.3844 9.23666 14.1235 8 12 8C9.87648 8 7.61556 9.23666 6.69122 10.5888C6.33728 11.1066 4.56771 13.1777 5.09858 15.7665C5.24582 16.4845 6.16034 17.8376 8.28386 16.2843Z" />
                  </svg>
                  <svg fill="none" viewBox="0 0 24 24" width="40" height="40">
                    <path fill="currentColor" d="M8.28386 16.2843C8.9917 15.7665 9.8765 14.731 12 14.731C14.1235 14.731 15.0083 15.7665 15.7161 16.2843C17.8397 17.8376 18.7542 16.4845 18.9014 15.7665C19.4323 13.1777 17.6627 11.1066 17.3088 10.5888C16.3844 9.23666 14.1235 8 12 8C9.87648 8 7.61556 9.23666 6.69122 10.5888C6.33728 11.1066 4.56771 13.1777 5.09858 15.7665C5.24582 16.4845 6.16034 17.8376 8.28386 16.2843Z" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </StyledRobotWrapper>
  );
}

// Styled Components para el robot (tamaño reducido)
const StyledRobotWrapper = styled.div`
  .robot-container {
    --perspective: 800px;
    --translateY: 25px;
    position: relative;
    width: 130px;
    height: 130px;
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    transform-style: preserve-3d;
    margin: 0;
    transform: scale(0.8);
  }

  .container-wrap {
    display: flex;
    align-items: center;
    justify-items: center;
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    z-index: 9;
    transform-style: preserve-3d;
    cursor: pointer;
    padding: 2px;
    transition: all 0.3s ease;
  }

  .container-wrap:hover {
    padding: 0;
  }

  .container-wrap:active {
    transform: translateX(-50%) translateY(-50%) scale(0.95);
  }

  .container-wrap:after {
    content: "";
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-55%);
    width: 8rem;
    height: 7rem;
    background: rgba(20,20,30,0.4);
    backdrop-filter: blur(10px);
    border-radius: 2.2rem;
    transition: all 0.3s ease;
    border: 1px solid rgba(139,92,246,0.2);
  }

  .container-wrap:hover:after {
    transform: translateX(-50%) translateY(-50%);
    height: 8rem;
    background: rgba(30,30,45,0.6);
    border-color: rgba(139,92,246,0.4);
  }

  .container-wrap input {
    opacity: 0;
    width: 0;
    height: 0;
    position: absolute;
  }

  .container-wrap input:checked + .card .eyes {
    opacity: 0;
  }

  .container-wrap input:checked + .card .content-card {
    width: 180px;
    height: 110px;
  }

  .container-wrap input:checked + .card .background-blur-balls {
    border-radius: 16px;
  }

  .card {
    width: 100%;
    height: 100%;
    transform-style: preserve-3d;
    will-change: transform;
    transition: all 0.5s ease;
    border-radius: 2.2rem;
    display: flex;
    align-items: center;
    transform: translateZ(30px);
    justify-content: center;
  }

  .card:hover {
    box-shadow: 0 5px 25px rgba(139,92,246,0.2);
  }

  .background-blur-balls {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    width: 100%;
    height: 100%;
    z-index: -10;
    border-radius: 2.2rem;
    transition: all 0.3s ease;
    background: rgba(20,20,30,0.3);
    backdrop-filter: blur(10px);
    overflow: hidden;
    border: 1px solid rgba(139,92,246,0.15);
  }
  
  .balls {
    position: absolute;
    left: 50%;
    top: 50%;
    transform: translateX(-50%) translateY(-50%);
    animation: rotate-background-balls 8s linear infinite;
  }

  .container-wrap:hover .balls {
    animation-play-state: paused;
  }

  .background-blur-balls .ball {
    width: 4rem;
    height: 4rem;
    position: absolute;
    border-radius: 50%;
    filter: blur(20px);
  }

  .background-blur-balls .ball.violet {
    top: 0;
    left: 50%;
    transform: translateX(-50%);
    background: #8b5cf6;
  }

  .background-blur-balls .ball.green {
    bottom: 0;
    left: 50%;
    transform: translateX(-50%);
    background: #14b8a6;
  }

  .background-blur-balls .ball.rosa {
    top: 50%;
    left: 0;
    transform: translateY(-50%);
    background: #ec4899;
  }

  .background-blur-balls .ball.cyan {
    top: 50%;
    right: 0;
    transform: translateY(-50%);
    background: #06b6d4;
  }

  .content-card {
    width: 8rem;
    height: 8rem;
    display: flex;
    border-radius: 2.2rem;
    transition: all 0.3s ease;
    overflow: hidden;
  }

  .background-blur-card {
    width: 100%;
    height: 100%;
    backdrop-filter: blur(30px);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .eyes {
    position: absolute;
    left: 50%;
    bottom: 45%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    justify-content: center;
    height: 36px;
    gap: 1.2rem;
    transition: all 0.3s ease;

    & .eye {
      width: 18px;
      height: 36px;
      background: rgba(255,255,255,0.9);
      border-radius: 12px;
      animation: animate-eyes 8s infinite linear;
      transition: all 0.3s ease;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    }
  }

  .eyes.happy {
    display: none;
    color: rgba(255,255,255,0.9);
    gap: 0;

    & svg {
      width: 40px;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.2));
    }
  }

  .container-wrap:hover .eyes .eye {
    display: none;
  }

  .container-wrap:hover .eyes.happy {
    display: flex;
  }

  @keyframes rotate-background-balls {
    from {
      transform: translateX(-50%) translateY(-50%) rotate(360deg);
    }
    to {
      transform: translateX(-50%) translateY(-50%) rotate(0);
    }
  }

  @keyframes animate-eyes {
    46% { height: 36px; }
    48% { height: 14px; }
    50% { height: 36px; }
    96% { height: 36px; }
    98% { height: 14px; }
    100% { height: 36px; }
  }

  /* Hover effects simplificados */
  ${[...Array(15)].map((_, i) => {
    const row = Math.floor(i / 5);
    const col = i % 5;
    const rotateX = row === 0 ? 10 : row === 1 ? 0 : -10;
    const rotateY = (col - 2) * 5;
    
    return `
      .area:nth-child(${i + 1}):hover ~ .container-wrap .card,
      .area:nth-child(${i + 1}):hover ~ .container-wrap .eyes .eye {
        transform: perspective(var(--perspective)) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateZ(var(--translateY)) scale3d(1, 1, 1);
      }
    `;
  }).join('')}
`;

export default function AIChatWindow() {
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState(null);
  const [hasChat,  setHasChat]  = useState(false);
  const bottomRef = useRef(null);
  const inputRef  = useRef(null);

  useEffect(() => {
    api.get('/ai/history').then(r => {
      if (r.data.messages?.length > 0) { setMessages(r.data.messages); setHasChat(true); }
    }).catch(() => {});
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior:'smooth' }); }, [messages, loading]);

  const sendMessage = async (text) => {
    const msg = (text || input).trim();
    if (!msg || loading) return;
    setHasChat(true);
    setMessages(prev => [...prev, { id: Date.now(), isAI:false, role:'user', content: msg }]);
    setInput('');
    setLoading(true);
    setError(null);
    if (inputRef.current) inputRef.current.style.height = '44px';
    try {
      const { data } = await api.post('/ai/chat', { message: msg });
      setMessages(prev => [...prev, { id: Date.now()+1, isAI:true, role:'assistant', content: data.message }]);
    } catch {
      setError('No se pudo conectar con el asistente. Intenta de nuevo.');
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const clearChat = async () => {
    await api.delete('/ai/history').catch(() => {});
    setMessages([]); setHasChat(false);
  };

  return (
    <motion.div
      initial={{ opacity:0, x:20 }} 
      animate={{ opacity:1, x:0 }}
      transition={{ duration:0.3, ease:[0.2,0.9,0.3,1] }}
      style={{ 
        display:'flex', 
        flexDirection:'column', 
        height:'100%', 
        overflow:'hidden', 
        position:'relative',
        background: '#0f0f17',
      }}
    >
      {/* Fondo con gradiente */}
      <div style={{ 
        position:'absolute', 
        inset:0, 
        pointerEvents:'none', 
        zIndex:0,
        background: 'radial-gradient(circle at 50% 0%, rgba(139,92,246,0.08) 0%, transparent 70%)',
      }}/>

      {/* Header mejorado */}
      <div style={{
        flexShrink:0, 
        padding: '10px 16px', 
        zIndex:1,
        display:'flex', 
        alignItems:'center', 
        gap: 10,
        borderBottom: '1px solid rgba(139,92,246,0.15)',
        background: 'rgba(15,15,23,0.8)',
        backdropFilter: 'blur(12px)',
      }}>
        <RobotAvatar />
        <div style={{ flex:1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <p style={{ color: '#f1f5f9', fontWeight: 600, fontSize: 15 }}>LLaMA IA</p>
            <span style={{
              fontSize: 10,
              background: 'rgba(139,92,246,0.15)',
              color: '#c4b5fd',
              padding: '2px 6px',
              borderRadius: 20,
              border: '1px solid rgba(139,92,246,0.3)',
            }}>v3.3 70B</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <motion.span 
              animate={{ opacity:[1,0.4,1] }} 
              transition={{ duration:1.8, repeat:Infinity }}
              style={{ width:6, height:6, borderRadius:'50%', background:'#14b8a6', display:'inline-block' }}
            />
            <span style={{ fontSize: 11, color: '#94a3b8' }}>Conectado · Groq</span>
          </div>
        </div>
        {hasChat && (
          <motion.button 
            whileHover={{ scale:1.03 }} 
            whileTap={{ scale:.95 }} 
            onClick={clearChat}
            style={{ 
              padding: '6px 12px', 
              borderRadius: 10, 
              border: '1px solid rgba(244,63,94,0.2)',
              background: 'rgba(244,63,94,0.05)', 
              color: '#f87171', 
              cursor: 'pointer', 
              fontSize: 11, 
              fontWeight: 500,
              backdropFilter: 'blur(8px)',
            }}
          >🗑️ Limpiar</motion.button>
        )}
      </div>

      {/* Mensajes */}
      <div style={{ 
        flex:1, 
        overflowY:'auto', 
        padding: '16px 18px', 
        display:'flex', 
        flexDirection:'column', 
        zIndex:1,
        scrollbarWidth: 'thin',
        scrollbarColor: '#4b5563 #1f2937',
      }}>
        <AnimatePresence mode="wait">
          {!hasChat ? (
            <WelcomeScreen key="welcome" onSuggestion={sendMessage} />
          ) : (
            <motion.div 
              key="chat" 
              initial={{ opacity:0 }} 
              animate={{ opacity:1 }} 
              style={{ display:'flex', flexDirection:'column' }}
            >
              {messages.map((msg, i) => <MessageBubble key={msg.id} msg={msg} index={i} />)}
              {loading && (
                <motion.div 
                  initial={{ opacity:0, y:8 }} 
                  animate={{ opacity:1, y:0 }}
                  style={{ 
                    display:'flex', 
                    alignItems:'flex-end', 
                    gap:8, 
                    marginBottom:14,
                  }}
                >
                  <div style={{ 
                    width:30, height:30, 
                    borderRadius:'10px', 
                    flexShrink:0,
                    background:'linear-gradient(135deg,#8b5cf6,#14b8a6)',
                    display:'flex', 
                    alignItems:'center', 
                    justifyContent:'center', 
                    fontSize:15,
                    boxShadow: '0 4px 10px rgba(139,92,246,0.2)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>🤖</div>
                  <div style={{ 
                    background: 'rgba(30,30,45,0.6)', 
                    border: '1px solid rgba(139,92,246,0.2)', 
                    borderRadius: '18px 18px 18px 6px',
                    backdropFilter: 'blur(8px)',
                  }}>
                    <TypingDots />
                  </div>
                </motion.div>
              )}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity:0, y:6 }} 
                    animate={{ opacity:1, y:0 }} 
                    exit={{ opacity:0 }}
                    style={{ 
                      margin:'4px auto 12px', 
                      padding:'8px 16px', 
                      borderRadius: 12, 
                      fontSize: 12,
                      background: 'rgba(244,63,94,0.08)', 
                      border: '1px solid rgba(244,63,94,0.2)', 
                      color: '#fb7185',
                      backdropFilter: 'blur(8px)',
                    }}
                  >⚠️ {error}</motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>

      {/* Input mejorado */}
      <div style={{ 
        flexShrink:0, 
        padding: '12px 16px', 
        zIndex:1,
        borderTop: '1px solid rgba(139,92,246,0.12)', 
        background: 'rgba(15,15,23,0.8)', 
        backdropFilter: 'blur(12px)',
        display:'flex', 
        gap:10, 
        alignItems:'flex-end' 
      }}>
        <textarea 
          ref={inputRef} 
          value={input}
          onChange={e => { 
            setInput(e.target.value); 
            e.target.style.height='auto'; 
            e.target.style.height=Math.min(e.target.scrollHeight, 100)+'px'; 
          }}
          onKeyDown={e => { if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();sendMessage();} }}
          placeholder="Escribe tu mensaje..." 
          rows={1} 
          disabled={loading}
          style={{ 
            flex:1, 
            resize:'none', 
            borderRadius: 16, 
            padding: '10px 16px',
            background: 'rgba(30,30,45,0.4)', 
            border: '1px solid rgba(139,92,246,0.2)',
            color: '#f1f5f9', 
            fontSize: 13.5, 
            fontFamily: 'Inter, sans-serif',
            outline: 'none', 
            minHeight: 42, 
            maxHeight: 100, 
            lineHeight: 1.5,
            transition: 'all 0.2s',
          }}
          onFocus={e => { 
            e.target.style.borderColor = '#8b5cf6'; 
            e.target.style.boxShadow = '0 0 0 2px rgba(139,92,246,0.15)';
          }}
          onBlur={e =>  { 
            e.target.style.borderColor = 'rgba(139,92,246,0.2)';  
            e.target.style.boxShadow = 'none';
          }}
        />
        <motion.button
          whileHover={{ scale: input.trim()&&!loading ? 1.05 : 1 }}
          whileTap={{ scale: input.trim()&&!loading ? 0.95 : 1 }}
          onClick={() => sendMessage()} 
          disabled={!input.trim()||loading}
          style={{ 
            width: 42, 
            height: 42, 
            borderRadius: 14, 
            border: 'none',
            cursor: input.trim()&&!loading ? 'pointer' : 'default',
            background: input.trim()&&!loading 
              ? 'linear-gradient(135deg,#8b5cf6,#14b8a6)' 
              : 'rgba(30,30,45,0.4)',
            color: input.trim()&&!loading ? '#fff' : '#6b7280',
            display:'flex', 
            alignItems:'center', 
            justifyContent:'center',
            boxShadow: input.trim()&&!loading ? '0 4px 12px rgba(139,92,246,0.3)' : 'none',
            transition:'all 0.2s',
            flexShrink:0,
          }}
        >
          {loading ? (
            <motion.span 
              animate={{ rotate:360 }} 
              transition={{ duration:0.8, repeat:Infinity, ease:'linear' }}
              style={{ 
                width: 16, 
                height: 16, 
                borderRadius:'50%', 
                border: '2px solid rgba(255,255,255,0.2)', 
                borderTopColor: 'white', 
                display:'inline-block' 
              }}
            />
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width:16, height:16 }}>
              <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z"/>
            </svg>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}