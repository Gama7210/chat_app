import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSocket } from '../../services/socketService';
import AudioRecorder from './AudioRecorder';
import api from '../../services/api';

const ALLOWED_TYPES = 'image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,audio/mpeg,audio/ogg,audio/wav,audio/mp3';
const AC_DELAY = 1200;

export default function MessageInput({ onSend, onFileSent, conversationId, currentUserId }) {
  const [text,         setText]         = useState('');
  const [uploading,    setUploading]    = useState(false);
  const [fileError,    setFileError]    = useState(null);
  const [preview,      setPreview]      = useState(null);
  const [pendingFile,  setPendingFile]  = useState(null);
  const [showRecorder, setShowRecorder] = useState(false);
  const [suggestion,   setSuggestion]   = useState(null);
  const [correcting,   setCorrecting]   = useState(false);
  const [acEnabled,    setAcEnabled]    = useState(true);

  const typingTimer  = useRef(null);
  const correctTimer = useRef(null);
  const fileRef      = useRef(null);
  const textareaRef  = useRef(null);

  useEffect(() => () => {
    clearTimeout(typingTimer.current);
    clearTimeout(correctTimer.current);
  }, []);

  const emitTyping = useCallback((t) => {
    getSocket()?.emit(t ? 'typing:start' : 'typing:stop', { conversationId });
  }, [conversationId]);

  const requestCorrection = useCallback(async (value) => {
    if (!value.trim() || value.trim().length < 4) { setSuggestion(null); return; }
    setCorrecting(true);
    try {
      const { data } = await api.post('/autocorrect', { text: value });
      if (data.changed && data.corrected !== value.trim()) setSuggestion(data.corrected);
      else setSuggestion(null);
    } catch { setSuggestion(null); }
    finally { setCorrecting(false); }
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setText(val);
    setSuggestion(null);
    emitTyping(true);
    clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 1500);
    clearTimeout(correctTimer.current);
    if (acEnabled && val.trim().length >= 4)
      correctTimer.current = setTimeout(() => requestCorrection(val), AC_DELAY);
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }
  };

  const doSend = (msg) => {
    const m = (msg || text).trim();
    if (!m) return;
    onSend(m);
    setText(''); setSuggestion(null); setCorrecting(false);
    clearTimeout(correctTimer.current);
    emitTyping(false); clearTimeout(typingTimer.current);
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
    if (e.key === 'Tab' && suggestion)    { e.preventDefault(); acceptSuggestion(); }
  };

  const acceptSuggestion = () => {
    if (!suggestion) return;
    setText(suggestion); setSuggestion(null);
    textareaRef.current?.focus();
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 120) + 'px'; }
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileError(null);
    if (!ALLOWED_TYPES.split(',').includes(file.type)) {
      setFileError({ message:'Formato no permitido', solution:'Usa imágenes, videos o audios' });
      e.target.value = ''; return;
    }
    if (file.size > 50 * 1024 * 1024) {
      setFileError({ message:'El archivo supera 50 MB', solution:'Elige un archivo más pequeño' });
      e.target.value = ''; return;
    }
    setPendingFile(file);
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('image/'))      setPreview({ type:'image', url, name:file.name, size:file.size });
    else if (file.type.startsWith('video/')) setPreview({ type:'video', url, name:file.name, size:file.size });
    else if (file.type.startsWith('audio/')) setPreview({ type:'audio', url, name:file.name, size:file.size });
    e.target.value = '';
  };

  const cancelPreview = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null); setPendingFile(null);
  };

  const sendFile = async () => {
    if (!pendingFile) return;
    setUploading(true);
    const fd = new FormData();
    fd.append('file', pendingFile);
    fd.append('conversationId', conversationId);
    try {
      const { data } = await api.post('/files/upload', fd, { headers:{ 'Content-Type':'multipart/form-data' } });
      if (data.message) onFileSent?.(data.message);
      cancelPreview();
    } catch (err) {
      setFileError(err.response?.data || { message:'Error al subir', solution:'Intenta de nuevo' });
      setTimeout(() => setFileError(null), 6000);
    } finally { setUploading(false); }
  };

  // Estilos inline para coincidir con el nuevo tema
  const inputBg      = 'rgba(255,255,255,.04)';
  const inputBorder  = 'rgba(120,80,255,.2)';
  const inputBorderF = 'rgba(124,58,237,.7)';
  const surface      = 'rgba(14,14,42,.9)';
  const border       = 'rgba(120,80,255,.15)';

  return (
    <div style={{
      borderTop: `1px solid ${border}`,
      background: 'rgba(10,10,28,.8)',
      backdropFilter: 'blur(20px)',
    }}>

      {/* Grabador de audio */}
      <AnimatePresence>
        {showRecorder && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }} style={{ overflow:'hidden', paddingTop:12 }}>
            <AudioRecorder conversationId={conversationId}
              onAudioSent={(msg) => { onFileSent?.(msg); setShowRecorder(false); }}
              onCancel={() => setShowRecorder(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Preview archivo */}
      <AnimatePresence>
        {preview && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            style={{ overflow:'hidden', padding:'12px 16px 0' }}
          >
            <div style={{ background:surface, borderRadius:16, padding:12, border:`1px solid ${border}` }}>
              <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
                <div style={{ flexShrink:0 }}>
                  {preview.type==='image' && <img src={preview.url} alt="" style={{ width:72,height:72,borderRadius:10,objectFit:'cover' }} />}
                  {preview.type==='video' && <video src={preview.url} style={{ width:72,height:72,borderRadius:10,objectFit:'cover' }} muted />}
                  {preview.type==='audio' && (
                    <div style={{ width:72,height:72,borderRadius:10,background:'rgba(124,58,237,.15)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:28 }}>🎵</div>
                  )}
                </div>
                <div style={{ flex:1, minWidth:0 }}>
                  <p style={{ color:'var(--text)',fontSize:13,fontWeight:500,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }}>{preview.name}</p>
                  <p style={{ color:'var(--muted)',fontSize:11,marginTop:3 }}>{(preview.size/1024/1024).toFixed(2)} MB</p>
                  {preview.type==='audio' && <audio src={preview.url} controls style={{ marginTop:8,width:'100%',height:32 }} />}
                </div>
                <button onClick={cancelPreview} disabled={uploading}
                  style={{ color:'var(--muted)',padding:'2px 6px',fontSize:16,cursor:'pointer',background:'none',border:'none',flexShrink:0 }}
                >✕</button>
              </div>
              <button onClick={sendFile} disabled={uploading}
                className="btn-primary"
                style={{ marginTop:10,width:'100%',padding:'8px',fontSize:13,textAlign:'center',cursor:uploading?'not-allowed':'pointer' }}
              >
                {uploading
                  ? <span style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8 }}>
                      <span style={{ width:14,height:14,border:'2px solid rgba(255,255,255,.3)',borderTopColor:'white',borderRadius:'50%',display:'inline-block',animation:'spin .7s linear infinite' }}/>
                      Enviando...
                    </span>
                  : `➤ Enviar ${preview.type==='image'?'imagen':preview.type==='video'?'video':'audio'}`
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error */}
      <AnimatePresence>
        {fileError && (
          <motion.div initial={{ opacity:0, height:0 }} animate={{ opacity:1, height:'auto' }} exit={{ opacity:0, height:0 }}
            style={{ overflow:'hidden', padding:'8px 16px 0' }}
          >
            <div style={{ background:'rgba(244,63,94,.1)',border:'1px solid rgba(244,63,94,.25)',borderRadius:12,padding:'8px 12px',fontSize:13 }}>
              <p style={{ color:'#fb7185',fontWeight:600 }}>⚠️ {fileError.message}</p>
              {fileError.solution && <p style={{ color:'#fca5a5',fontSize:11,marginTop:2 }}>💡 {fileError.solution}</p>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sugerencia autocorrector */}
      <AnimatePresence>
        {(suggestion || correcting) && (
          <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:4 }}
            style={{ margin:'10px 16px 0', borderRadius:16, overflow:'hidden', border:'1px solid rgba(124,58,237,.3)', background:surface }}
          >
            {correcting ? (
              <div style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px' }}>
                <span style={{ width:14,height:14,border:'2px solid rgba(168,85,247,.5)',borderTopColor:'#a855f7',borderRadius:'50%',display:'inline-block',animation:'spin .8s linear infinite',flexShrink:0 }}/>
                <span style={{ color:'var(--muted)',fontSize:12 }}>Revisando ortografía...</span>
              </div>
            ) : (
              <>
                <div style={{ display:'flex',alignItems:'center',gap:8,padding:'8px 14px 4px' }}>
                  <span style={{ fontSize:14 }}>✏️</span>
                  <span style={{ color:'#a855f7',fontSize:12,fontWeight:600 }}>Corrección sugerida</span>
                  <span style={{ color:'var(--muted)',fontSize:11,marginLeft:'auto' }}>Tab = aceptar</span>
                </div>
                <p style={{ color:'var(--text)',fontSize:13,padding:'0 14px 10px',lineHeight:1.5 }}>{suggestion}</p>
                <div style={{ display:'flex',borderTop:`1px solid ${border}` }}>
                  {[
                    { label:'✕ Ignorar',  action:()=>setSuggestion(null),  color:'var(--muted)',  hover:'#f87171' },
                    { label:'✓ Aplicar',  action:acceptSuggestion,          color:'#a855f7',       hover:'#fff'    },
                    { label:'➤ Enviar así', action:()=>doSend(suggestion),  color:'#10b981',       hover:'#fff'    },
                  ].map((btn,i) => (
                    <button key={i} onClick={btn.action}
                      style={{ flex:1,padding:'8px 4px',fontSize:12,fontWeight:500,background:'none',border:'none',color:btn.color,cursor:'pointer',
                        borderLeft: i>0 ? `1px solid ${border}` : 'none', transition:'all .2s' }}
                      onMouseEnter={e => { e.currentTarget.style.color=btn.hover; e.currentTarget.style.background='rgba(255,255,255,.04)'; }}
                      onMouseLeave={e => { e.currentTarget.style.color=btn.color; e.currentTarget.style.background='transparent'; }}
                    >{btn.label}</button>
                  ))}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input row */}
      <div style={{ display:'flex', alignItems:'flex-end', gap:8, padding:'10px 14px 12px' }}>
        {/* Adjuntar */}
        <motion.button whileTap={{ scale:.9 }} onClick={() => fileRef.current?.click()}
          disabled={uploading || !!preview || showRecorder}
          title="Adjuntar archivo"
          style={{ padding:'9px',borderRadius:12,border:`1px solid ${inputBorder}`,background:'transparent',color:'var(--muted)',cursor:'pointer',fontSize:16,flexShrink:0,transition:'all .2s' }}
          onMouseEnter={e => { e.currentTarget.style.color='#a855f7'; e.currentTarget.style.borderColor='rgba(168,85,247,.5)'; e.currentTarget.style.background='rgba(124,58,237,.08)'; }}
          onMouseLeave={e => { e.currentTarget.style.color='var(--muted)'; e.currentTarget.style.borderColor=inputBorder; e.currentTarget.style.background='transparent'; }}
        >📎</motion.button>
        <input ref={fileRef} type="file" accept={ALLOWED_TYPES} style={{ display:'none' }} onChange={handleFileSelect} />

        {/* Mic */}
        <motion.button whileTap={{ scale:.9 }}
          onClick={() => { setShowRecorder(p=>!p); cancelPreview(); }}
          disabled={uploading || !!preview}
          title="Grabar audio"
          style={{
            padding:'9px', borderRadius:12, flexShrink:0, cursor:'pointer', fontSize:16, transition:'all .2s',
            ...(showRecorder
              ? { border:'1px solid rgba(244,63,94,.4)', background:'rgba(244,63,94,.1)', color:'#f87171' }
              : { border:`1px solid ${inputBorder}`, background:'transparent', color:'var(--muted)' }
            )
          }}
          onMouseEnter={e => { if(!showRecorder){ e.currentTarget.style.color='#f87171'; e.currentTarget.style.borderColor='rgba(244,63,94,.4)'; e.currentTarget.style.background='rgba(244,63,94,.08)'; } }}
          onMouseLeave={e => { if(!showRecorder){ e.currentTarget.style.color='var(--muted)'; e.currentTarget.style.borderColor=inputBorder; e.currentTarget.style.background='transparent'; } }}
        >🎙️</motion.button>

        {/* Autocorrector toggle */}
        <div style={{ position:'relative', flexShrink:0 }}>
          <motion.button whileTap={{ scale:.9 }}
            onClick={() => { setAcEnabled(p=>!p); setSuggestion(null); }}
            title={acEnabled ? 'Autocorrector ON' : 'Autocorrector OFF'}
            style={{
              padding:'9px', borderRadius:12, cursor:'pointer', fontSize:16, transition:'all .2s',
              ...(acEnabled
                ? { border:'1px solid rgba(124,58,237,.4)', background:'rgba(124,58,237,.12)', color:'#a855f7' }
                : { border:`1px solid ${inputBorder}`, background:'transparent', color:'var(--muted)' }
              )
            }}
          >✏️</motion.button>
          <span style={{
            position:'absolute', top:4, right:4,
            width:7, height:7, borderRadius:'50%',
            border:'1.5px solid rgba(10,10,28,.9)',
            background: acEnabled ? '#10b981' : '#4b5563',
            transition:'background .3s',
          }}/>
        </div>

        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={acEnabled ? 'Escribe... (se corrige automáticamente ✏️)' : 'Escribe un mensaje...'}
          rows={1}
          disabled={uploading}
          style={{
            flex:1,
            resize:'none',
            background: inputBg,
            border: `1px solid ${inputBorder}`,
            borderRadius:14,
            padding:'10px 14px',
            color:'var(--text)',
            fontSize:14,
            fontFamily:'Outfit, sans-serif',
            outline:'none',
            minHeight:42,
            maxHeight:120,
            lineHeight:1.5,
            transition:'border-color .25s, box-shadow .25s',
            scrollbarWidth:'none',
          }}
          onFocus={e => { e.target.style.borderColor=inputBorderF; e.target.style.boxShadow='0 0 0 3px rgba(124,58,237,.15)'; }}
          onBlur={e =>  { e.target.style.borderColor=inputBorder;  e.target.style.boxShadow='none'; }}
        />

        {/* Enviar */}
        <motion.button
          whileHover={{ scale:1.05 }}
          whileTap={{ scale:.92 }}
          onClick={() => doSend()}
          disabled={!text.trim() || uploading}
          style={{
            flexShrink:0, width:42, height:42, borderRadius:12,
            border:'none', cursor:'pointer',
            background: text.trim() && !uploading
              ? 'linear-gradient(135deg,#7c3aed,#a855f7)'
              : 'rgba(255,255,255,.05)',
            color: text.trim() && !uploading ? '#fff' : 'var(--muted)',
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all .3s',
            boxShadow: text.trim() && !uploading ? '0 4px 16px rgba(124,58,237,.4)' : 'none',
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" style={{ width:18,height:18 }}>
            <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z"/>
          </svg>
        </motion.button>
      </div>
    </div>
  );
}