import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';

export default function AudioRecorder({ conversationId, onAudioSent, onCancel }) {
  const [state,     setState]     = useState('idle');
  const [duration,  setDuration]  = useState(0);
  const [audioUrl,  setAudioUrl]  = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [error,     setError]     = useState(null);

  const mediaRecorderRef = useRef(null);
  const chunksRef        = useRef([]);
  const timerRef         = useRef(null);
  const streamRef        = useRef(null);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  const formatTime = (s) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const getSupportedMimeType = () => {
    const types = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/mp4',
    ];
    for (const type of types) {
      if (typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startRecording = async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
      streamRef.current = stream;

      const mimeType = getSupportedMimeType();
      const options  = mimeType ? { mimeType } : {};
      const recorder = new MediaRecorder(stream, options);
      mediaRecorderRef.current = recorder;
      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const actualMime = recorder.mimeType || mimeType || 'audio/webm';
        const blob = new Blob(chunksRef.current, { type: actualMime });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setState('preview');
        streamRef.current?.getTracks().forEach(t => t.stop());
      };

      recorder.start(100);
      setState('recording');
      setDuration(0);
      timerRef.current = setInterval(() => setDuration(d => d + 1), 1000);

    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Sin permiso de micrófono. Permite el acceso en tu navegador.');
      } else if (err.name === 'NotFoundError') {
        setError('No se encontró micrófono en este dispositivo.');
      } else {
        setError(`Error al acceder al micrófono: ${err.message}`);
      }
    }
  };

  const stopRecording = () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
  };

  const cancel = () => {
    clearInterval(timerRef.current);
    if (mediaRecorderRef.current?.state !== 'inactive') {
      mediaRecorderRef.current?.stop();
    }
    streamRef.current?.getTracks().forEach(t => t.stop());
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setState('idle');
    setAudioUrl(null);
    setAudioBlob(null);
    setDuration(0);
    setError(null);
    onCancel?.();
  };

  const sendAudio = async () => {
    if (!audioBlob) return;
    setState('uploading');
    setError(null);

    try {
      const mime     = audioBlob.type || 'audio/webm';
      const cleanMime = mime.split(';')[0].trim();
      const ext = cleanMime.includes('ogg') ? 'ogg'
                : cleanMime.includes('mp4') ? 'm4a'
                : 'webm';

      const file = new File([audioBlob], `audio_${Date.now()}.${ext}`, { type: cleanMime });

      const formData = new FormData();
      formData.append('file', file);
      formData.append('conversationId', String(conversationId));

      const { data } = await api.post('/files/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (data.message) onAudioSent?.(data.message);
      URL.revokeObjectURL(audioUrl);
      setState('idle');
      setAudioUrl(null);
      setAudioBlob(null);
      setDuration(0);

    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Error al enviar audio');
      setState('preview');
    }
  };

  return (
    <div className="px-4 pb-3">
      <AnimatePresence mode="wait">

        {state === 'idle' && (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 bg-gray-800 rounded-2xl p-3 border border-gray-700"
          >
            <motion.button whileTap={{ scale: 0.9 }} onClick={startRecording}
              className="w-12 h-12 bg-red-600 hover:bg-red-500 rounded-full flex items-center justify-center text-white text-xl transition-colors shadow-lg"
            >🎙️</motion.button>
            <div className="flex-1">
              <p className="text-white text-sm font-medium">Grabar audio</p>
              <p className="text-gray-400 text-xs">Presiona el micrófono para comenzar</p>
            </div>
            <button onClick={cancel} className="text-gray-400 hover:text-white transition-colors p-1 text-lg">✕</button>
          </motion.div>
        )}

        {state === 'recording' && (
          <motion.div key="recording" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-3 bg-red-950/40 rounded-2xl p-3 border border-red-700/50"
          >
            <motion.div animate={{ scale: [1, 1.3, 1], opacity: [1, 0.5, 1] }}
              transition={{ repeat: Infinity, duration: 1 }}
              className="w-4 h-4 bg-red-500 rounded-full shrink-0"
            />
            <div className="flex-1">
              <p className="text-red-300 text-sm font-medium">Grabando...</p>
              <p className="text-red-400 text-xl font-mono font-bold tracking-wider">{formatTime(duration)}</p>
            </div>
            <div className="flex items-center gap-0.5 mr-2">
              {[...Array(6)].map((_, i) => (
                <motion.div key={i}
                  animate={{ scaleY: [0.3, 1 + Math.random() * 0.8, 0.3] }}
                  transition={{ repeat: Infinity, duration: 0.4 + i * 0.07, delay: i * 0.05 }}
                  className="w-1 bg-red-400 rounded-full"
                  style={{ height: '20px', transformOrigin: 'center' }}
                />
              ))}
            </div>
            <motion.button whileTap={{ scale: 0.9 }} onClick={stopRecording}
              className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-lg shrink-0"
            >
              <div className="w-4 h-4 bg-red-600 rounded-sm" />
            </motion.button>
          </motion.div>
        )}

        {state === 'preview' && (
          <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="bg-gray-800 rounded-2xl p-3 border border-gray-700 space-y-3"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary-600/30 rounded-full flex items-center justify-center text-xl shrink-0">🎵</div>
              <div className="flex-1">
                <p className="text-white text-sm font-medium">Audio grabado</p>
                <p className="text-gray-400 text-xs">{formatTime(duration)} · Listo para enviar</p>
              </div>
            </div>
            <audio src={audioUrl} controls className="w-full" style={{ height: '38px' }} />
            <div className="flex gap-2">
              <button onClick={cancel}
                className="flex-1 py-2 rounded-xl border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 text-sm transition-all"
              >🗑️ Descartar</button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={sendAudio}
                className="flex-1 btn-primary py-2 text-sm flex items-center justify-center gap-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                  <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z"/>
                </svg>
                Enviar audio
              </motion.button>
            </div>
          </motion.div>
        )}

        {state === 'uploading' && (
          <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center justify-center gap-3 bg-gray-800 rounded-2xl p-4 border border-gray-700"
          >
            <span className="w-5 h-5 border-2 border-primary-400 border-t-transparent rounded-full animate-spin block shrink-0" />
            <span className="text-gray-300 text-sm">Enviando audio...</span>
          </motion.div>
        )}

      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-2 bg-red-900/40 border border-red-700/50 rounded-xl p-2.5 text-sm"
          >
            <p className="text-red-300">⚠️ {error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}