import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';
import { getIO } from '../config/socket.js';
import { AppError } from '../middlewares/errorMiddleware.js';

const UPLOAD_DIR = path.join(process.cwd(), 'uploads', 'files');
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

function getMessageType(mimetype) {
  const base = (mimetype || '').split(';')[0].trim().toLowerCase();
  if (base.startsWith('image/')) return 'image';
  if (base.startsWith('video/')) return 'video';
  if (base.startsWith('audio/')) return 'audio';
  return 'file';
}

function getExtension(mimetype, originalName) {
  const base = (mimetype || '').split(';')[0].trim().toLowerCase();
  const mimeToExt = {
    'audio/webm': '.webm', 'audio/ogg': '.ogg', 'audio/mpeg': '.mp3',
    'audio/mp3': '.mp3',   'audio/wav': '.wav',  'audio/mp4': '.m4a',
    'audio/x-m4a': '.m4a', 'audio/aac': '.aac',
    'video/mp4': '.mp4',   'video/webm': '.webm',
    'image/jpeg': '.jpg',  'image/png': '.png',
    'image/gif': '.gif',   'image/webp': '.webp',
  };
  return mimeToExt[base] || path.extname(originalName || '') || '.bin';
}

export async function uploadFile(req, res, next) {
  try {
    if (!req.file)
      throw new AppError('No se recibió archivo', 400, 'Selecciona un archivo');

    const { conversationId } = req.body;
    if (!conversationId)
      throw new AppError('conversationId es requerido', 400, '');

    const [conv] = await pool.execute(
      'SELECT id, user1_id, user2_id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
      [conversationId, req.user.id, req.user.id]
    );
    if (!conv.length)
      throw new AppError('No tienes acceso a esta conversación', 403, '');

    const messageType = getMessageType(req.file.mimetype);
    const ext         = getExtension(req.file.mimetype, req.file.originalname);
    const storedName  = `${uuidv4()}${ext}`;
    const filePath    = path.join(UPLOAD_DIR, storedName);

    await fs.writeFile(filePath, req.file.buffer);

    const conn = await pool.getConnection();
    let msgId;
    try {
      await conn.beginTransaction();
      const cleanMime = req.file.mimetype.split(';')[0].trim();

      const [msgResult] = await conn.execute(
        'INSERT INTO messages (conversation_id, sender_id, content, iv, message_type) VALUES (?, ?, ?, ?, ?)',
        [conversationId, req.user.id, storedName, 'no-encryption', messageType]
      );
      msgId = msgResult.insertId;

      await conn.execute(
        'INSERT INTO files (message_id, original_name, stored_name, mime_type, size_bytes, encryption_iv) VALUES (?, ?, ?, ?, ?, ?)',
        [msgId, req.file.originalname || `file${ext}`, storedName, cleanMime, req.file.size, 'no-encryption']
      );
      await conn.commit();
    } catch {
      await conn.rollback();
      await fs.unlink(filePath).catch(() => {});
      throw new AppError('Error al registrar el archivo', 500, 'Intenta de nuevo');
    } finally {
      conn.release();
    }

    const message = {
      id:              msgId,
      conversationId:  parseInt(conversationId),
      conversation_id: parseInt(conversationId),
      sender_id:       req.user.id,
      senderId:        req.user.id,
      content:         storedName,
      messageType,
      message_type:    messageType,
      createdAt:       new Date().toISOString(),
      created_at:      new Date().toISOString(),
      fileUrl:         `/api/files/${msgId}`,
    };

    // ── CLAVE: emitir a todos en la sala incluyendo el otro usuario ──
    const io = getIO();
    if (io) {
      io.to(`conv:${conversationId}`).emit('message:received', message);
    }

    res.status(201).json({ status: 'success', messageId: msgId, type: messageType, message });
  } catch (err) {
    next(err);
  }
}

export async function downloadFile(req, res, next) {
  try {
    const { messageId } = req.params;
    const [rows] = await pool.execute(
      `SELECT f.*, m.conversation_id FROM files f
       JOIN messages m ON m.id = f.message_id WHERE f.message_id = ?`,
      [messageId]
    );
    if (!rows.length) throw new AppError('Archivo no encontrado', 404, '');

    const file = rows[0];
    const [conv] = await pool.execute(
      'SELECT id FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
      [file.conversation_id, req.user.id, req.user.id]
    );
    if (!conv.length) throw new AppError('Sin permiso', 403, '');

    const filePath = path.join(UPLOAD_DIR, file.stored_name);
    let buf;
    try { buf = await fs.readFile(filePath); }
    catch { throw new AppError('Archivo no encontrado en servidor', 404, ''); }

    res.setHeader('Content-Type',        file.mime_type || 'application/octet-stream');
    res.setHeader('Content-Disposition', `inline; filename="${file.original_name}"`);
    res.setHeader('Content-Length',      buf.length);
    res.setHeader('Cache-Control',       'private, max-age=3600');
    res.send(buf);
  } catch (err) {
    next(err);
  }
}