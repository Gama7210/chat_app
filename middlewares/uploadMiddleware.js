import multer from 'multer';
import { AppError } from './errorMiddleware.js';

// ── Tipos permitidos para archivos de chat ───────────────────
const CHAT_MIME_TYPES = {
  // Imágenes
  'image/jpeg': 'image', 'image/jpg': 'image', 'image/png': 'image',
  'image/gif':  'image', 'image/webp': 'image',
  // Videos
  'video/mp4':  'video', 'video/webm': 'video', 'video/quicktime': 'video',
  // Audios — incluir TODOS los formatos que genera el navegador
  'audio/mpeg':      'audio',
  'audio/mp3':       'audio',
  'audio/ogg':       'audio',
  'audio/wav':       'audio',
  'audio/webm':      'audio',   // ← Chrome/Edge graban en este formato
  'audio/mp4':       'audio',   // ← Safari graba en este formato
  'audio/x-m4a':     'audio',
  'audio/aac':       'audio',
};

// ── Tipos permitidos para avatares ───────────────────────────
const AVATAR_MIME_TYPES = {
  'image/jpeg': true, 'image/jpg': true,
  'image/png':  true, 'image/webp': true, 'image/gif': true,
};

const MAX_CHAT_SIZE   = 50 * 1024 * 1024;  // 50 MB
const MAX_AVATAR_SIZE =  5 * 1024 * 1024;  //  5 MB

// ── Upload para archivos de chat ─────────────────────────────
const multerChat = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_CHAT_SIZE },
  fileFilter(req, file, cb) {
    // Aceptar también si el mimetype empieza con audio/ (por si el navegador
    // devuelve variantes como audio/webm;codecs=opus)
    const baseType = file.mimetype.split(';')[0].trim();
    if (CHAT_MIME_TYPES[baseType] || baseType.startsWith('audio/') || baseType.startsWith('video/')) {
      return cb(null, true);
    }
    return cb(new AppError(
      `Formato no permitido: ${file.mimetype}`,
      415,
      'Usa imágenes (JPG, PNG, GIF, WEBP), videos (MP4, WEBM) o audios (MP3, OGG, WAV, WEBM)'
    ));
  },
}).single('file');

// ── Upload para avatares ─────────────────────────────────────
const multerAvatar = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: MAX_AVATAR_SIZE },
  fileFilter(req, file, cb) {
    const baseType = file.mimetype.split(';')[0].trim();
    if (AVATAR_MIME_TYPES[baseType]) return cb(null, true);
    return cb(new AppError('Solo se permiten imágenes para el avatar', 415, 'Usa JPG, PNG o WebP'));
  },
}).single('file');

// ── Wrappers ─────────────────────────────────────────────────
export function handleUpload(req, res, next) {
  multerChat(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError(`El archivo supera el límite de ${MAX_CHAT_SIZE / 1024 / 1024} MB`, 413, 'Comprime el archivo'));
    }
    if (err instanceof multer.MulterError) {
      return next(new AppError(`Error al procesar archivo: ${err.message}`, 400, 'Verifica el archivo e intenta de nuevo'));
    }
    next(err);
  });
}

export function handleAvatarUpload(req, res, next) {
  multerAvatar(req, res, (err) => {
    if (!err) return next();
    if (err.code === 'LIMIT_FILE_SIZE') {
      return next(new AppError('La imagen supera 5 MB', 413, 'Usa una imagen más pequeña'));
    }
    next(err);
  });
}

export const ALLOWED_TYPES_MAP = CHAT_MIME_TYPES;