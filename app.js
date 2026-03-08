import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cookieParser from 'cookie-parser';
import { createServer } from 'http';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { initSocket }    from './config/socket.js';
import authRoutes        from './routes/authRoutes.js';
import userRoutes        from './routes/userRoutes.js';
import messageRoutes     from './routes/messageRoutes.js';
import fileRoutes        from './routes/fileRoutes.js';
import autocorrectRoutes from './routes/autocorrectRoutes.js';
import aiRoutes          from './routes/aiRoutes.js';
import { globalErrorHandler } from './middlewares/errorMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const app        = express();
const httpServer = createServer(app);

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' }, contentSecurityPolicy: false }));
app.use(cors({ origin: process.env.CLIENT_URL || '*', credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 30,
  skip: (req) => req.path === '/me' || req.path === '/logout',
  message: { status: 'error', code: 429, message: 'Demasiados intentos', solution: 'Espera unos minutos' },
  standardHeaders: true, legacyHeaders: false,
});
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, max: 300,
  message: { status: 'error', code: 429, message: 'Demasiadas solicitudes', solution: 'Intenta de nuevo' },
  standardHeaders: true, legacyHeaders: false,
});
const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, max: 30,
  message: { status: 'error', code: 429, message: 'Demasiadas subidas', solution: 'Espera un momento' },
});
const aiLimiter = rateLimit({
  windowMs: 60 * 1000, max: 30,
  message: { status: 'error', code: 429, message: 'Demasiados mensajes a la IA', solution: 'Espera un momento' },
});

app.use('/api/auth',        authLimiter,    authRoutes);
app.use('/api/users',       generalLimiter, userRoutes);
app.use('/api/messages',    generalLimiter, messageRoutes);
app.use('/api/files',       uploadLimiter,  fileRoutes);
app.use('/api/autocorrect', generalLimiter, autocorrectRoutes);
app.use('/api/ai',          aiLimiter,      aiRoutes);

app.get('/api/health', (_, res) => res.json({ status: 'ok', time: new Date() }));

const distPath = join(__dirname, '..', 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) res.sendFile(join(distPath, 'index.html'));
});

initSocket(httpServer);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Servidor corriendo en puerto ${PORT}`));