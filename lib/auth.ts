import crypto from 'crypto';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthPayload {
  userId: string;
  email: string;
  role: 'customer' | 'staff' | 'admin';
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded as AuthPayload;
  } catch (error) {
    return null;
  }
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function generateOTP(): { code: string; expiresAt: Date } {
  const code = Math.random().toString().slice(2, 8);
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  return { code, expiresAt };
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export const ROLES = {
  CUSTOMER: 'customer',
  STAFF: 'staff',
  ADMIN: 'admin',
};

export const PERMISSIONS = {
  customer: ['view:bookings', 'view:profile', 'book:rooms', 'book:restaurant', 'book:dayout'],
  staff: [
    'view:bookings',
    'edit:bookings',
    'view:staff',
    'mark:attendance',
    'manage:inventory',
    'process:orders',
    'view:profile',
  ],
  admin: ['*'], // Full access
};

export function hasPermission(role: string, permission: string): boolean {
  const rolePerms = PERMISSIONS[role as keyof typeof PERMISSIONS] || [];
  return rolePerms.includes('*') || rolePerms.includes(permission);
}
