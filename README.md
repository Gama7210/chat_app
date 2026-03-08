# 💬 Chat Seguro — Sistema de Chat Privado

Sistema de chat privado en tiempo real con cifrado AES-256, autenticación JWT, y diseño moderno con animaciones.

---

## 🚀 INICIO RÁPIDO

### 1. Base de datos
Abre MySQL Workbench y ejecuta el archivo `database.sql` para crear la base de datos y tablas.

### 2. Backend
```bash
cd backend
npm install
cp .env.example .env
# Edita .env con tus datos (MySQL, Gmail, claves)
npm run dev
```

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```

Abre http://localhost:5173 en tu navegador.

---

## ⚙️ CONFIGURACIÓN (.env)

### Generar CRYPTO_KEY (obligatorio):
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Generar JWT_SECRET (obligatorio):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Gmail — App Password:
1. Ve a tu cuenta de Google → Seguridad
2. Activa verificación en 2 pasos
3. Ve a "Contraseñas de aplicaciones"
4. Genera una contraseña para "Correo"
5. Usa esa contraseña en SMTP_PASS

---

## 📁 ESTRUCTURA DEL PROYECTO

```
chat-app/
├── database.sql          ← Ejecutar primero en MySQL
├── backend/
│   ├── .env.example      ← Copiar a .env y configurar
│   ├── src/
│   │   ├── app.js        ← Punto de entrada
│   │   ├── config/       ← DB, Socket, Email
│   │   ├── controllers/  ← Lógica de negocio
│   │   ├── middlewares/  ← Auth, Errores, Upload
│   │   ├── routes/       ← Endpoints API
│   │   └── services/     ← Crypto, Email, Profanity
│   └── uploads/          ← Archivos cifrados (auto-creado)
└── frontend/
    └── src/
        ├── context/      ← Auth, Theme (React Context)
        ├── pages/        ← Login, Register, Dashboard
        ├── components/   ← Chat, Users, UI
        └── services/     ← API axios, Socket.io
```

---

## 🔒 SEGURIDAD IMPLEMENTADA

| Feature | Implementación |
|---------|---------------|
| Cifrado de mensajes | AES-256-CBC |
| Cifrado de archivos | AES-256-CBC (buffer) |
| Hash de contraseñas | bcrypt (12 rounds) |
| Autenticación | JWT en cookie HttpOnly |
| Protección XSS | Cookie HttpOnly + helmet |
| Rate limiting | express-rate-limit |
| Validación MIME | multer fileFilter |
| Prevención SQL Injection | mysql2 prepared statements |
| Filtro de palabras | BD dinámica + caché |

---

## 📡 API ENDPOINTS

### Autenticación
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/auth/register | Registro (envía contraseña por email) |
| POST | /api/auth/login | Login → JWT cookie |
| POST | /api/auth/logout | Cerrar sesión |
| GET  | /api/auth/me | Obtener usuario actual |
| POST | /api/auth/forgot-password | Solicitar reset |
| POST | /api/auth/reset-password | Restablecer contraseña |

### Usuarios
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET  | /api/users | Listar usuarios |
| POST | /api/users/avatar | Subir foto de perfil |
| GET  | /api/users/avatar/:id | Obtener avatar |
| GET  | /api/users/conversation/:targetId | Obtener/crear conversación |

### Mensajes
| Método | Ruta | Descripción |
|--------|------|-------------|
| GET | /api/messages/:conversationId | Historial de mensajes |

### Archivos
| Método | Ruta | Descripción |
|--------|------|-------------|
| POST | /api/files/upload | Subir archivo cifrado |
| GET  | /api/files/:messageId | Descargar archivo descifrado |

---

## 🔌 EVENTOS SOCKET.IO

### Cliente → Servidor
| Evento | Payload | Descripción |
|--------|---------|-------------|
| join:conversation | conversationId | Unirse a sala |
| message:send | { conversationId, content } | Enviar mensaje |
| typing:start | { conversationId } | Empezar a escribir |
| typing:stop | { conversationId } | Dejar de escribir |
| messages:read | { conversationId } | Marcar como leídos |

### Servidor → Cliente
| Evento | Payload | Descripción |
|--------|---------|-------------|
| message:received | MessageObject | Nuevo mensaje |
| typing:update | { userId, isTyping } | Estado de escritura |
| user:online | { userId } | Usuario conectado |
| user:offline | { userId } | Usuario desconectado |
| users:online | userId[] | Lista de conectados |

---

## 📦 DEPENDENCIAS PRINCIPALES

### Backend
- **express** — Servidor HTTP
- **socket.io** — WebSockets en tiempo real
- **mysql2** — Cliente MySQL con prepared statements
- **bcryptjs** — Hash seguro de contraseñas
- **jsonwebtoken** — Autenticación JWT
- **multer** — Manejo de archivos multipart
- **nodemailer** — Envío de correos
- **helmet** — Headers de seguridad HTTP
- **express-rate-limit** — Límite de solicitudes

### Frontend
- **react 18** — UI library
- **react-router-dom** — Navegación SPA
- **framer-motion** — Animaciones fluidas
- **socket.io-client** — Conexión WebSocket
- **axios** — Cliente HTTP
- **tailwindcss** — Estilos utility-first

---

## 🐛 SOLUCIÓN DE PROBLEMAS

**Error: Cannot connect to MySQL**
→ Verifica que MySQL esté corriendo y los datos en .env sean correctos

**Error: CRYPTO_KEY must be 64 hex characters**
→ Genera la clave con el comando indicado en la sección de configuración

**Los correos no llegan**
→ Usa App Password de Gmail (no la contraseña normal)
→ Activa "Acceso de aplicaciones menos seguras" o usa App Password

**Socket no conecta**
→ Verifica que el backend esté corriendo en el puerto 3001
→ Revisa que el token JWT esté en localStorage
