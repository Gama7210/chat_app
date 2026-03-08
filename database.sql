-- ============================================
-- ESQUEMA COMPLETO - SISTEMA DE CHAT SEGURO
-- Ejecutar en MySQL Workbench
-- ============================================

CREATE DATABASE IF NOT EXISTS chat_secure CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE chat_secure;

-- ── Tabla de usuarios ────────────────────────────────────────
CREATE TABLE users (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    username      VARCHAR(50)  NOT NULL UNIQUE,
    email         VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    avatar_path   VARCHAR(255) DEFAULT NULL,
    is_active     BOOLEAN      DEFAULT TRUE,
    last_seen     DATETIME     DEFAULT NULL,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_email (email),
    INDEX idx_username (username)
);

-- ── Tabla de conversaciones ──────────────────────────────────
CREATE TABLE conversations (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user1_id   INT UNSIGNED NOT NULL,
    user2_id   INT UNSIGNED NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY unique_conversation (user1_id, user2_id),
    FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user1 (user1_id),
    INDEX idx_user2 (user2_id)
);

-- ── Tabla de mensajes (contenido cifrado AES-256) ────────────
CREATE TABLE messages (
    id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    conversation_id INT UNSIGNED  NOT NULL,
    sender_id       INT UNSIGNED  NOT NULL,
    content         TEXT          NOT NULL,
    iv              VARCHAR(64)   NOT NULL,
    message_type    ENUM('text','image','video','audio','file') DEFAULT 'text',
    is_read         BOOLEAN       DEFAULT FALSE,
    created_at      TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (conversation_id) REFERENCES conversations(id) ON DELETE CASCADE,
    FOREIGN KEY (sender_id)       REFERENCES users(id)         ON DELETE CASCADE,
    INDEX idx_conversation (conversation_id),
    INDEX idx_sender       (sender_id),
    INDEX idx_created      (created_at)
);

-- ── Tabla de archivos cifrados ───────────────────────────────
CREATE TABLE files (
    id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    message_id    INT UNSIGNED  NOT NULL UNIQUE,
    original_name VARCHAR(255)  NOT NULL,
    stored_name   VARCHAR(255)  NOT NULL,
    mime_type     VARCHAR(100)  NOT NULL,
    size_bytes    INT UNSIGNED  NOT NULL,
    encryption_iv VARCHAR(64)   NOT NULL,
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id) ON DELETE CASCADE
);

-- ── Tabla de tokens de recuperación de contraseña ───────────
CREATE TABLE password_resets (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    user_id    INT UNSIGNED NOT NULL,
    token      VARCHAR(255) NOT NULL,
    expires_at DATETIME     NOT NULL,
    used       BOOLEAN      DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token (token)
);

-- ── Tabla dinámica de palabras prohibidas ────────────────────
CREATE TABLE banned_words (
    id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
    word       VARCHAR(100) NOT NULL UNIQUE,
    severity   ENUM('low','medium','high') DEFAULT 'medium',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Palabras de ejemplo (personalizar según necesidad)
INSERT INTO banned_words (word, severity) VALUES
('spam',   'low'),
('hack',   'medium'),
('idiot',  'high'),
('stupid', 'medium'),
('hate',   'high');


ALTER TABLE users
  ADD COLUMN status_text VARCHAR(100) DEFAULT 'Disponible para chatear' AFTER avatar_path,
  ADD COLUMN status_emoji VARCHAR(10)  DEFAULT '🟢' AFTER status_text;
select * from users;

select * from messages;