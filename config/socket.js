import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { encrypt } from '../services/cryptoService.js';
import { checkProfanity } from '../services/profanityService.js';
import pool from './db.js';

let io;
export function getIO() { return io; }

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin:      process.env.CLIENT_URL || 'http://localhost:5173',
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('No autenticado'));
    try {
      socket.user = jwt.verify(token, process.env.JWT_SECRET);
      next();
    } catch {
      next(new Error('Token inválido o expirado'));
    }
  });

  const onlineUsers = new Map();

  io.on('connection', (socket) => {
    const userId = socket.user.id;
    onlineUsers.set(userId, socket.id);
    console.log(`✅ Usuario ${userId} conectado (${socket.id})`);

    io.emit('user:online', { userId });
    socket.join(`user:${userId}`);
    socket.emit('users:online', Array.from(onlineUsers.keys()));

    // ── Unirse a conversación ─────────────────────────────
    socket.on('join:conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`);
    });

    // ── Enviar mensaje de texto ───────────────────────────
    socket.on('message:send', async (data, ack) => {
      try {
        const { conversationId, content, messageType = 'text' } = data;

        if (!content?.trim()) {
          return ack?.({ status: 'error', code: 400, message: 'Mensaje vacío', solution: 'Escribe algo antes de enviar' });
        }

        const profanityResult = await checkProfanity(content);
        if (profanityResult.found) {
          return ack?.({
            status:   'blocked',
            reason:   'Lenguaje inapropiado detectado',
            words:    profanityResult.words,
            solution: 'Elimina las palabras ofensivas e intenta de nuevo',
          });
        }

        const { iv, encryptedData } = encrypt(content);

        const [result] = await pool.execute(
          'INSERT INTO messages (conversation_id, sender_id, content, iv, message_type) VALUES (?, ?, ?, ?, ?)',
          [conversationId, userId, encryptedData, iv, messageType]
        );

        await pool.execute('UPDATE users SET last_seen = NOW() WHERE id = ?', [userId]);

        const message = {
          id:              result.insertId,
          conversationId,
          conversation_id: conversationId,
          sender_id:       userId,
          senderId:        userId,
          content,
          messageType,
          message_type:    messageType,
          isRead:          false,
          createdAt:       new Date().toISOString(),
          created_at:      new Date().toISOString(),
        };

        io.to(`conv:${conversationId}`).emit('message:received', message);
        ack?.({ status: 'success', messageId: result.insertId });

      } catch (err) {
        console.error('Error en message:send:', err);
        ack?.({ status: 'error', code: 500, message: 'Error al enviar mensaje', solution: 'Intenta de nuevo' });
      }
    });

    // ── Indicador de escritura ────────────────────────────
    socket.on('typing:start', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:update', { userId, isTyping: true });
    });

    socket.on('typing:stop', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('typing:update', { userId, isTyping: false });
    });

    // ── Marcar mensajes como leídos ───────────────────────
    socket.on('messages:read', async ({ conversationId }) => {
      try {
        await pool.execute(
          'UPDATE messages SET is_read = TRUE WHERE conversation_id = ? AND sender_id != ?',
          [conversationId, userId]
        );
        socket.to(`conv:${conversationId}`).emit('messages:read', { conversationId, readBy: userId });
      } catch (err) {
        console.error('Error marcando mensajes como leídos:', err);
      }
    });

    // ── Desconexión ───────────────────────────────────────
    socket.on('disconnect', () => {
      onlineUsers.delete(userId);
      io.emit('user:offline', { userId });
      console.log(`❌ Usuario ${userId} desconectado`);
    });
  });

  return io;
}