import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const COLORS = ['bg-indigo-600','bg-purple-600','bg-pink-600','bg-blue-600','bg-green-600','bg-orange-600'];

const STATUS_OPTIONS = [
  { emoji: '🟢', text: 'Disponible para chatear' },
  { emoji: '⏰', text: 'Con demora de responder' },
  { emoji: '👥', text: 'Con amigos' },
  { emoji: '✈️',  text: 'De viaje' },
  { emoji: '🤩', text: 'Con entusiasmo' },
  { emoji: '🔕', text: 'No molestar' },
];

// Tabs del perfil
const TABS = ['perfil', 'estado', 'contraseña'];

export default function ProfileModal({ onClose, onAvatarUpdated }) {
  const { user, setUser } = useAuth();
  const [tab,       setTab]       = useState('perfil');
  const [imgError,  setImgError]  = useState(false);
  const [preview,   setPreview]   = useState(null);
  const [file,      setFile]      = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [msg,       setMsg]       = useState(null); // { type: 'success'|'error', text }
  const inputRef = useRef(null);

  // Estado
  const [statusEmoji, setStatusEmoji] = useState(user?.status_emoji || '🟢');
  const [statusText,  setStatusText]  = useState(user?.status_text  || 'Disponible para chatear');
  const [savingStatus, setSavingStatus] = useState(false);

  // Contraseña
  const [pwForm,    setPwForm]    = useState({ current: '', newPw: '', confirm: '' });
  const [showPw,    setShowPw]    = useState({ current: false, newPw: false, confirm: false });
  const [savingPw,  setSavingPw]  = useState(false);

  const initial = user?.username?.[0]?.toUpperCase() || '?';
  const color   = COLORS[(user?.username?.charCodeAt(0) || 0) % COLORS.length];
  const ts      = user?.avatarTimestamp || 0;

  const showMsg = (type, text) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  // ── Cambiar foto ────────────────────────────────────────────
  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith('image/')) { showMsg('error', 'Solo se permiten imágenes'); return; }
    if (f.size > 5 * 1024 * 1024)    { showMsg('error', 'La imagen no puede superar 5 MB'); return; }
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setImgError(false);
  };

  const handleSaveAvatar = async () => {
    if (!file) return;
    setSaving(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      await api.post('/users/avatar', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUser(prev => ({ ...prev, avatarTimestamp: Date.now() }));
      onAvatarUpdated?.();
      setFile(null);
      setPreview(null);
      showMsg('success', '✅ Foto actualizada');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  // ── Guardar estado ──────────────────────────────────────────
  const handleSaveStatus = async () => {
    if (!statusText.trim()) { showMsg('error', 'El estado no puede estar vacío'); return; }
    setSavingStatus(true);
    try {
      await api.post('/auth/update-status', { status_text: statusText, status_emoji: statusEmoji });
      setUser(prev => ({ ...prev, status_text: statusText, status_emoji: statusEmoji }));
      showMsg('success', '✅ Estado actualizado');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Error al guardar estado');
    } finally {
      setSavingStatus(false);
    }
  };

  // ── Cambiar contraseña ──────────────────────────────────────
  const handleChangePassword = async () => {
    if (!pwForm.current || !pwForm.newPw || !pwForm.confirm) {
      showMsg('error', 'Completa todos los campos'); return;
    }
    if (pwForm.newPw.length < 8) { showMsg('error', 'La contraseña debe tener al menos 8 caracteres'); return; }
    if (pwForm.newPw !== pwForm.confirm) { showMsg('error', 'Las contraseñas nuevas no coinciden'); return; }

    setSavingPw(true);
    try {
      await api.post('/auth/change-password', { currentPassword: pwForm.current, newPassword: pwForm.newPw });
      setPwForm({ current: '', newPw: '', confirm: '' });
      showMsg('success', '✅ Contraseña actualizada. Próximo login usa la nueva.');
    } catch (err) {
      showMsg('error', err.response?.data?.message || 'Error al cambiar contraseña');
    } finally {
      setSavingPw(false);
    }
  };

  // ── Render avatar ───────────────────────────────────────────
  const renderAvatar = (size = 'xl') => {
    const sizeClass = size === 'xl' ? 'w-28 h-28 text-5xl' : 'w-16 h-16 text-2xl';
    if (preview) return <img src={preview} alt="preview" className={`${sizeClass} rounded-full object-cover border-4 border-primary-500`} />;
    if (!imgError && ts) return (
      <img src={`/api/users/avatar/${user?.id}?t=${ts}`} alt={user?.username}
        className={`${sizeClass} rounded-full object-cover border-4 border-primary-500 bg-gray-700`}
        onError={() => setImgError(true)} />
    );
    return <div className={`${sizeClass} ${color} rounded-full flex items-center justify-center font-bold text-white border-4 border-primary-500`}>{initial}</div>;
  };

  return (
    <div className="flex flex-col" style={{ minHeight: '480px' }}>

      {/* ── Tabs ─────────────────────────────────────────── */}
      <div className="flex border-b border-gray-700 mb-4">
        {TABS.map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex-1 py-2 text-sm font-medium capitalize transition-colors
              ${tab === t ? 'text-primary-400 border-b-2 border-primary-400' : 'text-gray-400 hover:text-white'}`}
          >
            {t === 'perfil' ? '👤 Perfil' : t === 'estado' ? '💬 Estado' : '🔑 Contraseña'}
          </button>
        ))}
      </div>

      {/* ── Mensajes feedback ────────────────────────────── */}
      <AnimatePresence>
        {msg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className={`mb-3 px-3 py-2 rounded-xl text-sm text-center font-medium
              ${msg.type === 'success' ? 'bg-green-900/40 text-green-300 border border-green-700/50' : 'bg-red-900/40 text-red-300 border border-red-700/50'}`}
          >
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ════════════════════════════════════════════════════
          TAB: PERFIL
      ════════════════════════════════════════════════════ */}
      {tab === 'perfil' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-4">
          {/* Avatar clickeable */}
          <div className="relative cursor-pointer group" onClick={() => inputRef.current?.click()}>
            {renderAvatar('xl')}
            <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center text-white gap-1">
              <span className="text-2xl">📷</span>
              <span className="text-xs font-medium">Cambiar</span>
            </div>
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

          {/* Info */}
          <div className="text-center">
            <p className="text-white font-bold text-xl">{user?.username}</p>
            <p className="text-gray-400 text-sm">{user?.email}</p>
            <div className="flex items-center justify-center gap-1 mt-2">
              <span className="text-lg">{user?.status_emoji || '🟢'}</span>
              <span className="text-gray-300 text-sm">{user?.status_text || 'Disponible para chatear'}</span>
            </div>
          </div>

          {/* Preview seleccionada */}
          {file && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="w-full bg-gray-800 rounded-xl p-3 text-sm text-gray-300 text-center"
            >
              📎 {file.name} · {(file.size / 1024).toFixed(0)} KB
            </motion.div>
          )}

          {file && (
            <div className="flex gap-2 w-full">
              <button onClick={() => { setFile(null); setPreview(null); }}
                className="flex-1 py-2 rounded-xl border border-gray-600 text-gray-400 hover:text-white hover:border-gray-400 text-sm transition-all"
              >Cancelar</button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveAvatar} disabled={saving}
                className="flex-1 btn-primary py-2 text-sm"
              >
                {saving ? 'Guardando...' : '💾 Guardar foto'}
              </motion.button>
            </div>
          )}

          {!file && (
            <p className="text-gray-600 text-xs">Haz clic en la foto para cambiarla</p>
          )}
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: ESTADO
      ════════════════════════════════════════════════════ */}
      {tab === 'estado' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-4">
          <p className="text-gray-400 text-sm text-center">Selecciona cómo te encuentras ahora</p>

          {/* Opciones rápidas */}
          <div className="grid grid-cols-1 gap-2">
            {STATUS_OPTIONS.map(opt => (
              <motion.button
                key={opt.text}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => { setStatusEmoji(opt.emoji); setStatusText(opt.text); }}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left
                  ${statusText === opt.text && statusEmoji === opt.emoji
                    ? 'bg-primary-600/20 border-primary-500/60 text-white'
                    : 'border-gray-700 hover:border-gray-500 text-gray-300 hover:text-white'
                  }`}
              >
                <span className="text-2xl">{opt.emoji}</span>
                <span className="text-sm font-medium">{opt.text}</span>
                {statusText === opt.text && statusEmoji === opt.emoji && (
                  <span className="ml-auto text-primary-400">✓</span>
                )}
              </motion.button>
            ))}
          </div>

          {/* Estado personalizado */}
          <div>
            <label className="block text-xs text-gray-500 mb-1">O escribe un estado personalizado</label>
            <input
              type="text"
              value={statusText}
              onChange={e => setStatusText(e.target.value)}
              maxLength={100}
              placeholder="¿Cómo te encuentras?"
              className="input-field text-sm"
            />
            <p className="text-gray-600 text-xs mt-1 text-right">{statusText.length}/100</p>
          </div>

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleSaveStatus} disabled={savingStatus}
            className="btn-primary py-2.5 w-full"
          >
            {savingStatus ? 'Guardando...' : '💬 Actualizar estado'}
          </motion.button>
        </motion.div>
      )}

      {/* ════════════════════════════════════════════════════
          TAB: CONTRASEÑA
      ════════════════════════════════════════════════════ */}
      {tab === 'contraseña' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col gap-3">
          <p className="text-gray-400 text-sm text-center mb-1">Cambia tu contraseña de acceso</p>

          {/* Contraseña actual */}
          {[
            { key: 'current', label: 'Contraseña actual', placeholder: '••••••••' },
            { key: 'newPw',   label: 'Nueva contraseña',  placeholder: 'Mínimo 8 caracteres' },
            { key: 'confirm', label: 'Confirmar nueva',   placeholder: 'Repite la nueva contraseña' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-400 mb-1">{label}</label>
              <div className="relative">
                <input
                  type={showPw[key] ? 'text' : 'password'}
                  value={pwForm[key]}
                  onChange={e => setPwForm(prev => ({ ...prev, [key]: e.target.value }))}
                  placeholder={placeholder}
                  className="input-field text-sm pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(prev => ({ ...prev, [key]: !prev[key] }))}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPw[key] ? '🙈' : '👁️'}
                </button>
              </div>
            </div>
          ))}

          {/* Indicador de fuerza */}
          {pwForm.newPw && (
            <div className="flex gap-1 mt-1">
              {[1,2,3,4].map(i => (
                <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${
                  pwForm.newPw.length >= i * 3
                    ? i <= 1 ? 'bg-red-500' : i <= 2 ? 'bg-yellow-500' : i <= 3 ? 'bg-blue-500' : 'bg-green-500'
                    : 'bg-gray-700'
                }`} />
              ))}
              <span className="text-xs text-gray-500 ml-1">
                {pwForm.newPw.length < 4 ? 'Muy corta' : pwForm.newPw.length < 7 ? 'Débil' : pwForm.newPw.length < 10 ? 'Regular' : 'Fuerte'}
              </span>
            </div>
          )}

          {/* Coincidencia */}
          {pwForm.confirm && (
            <p className={`text-xs ${pwForm.newPw === pwForm.confirm ? 'text-green-400' : 'text-red-400'}`}>
              {pwForm.newPw === pwForm.confirm ? '✓ Las contraseñas coinciden' : '✗ No coinciden'}
            </p>
          )}

          <motion.button whileTap={{ scale: 0.97 }} onClick={handleChangePassword} disabled={savingPw}
            className="btn-primary py-2.5 w-full mt-1"
          >
            {savingPw ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Cambiando...
              </span>
            ) : '🔑 Cambiar contraseña'}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}