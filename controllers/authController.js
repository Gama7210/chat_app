import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../config/db.js';
import { getIO } from '../config/socket.js';
import { sendCredentials, sendNewPassword } from '../services/emailService.js';
import { AppError } from '../middlewares/errorMiddleware.js';

function generatePassword(length = 14) {
  const upper   = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lower   = 'abcdefghijklmnopqrstuvwxyz';
  const digits  = '0123456789';
  const special = '!@#$%&*';
  const all     = upper + lower + digits + special;
  const pwd = [
    upper[Math.floor(Math.random() * upper.length)],
    lower[Math.floor(Math.random() * lower.length)],
    digits[Math.floor(Math.random() * digits.length)],
    special[Math.floor(Math.random() * special.length)],
    ...Array.from({ length: length - 4 }, () => all[Math.floor(Math.random() * all.length)]),
  ];
  return pwd.sort(() => Math.random() - 0.5).join('');
}

// ── REGISTRO ─────────────────────────────────────────────────
export async function register(req, res, next) {
  try {
    const { username, email } = req.body;
    if (!username?.trim() || !email?.trim())
      throw new AppError('Nombre de usuario y correo son obligatorios', 400, 'Completa todos los campos');
    if (username.length < 3 || username.length > 30)
      throw new AppError('El nombre de usuario debe tener entre 3 y 30 caracteres', 400, 'Ajusta la longitud');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new AppError('Formato de correo inválido', 400, 'Ingresa un correo electrónico válido');

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? OR username = ?',
      [email.toLowerCase(), username.trim()]
    );
    if (existing.length > 0)
      throw new AppError('El correo o nombre de usuario ya están registrados', 409, 'Intenta con datos diferentes');

    const plainPassword  = generatePassword();
    const hashedPassword = await bcrypt.hash(plainPassword, 12);
    await pool.execute(
      'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)',
      [username.trim(), email.toLowerCase(), hashedPassword]
    );
    await sendCredentials(email.toLowerCase(), username.trim(), plainPassword);

    res.status(201).json({ status: 'success', message: 'Cuenta creada. Revisa tu correo para obtener tu contraseña.' });
  } catch (err) { next(err); }
}

// ── LOGIN ─────────────────────────────────────────────────────
export async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      throw new AppError('Correo y contraseña son obligatorios', 400, 'Completa todos los campos');

    const [rows] = await pool.execute(
      'SELECT * FROM users WHERE email = ? AND is_active = TRUE',
      [email.toLowerCase()]
    );

    if (rows.length === 0)
      throw new AppError('Correo o contraseña incorrectos', 401, 'Verifica que el correo esté bien escrito');

    const user  = rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid)
      throw new AppError('Correo o contraseña incorrectos', 401, 'La contraseña no coincide con este correo');

    await pool.execute('UPDATE users SET last_seen = NOW() WHERE id = ?', [user.id]);

    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge:   7 * 24 * 60 * 60 * 1000,
    });

    res.json({
      status: 'success',
      user: { id: user.id, username: user.username, email: user.email, avatar: user.avatar_path },
      token,
    });
  } catch (err) { next(err); }
}

// ── LOGOUT ────────────────────────────────────────────────────
export async function logout(req, res) {
  res.clearCookie('token');
  res.json({ status: 'success', message: 'Sesión cerrada' });
}

// ── VERIFICAR SESIÓN ──────────────────────────────────────────
export async function me(req, res, next) {
  try {
    const [rows] = await pool.execute(
      'SELECT id, username, email, avatar_path, status_text, status_emoji, last_seen FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) throw new AppError('Usuario no encontrado', 404, 'Inicia sesión nuevamente');
    res.json({ status: 'success', user: rows[0] });
  } catch (err) { next(err); }
}

// ── CAMBIAR CONTRASEÑA ────────────────────────────────────────
export async function changePassword(req, res, next) {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword)
      throw new AppError('Ambas contraseñas son obligatorias', 400, 'Completa todos los campos');
    if (newPassword.length < 8)
      throw new AppError('La nueva contraseña debe tener al menos 8 caracteres', 400, 'Usa una contraseña más larga');

    const [rows] = await pool.execute('SELECT password_hash FROM users WHERE id = ?', [req.user.id]);
    if (!rows.length) throw new AppError('Usuario no encontrado', 404, '');

    const valid = await bcrypt.compare(currentPassword, rows[0].password_hash);
    if (!valid) throw new AppError('La contraseña actual es incorrecta', 401, 'Verifica tu contraseña actual');

    const hashed = await bcrypt.hash(newPassword, 12);
    await pool.execute('UPDATE users SET password_hash = ? WHERE id = ?', [hashed, req.user.id]);

    res.json({ status: 'success', message: 'Contraseña actualizada correctamente' });
  } catch (err) { next(err); }
}

// ── ACTUALIZAR ESTADO ─────────────────────────────────────────
export async function updateStatus(req, res, next) {
  try {
    const { status_text, status_emoji } = req.body;
    if (!status_text?.trim())
      throw new AppError('El texto del estado no puede estar vacío', 400, 'Escribe algo');
    if (status_text.length > 100)
      throw new AppError('El estado no puede superar 100 caracteres', 400, 'Acórtalo un poco');

    await pool.execute(
      'UPDATE users SET status_text = ?, status_emoji = ? WHERE id = ?',
      [status_text.trim(), status_emoji || '🟢', req.user.id]
    );

    const io = getIO();
    if (io) {
      io.emit('status:updated', {
        userId:       req.user.id,
        status_text:  status_text.trim(),
        status_emoji: status_emoji || '🟢',
      });
    }

    res.json({ status: 'success', status_text: status_text.trim(), status_emoji: status_emoji || '🟢' });
  } catch (err) { next(err); }
}

// ── RECUPERAR CONTRASEÑA — manda nueva contraseña directamente ─
export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    if (!email) throw new AppError('El correo es obligatorio', 400, 'Ingresa tu correo electrónico');

    const [rows] = await pool.execute(
      'SELECT id, username FROM users WHERE email = ? AND is_active = TRUE',
      [email.toLowerCase()]
    );

    // Respuesta genérica aunque no exista (seguridad)
    if (rows.length > 0) {
      const newPassword  = generatePassword();
      const hashedPassword = await bcrypt.hash(newPassword, 12);

      await pool.execute(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [hashedPassword, rows[0].id]
      );

      await sendNewPassword(email.toLowerCase(), rows[0].username, newPassword);
    }

    res.json({
      status:  'success',
      message: 'Si el correo está registrado, recibirás tu nueva contraseña en breve.',
    });
  } catch (err) { next(err); }
}