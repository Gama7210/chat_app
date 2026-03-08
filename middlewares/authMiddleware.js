import jwt from 'jsonwebtoken';
import { AppError } from './errorMiddleware.js';

export function authenticate(req, res, next) {
  // Buscar token en cookie HttpOnly o header Authorization
  const token = req.cookies?.token
    || req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    return next(new AppError('No autenticado. Inicia sesión para continuar', 401, 'Ve a la página de login'));
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new AppError('Tu sesión ha expirado', 401, 'Inicia sesión nuevamente'));
    }
    next(new AppError('Token inválido', 401, 'Vuelve a iniciar sesión'));
  }
}
