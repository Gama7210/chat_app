import { useState } from 'react';
import { motion } from 'framer-motion';

export default function MessageBubble({ message, isOwn, prevMsg }) {
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError,  setImgError]  = useState(false);

  const content     = message.content;
  const messageType = message.message_type || message.messageType || 'text';
  const createdAt   = message.created_at   || message.createdAt;
  const messageId   = message.id;

  // Agrupar mensajes consecutivos del mismo remitente
  const prevSender = prevMsg?.sender_id ?? prevMsg?.senderId;
  const curSender  = message.sender_id  ?? message.senderId;
  const isGrouped  = prevSender && String(prevSender) === String(curSender);

  const time = createdAt
    ? new Date(createdAt).toLocaleTimeString('es-MX', { hour:'2-digit', minute:'2-digit' })
    : '';

  // ── Contenido según tipo ─────────────────────────────────
  const renderContent = () => {
    switch (messageType) {

      case 'image':
        return (
          <div style={{ position:'relative', borderRadius:12, overflow:'hidden', maxWidth:280 }}>
            {!imgLoaded && !imgError && (
              <div className="shimmer" style={{ width:220, height:160, borderRadius:12 }} />
            )}
            {!imgError && (
              <img
                src={`/api/files/${messageId}`}
                alt="Imagen"
                onLoad={() => setImgLoaded(true)}
                onError={() => setImgError(true)}
                onClick={() => window.open(`/api/files/${messageId}`, '_blank')}
                style={{
                  display: imgLoaded ? 'block' : 'none',
                  maxWidth: 280, width:'100%',
                  borderRadius: 12,
                  cursor:'pointer',
                  transition:'opacity .2s',
                }}
              />
            )}
            {imgError && (
              <div style={{
                width:160, height:100, borderRadius:12,
                display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:6,
                background:'rgba(255,255,255,.04)', border:'1px solid var(--border)',
                fontSize:12, color:'var(--muted)',
              }}>
                <span style={{ fontSize:28 }}>🖼️</span>
                <span>Imagen no disponible</span>
              </div>
            )}
          </div>
        );

      case 'video':
        return (
          <video
            src={`/api/files/${messageId}`}
            controls
            preload="metadata"
            style={{
              maxWidth:300, width:'100%', maxHeight:220,
              borderRadius:12,
              background:'#000',
            }}
          />
        );

      case 'audio':
        return (
          <div style={{
            display:'flex', alignItems:'center', gap:10,
            padding:'8px 12px',
            background: isOwn ? 'rgba(0,0,0,.2)' : 'rgba(124,58,237,.1)',
            borderRadius:12, minWidth:200, maxWidth:300,
          }}>
            <span style={{ fontSize:22, flexShrink:0 }}>🎵</span>
            <audio
              src={`/api/files/${messageId}`}
              controls
              style={{ flex:1, height:32, minWidth:0 }}
            />
          </div>
        );

      default:
        return (
          <p style={{
            wordBreak:'break-word',
            whiteSpace:'pre-wrap',
            lineHeight:1.55,
            fontSize:14,
          }}>
            {content}
          </p>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity:0, y:10, scale:.97 }}
      animate={{ opacity:1, y:0,  scale:1  }}
      transition={{ duration:.18, ease:'easeOut' }}
      style={{
        display:'flex',
        justifyContent: isOwn ? 'flex-end' : 'flex-start',
        marginBottom: isGrouped ? 2 : 8,
        paddingLeft: isOwn ? 48 : 0,
        paddingRight: isOwn ? 0 : 48,
      }}
    >
      <div style={{ maxWidth:'72%', minWidth:0 }}>
        {/* Burbuja */}
        <div style={{
          position:'relative',
          padding: messageType === 'text' ? '10px 14px' : '6px',
          borderRadius: isOwn
            ? '18px 18px 4px 18px'
            : '18px 18px 18px 4px',
          ...(isOwn ? {
            background: 'linear-gradient(135deg,#7c3aed,#a855f7)',
            boxShadow: '0 4px 20px rgba(124,58,237,.35)',
            color: '#fff',
          } : {
            background: 'rgba(255,255,255,.05)',
            border: '1px solid rgba(120,80,255,.12)',
            color: 'var(--text)',
          }),
        }}>
          {renderContent()}

          {/* Hora + leído */}
          <div style={{
            display:'flex',
            alignItems:'center',
            justifyContent:'flex-end',
            gap:4,
            marginTop: messageType==='text' ? 4 : 6,
            paddingRight: messageType!=='text' ? 8 : 0,
          }}>
            <span style={{
              fontSize:11,
              fontFamily:'JetBrains Mono, monospace',
              color: isOwn ? 'rgba(255,255,255,.55)' : 'var(--muted)',
            }}>
              {time}
            </span>
            {isOwn && (
              <span style={{
                fontSize:11,
                color: message.isRead ? '#06b6d4' : 'rgba(255,255,255,.45)',
                letterSpacing:-1,
              }}>
                {message.isRead ? '✓✓' : '✓'}
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}