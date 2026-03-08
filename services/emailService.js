import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host:   process.env.SMTP_HOST || 'smtp.gmail.com',
  port:   parseInt(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendCredentials(email, username, password) {
  await transporter.sendMail({
    from:    `"Chat Seguro" <${process.env.SMTP_USER}>`,
    to:      email,
    subject: '🔐 Tus credenciales de acceso - Chat Seguro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a2e; color: #eee; padding: 30px; border-radius: 12px;">
        <h2 style="color: #818cf8; text-align: center;">🔐 Chat Seguro</h2>
        <p>Hola <strong>${username}</strong>, tu cuenta ha sido creada exitosamente.</p>
        <div style="background: #16213e; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #818cf8;">
          <p><strong>📧 Correo:</strong> ${email}</p>
          <p><strong>🔑 Contraseña:</strong> <code style="background:#0f3460;padding:4px 8px;border-radius:4px;">${password}</code></p>
        </div>
        <p style="color: #f87171;">⚠️ Por seguridad, cambia tu contraseña después de iniciar sesión.</p>
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 20px;">Este correo fue generado automáticamente, no responder.</p>
      </div>
    `,
  });
}

// Manda directamente una nueva contraseña generada — sin enlace
export async function sendNewPassword(email, username, newPassword) {
  await transporter.sendMail({
    from:    `"Chat Seguro" <${process.env.SMTP_USER}>`,
    to:      email,
    subject: '🔑 Tu nueva contraseña - Chat Seguro',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a2e; color: #eee; padding: 30px; border-radius: 12px;">
        <h2 style="color: #818cf8; text-align: center;">🔑 Nueva Contraseña</h2>
        <p>Hola <strong>${username}</strong>, recibimos una solicitud para restablecer tu contraseña.</p>
        <p>Tu nueva contraseña de acceso es:</p>
        <div style="background: #16213e; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #818cf8; text-align: center;">
          <code style="background:#0f3460; padding: 10px 20px; border-radius: 8px; font-size: 20px; letter-spacing: 2px; color: #a78bfa;">
            ${newPassword}
          </code>
        </div>
        <p style="color: #f87171;">⚠️ Por seguridad, cambia esta contraseña después de iniciar sesión.</p>
        <p style="color: #6b7280; font-size: 12px; text-align: center; margin-top: 20px;">
          Si no solicitaste este cambio, contacta al administrador.<br>
          Este correo fue generado automáticamente, no responder.
        </p>
      </div>
    `,
  });
}