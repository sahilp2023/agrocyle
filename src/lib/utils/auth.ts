import jwt from 'jsonwebtoken';
import { NextRequest } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'agrocycle-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface TokenPayload {
    farmerId: string;
    phone: string;
}

/**
 * Generate JWT token for farmer
 */
export function generateToken(payload: TokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

/**
 * Verify JWT token and return payload
 */
export function verifyToken(token: string): TokenPayload | null {
    try {
        return jwt.verify(token, JWT_SECRET) as TokenPayload;
    } catch {
        return null;
    }
}

/**
 * Extract token from Authorization header
 */
export function getTokenFromHeader(request: NextRequest): string | null {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

/**
 * Get farmer ID from request (for protected routes)
 */
export function getFarmerIdFromRequest(request: NextRequest): string | null {
    const token = getTokenFromHeader(request);
    if (!token) return null;

    const payload = verifyToken(token);
    return payload?.farmerId || null;
}

/**
 * Generate 6-digit OTP
 */
export function generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

/**
 * Get OTP expiry time (5 minutes from now)
 */
export function getOTPExpiry(): Date {
    return new Date(Date.now() + 5 * 60 * 1000);
}

/**
 * Check if OTP is expired
 */
export function isOTPExpired(expiryDate: Date): boolean {
    return new Date() > expiryDate;
}
