import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.JWT_SECRET || 'supersecretkey12345';

/**
 * Hashes a plaintext password using SHA-256.
 */
export const hashPassword = (password) => {
  const str = (password || '').trim();
  return crypto.createHash('sha256').update(str).digest('hex');
};

/**
 * Compares a plaintext password with a hashed password.
 */
export const comparePassword = (password, hashedPassword) => {
  if (!password || !hashedPassword) return false;
  return hashPassword(password) === hashedPassword.trim();
};

/**
 * Generates an HS256-compliant JWT token.
 */
export const generateToken = (payload) => {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url');
  
  // Set default expiration to 24 hours
  const exp = Date.now() + 24 * 60 * 60 * 1000;
  const body = Buffer.from(JSON.stringify({ ...payload, exp })).toString('base64url');
  
  const signature = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
    
  return `${header}.${body}.${signature}`;
};

/**
 * Verifies an HS256 JWT token and returns the payload if valid.
 */
export const verifyToken = (token) => {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  
  const [header, body, signature] = parts;
  const expectedSignature = crypto
    .createHmac('sha256', SECRET)
    .update(`${header}.${body}`)
    .digest('base64url');
    
  if (signature !== expectedSignature) {
    return null; // Invalid signature
  }
  
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (payload.exp && Date.now() > payload.exp) {
      return null; // Token expired
    }
    return payload;
  } catch (e) {
    return null;
  }
};
