import path from 'path';
import fs from 'fs/promises';
import pool from '../config/db.js';
import { getIO } from '../config/socket.js';
import { decrypt } from '../services/cryptoService.js';
import { AppError } from '../middlewares/errorMiddleware.js';

const FILES_DIR = path.join(process.cwd(), 'uploads', 'files');

// ── OBTENER MENSAJES ──────────────────────────────────────────
export async function getMessages(req, res, next) {
  try {
    const { conversationId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    const [conv] = await pool.execute(
      'SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
      [conversationId, req.user.id, req.user.id]
    );
    if (!conv.length) throw new AppError('Conversación no encontrada', 403, 'Sin acceso');

    const [messages] = await pool.execute(
      `SELECT m.*, f.original_name, f.mime_type, f.size_bytes
       FROM messages m
       LEFT JOIN files f ON f.message_id = m.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at DESC
       LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`,
      [conversationId]
    );

    const decrypted = messages.reverse().map(msg => {
      let content = msg.content;
      if (msg.message_type === 'text') {
        try { content = decrypt(msg.iv, msg.content); }
        catch { content = '[Mensaje no disponible]'; }
      }
      return { ...msg, content };
    });

    res.json({ status: 'success', messages: decrypted, page: parseInt(page) });
  } catch (err) { next(err); }
}

// ── ELIMINAR CONVERSACIÓN (borra mensajes + archivos del disco) ──
export async function deleteConversation(req, res, next) {
  try {
    const { conversationId } = req.params;

    // Verificar que el usuario pertenece a esta conversación
    const [conv] = await pool.execute(
      'SELECT * FROM conversations WHERE id = ? AND (user1_id = ? OR user2_id = ?)',
      [conversationId, req.user.id, req.user.id]
    );
    if (!conv.length) throw new AppError('Conversación no encontrada', 403, 'Sin acceso');

    // Obtener todos los archivos asociados a esta conversación
    const [files] = await pool.execute(
      `SELECT f.stored_name FROM files f
       JOIN messages m ON m.id = f.message_id
       WHERE m.conversation_id = ?`,
      [conversationId]
    );

    // Borrar archivos físicos del disco
    const deletePromises = files.map(f =>
      fs.unlink(path.join(FILES_DIR, f.stored_name)).catch(() => {})
    );
    await Promise.all(deletePromises);

    // Borrar mensajes de la BD (files se eliminan en cascada por FK)
    await pool.execute('DELETE FROM messages WHERE conversation_id = ?', [conversationId]);

    // Notificar por socket a ambos participantes
    const io = getIO();
    if (io) {
      const convData = conv[0];
      const otherUserId = convData.user1_id === req.user.id
        ? convData.user2_id
        : convData.user1_id;

      // Avisar al otro usuario que la conversación fue borrada
      io.to(`user:${otherUserId}`).emit('conversation:cleared', {
        conversationId: parseInt(conversationId),
        clearedBy: req.user.id,
      });
      // También al que lo borró (por si tiene otra pestaña abierta)
      io.to(`user:${req.user.id}`).emit('conversation:cleared', {
        conversationId: parseInt(conversationId),
        clearedBy: req.user.id,
      });
    }

    res.json({
      status: 'success',
      message: `Conversación eliminada. ${files.length} archivo(s) borrado(s).`,
      filesDeleted: files.length,
    });
  } catch (err) { next(err); }
}