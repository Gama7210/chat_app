import { io } from 'socket.io-client';

let socket = null;

export function connectSocket(token) {
  if (socket?.connected) return socket;

  socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3001', {
    auth:       { token },
    transports: ['websocket'],
    reconnectionAttempts: 5,
    reconnectionDelay:    1000,
  });

  socket.on('connect',       () => console.log('✅ Socket conectado'));
  socket.on('connect_error', (err) => console.error('❌ Socket error:', err.message));
  socket.on('disconnect',    () => console.log('🔌 Socket desconectado'));

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}

export function getSocket() {
  return socket;
}
