import path from 'path';
import fs from 'fs/promises';
import { v4 as uuidv4 } from 'uuid';
import pool from '../config/db.js';
import { getIO } from '../config/socket.js';
import { AppError } from '../middlewares/errorMiddleware.js';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads', 'avatars');
fs.mkdir(UPLOADS_DIR, { recursive: true }).catch(console.error);

// ── LISTAR USUARIOS ──────────────────────────────────────────
export async function getUsers(req, res, next) {
  try {
    const [users] = await pool.execute(
      `SELECT id, username, email, avatar_path, status_text, status_emoji, last_seen, created_at
       FROM users WHERE id != ? AND is_active = TRUE ORDER BY username ASC`,
      [req.user.id]
    );
    res.json({ status: 'success', users });
  } catch (err) { next(err); }
}

// ── OBTENER USUARIO POR ID ────────────────────────────────────
export async function getUserById(req, res, next) {
  try {
    const { userId } = req.params;
    const [rows] = await pool.execute(
      `SELECT id, username, email, avatar_path, status_text, status_emoji, last_seen, created_at
       FROM users WHERE id = ? AND is_active = TRUE`,
      [userId]
    );
    if (!rows.length) throw new AppError('Usuario no encontrado', 404, 'El usuario no existe');
    res.json({ status: 'success', user: rows[0] });
  } catch (err) { next(err); }
}

// ── SUBIR AVATAR ──────────────────────────────────────────────
export async function updateAvatar(req, res, next) {
  try {
    if (!req.file) throw new AppError('No se recibió imagen', 400, 'Selecciona una imagen');
    if (!req.file.mimetype.startsWith('image/'))
      throw new AppError('Solo se permiten imágenes', 415, 'Selecciona JPG, PNG o WebP');
    if (req.file.size > 5 * 1024 * 1024)
      throw new AppError('La imagen supera 5 MB', 413, 'Usa una imagen más pequeña');

    const ext      = req.file.mimetype.split('/')[1].replace('jpeg', 'jpg');
    const fileName = `avatar_${req.user.id}_${uuidv4()}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    // Eliminar avatar anterior
    const [current] = await pool.execute('SELECT avatar_path FROM users WHERE id = ?', [req.user.id]);
    if (current[0]?.avatar_path) {
      await fs.unlink(path.join(UPLOADS_DIR, current[0].avatar_path)).catch(() => {});
    }

    await fs.writeFile(filePath, req.file.buffer);
    await pool.execute('UPDATE users SET avatar_path = ? WHERE id = ?', [fileName, req.user.id]);

    const ts = Date.now();

    // ── Emitir a TODOS los usuarios conectados para actualizar en tiempo real
    const io = getIO();
    if (io) {
      io.emit('avatar:updated', {
        userId: req.user.id,
        ts,     // timestamp para busting de caché
      });
    }

    res.json({
      status: 'success',
      avatarUrl: `/api/users/avatar/${req.user.id}?t=${ts}`,
      fileName,
      ts,
    });
  } catch (err) { next(err); }
}

// ── OBTENER AVATAR ────────────────────────────────────────────
export async function getAvatar(req, res, next) {
  try {
    const { userId } = req.params;
    const [rows] = await pool.execute('SELECT avatar_path FROM users WHERE id = ?', [userId]);
    if (!rows.length || !rows[0].avatar_path)
      return res.status(404).json({ status: 'error', message: 'Avatar no encontrado' });

    const fileName = rows[0].avatar_path;
    const filePath = path.join(UPLOADS_DIR, fileName);
    const ext      = path.extname(fileName).toLowerCase();
    const mimes    = { '.jpg':'image/jpeg', '.jpeg':'image/jpeg', '.png':'image/png', '.webp':'image/webp', '.gif':'image/gif' };

    res.setHeader('Content-Type',  mimes[ext] || 'image/jpeg');
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma',        'no-cache');
    res.send(await fs.readFile(filePath));
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ status: 'error', message: 'Imagen no encontrada' });
    next(err);
  }
}

// ── OBTENER/CREAR CONVERSACIÓN ────────────────────────────────
export async function getOrCreateConversation(req, res, next) {
  try {
    const { targetUserId } = req.params;
    const userId = req.user.id;
    const u1 = Math.min(parseInt(userId), parseInt(targetUserId));
    const u2 = Math.max(parseInt(userId), parseInt(targetUserId));

    let [rows] = await pool.execute(
      'SELECT * FROM conversations WHERE user1_id = ? AND user2_id = ?', [u1, u2]
    );
    if (!rows.length) {
      const [result] = await pool.execute(
        'INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)', [u1, u2]
      );
      rows = [{ id: result.insertId, user1_id: u1, user2_id: u2 }];
    }
    res.json({ status: 'success', conversation: rows[0] });
  } catch (err) { next(err); }
}