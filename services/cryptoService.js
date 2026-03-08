import crypto from 'crypto';

const ALGORITHM  = 'aes-256-cbc';

function getKey() {
  const key = process.env.CRYPTO_KEY;
  if (!key || key.length !== 64) {
    throw new Error('CRYPTO_KEY debe ser exactamente 64 caracteres hexadecimales (32 bytes)');
  }
  return Buffer.from(key, 'hex');
}

/**
 * Cifra texto plano → devuelve { iv, encryptedData }
 */
export function encrypt(plainText) {
  const iv      = crypto.randomBytes(16);
  const cipher  = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  let encrypted = cipher.update(String(plainText), 'utf8', 'base64');
  encrypted    += cipher.final('base64');
  return {
    iv:            iv.toString('hex'),
    encryptedData: encrypted,
  };
}

/**
 * Descifra { iv, encryptedData } → texto plano
 */
export function decrypt(iv, encryptedData) {
  const decipher  = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, 'hex'));
  let decrypted   = decipher.update(encryptedData, 'base64', 'utf8');
  decrypted      += decipher.final('utf8');
  return decrypted;
}

/**
 * Cifra un Buffer binario (archivos multimedia)
 */
export function encryptBuffer(buffer) {
  const iv        = crypto.randomBytes(16);
  const cipher    = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
  return { iv: iv.toString('hex'), encryptedBuffer: encrypted };
}

/**
 * Descifra un Buffer binario
 */
export function decryptBuffer(iv, encryptedBuffer) {
  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), Buffer.from(iv, 'hex'));
  return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()]);
}
