// ── Clase personalizada de errores de la aplicación ─────────
export class AppError extends Error {
  constructor(message, statusCode = 500, solution = 'Intenta más tarde o contacta al administrador') {
    super(message);
    this.statusCode    = statusCode;
    this.solution      = solution;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// ── Middleware global de manejo de errores ───────────────────
export function globalErrorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;
  const isDev      = process.env.NODE_ENV !== 'production';

  // Log detallado en desarrollo
  if (isDev) {
    console.error('❌ ERROR:', {
      message: err.message,
      stack:   err.stack,
      url:     req.originalUrl,
      method:  req.method,
    });
  }

  // Errores de MySQL
  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({
      status:   'error',
      code:     409,
      message:  'El registro ya existe',
      solution: 'Intenta con datos diferentes',
    });
  }

  if (err.code === 'ECONNREFUSED') {
    return res.status(503).json({
      status:   'error',
      code:     503,
      message:  'No se puede conectar a la base de datos',
      solution: 'Verifica que MySQL esté corriendo',
    });
  }

  // Errores de JWT
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      status:   'error',
      code:     401,
      message:  'Token inválido',
      solution: 'Vuelve a iniciar sesión',
    });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      status:   'error',
      code:     401,
      message:  'Tu sesión ha expirado',
      solution: 'Inicia sesión nuevamente',
    });
  }

  // Respuesta genérica
  res.status(statusCode).json({
    status:   'error',
    code:     statusCode,
    message:  err.isOperational ? err.message : 'Error interno del servidor',
    solution: err.solution || 'Contacta al administrador del sistema',
    ...(isDev && { stack: err.stack }),
  });
}
