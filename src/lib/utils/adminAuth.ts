import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export interface AdminTokenPayload {
    id: string;
    email: string;
    role: 'super_admin' | 'admin';
}

export function generateAdminToken(payload: AdminTokenPayload): string {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function getAdminFromRequest(request: NextRequest): AdminTokenPayload | null {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as AdminTokenPayload;

        if (!['super_admin', 'admin'].includes(decoded.role)) {
            return null;
        }

        return decoded;
    } catch {
        return null;
    }
}

export function requireAdmin(request: NextRequest): AdminTokenPayload {
    const admin = getAdminFromRequest(request);
    if (!admin) {
        throw new Error('Unauthorized');
    }
    return admin;
}

export function requireSuperAdmin(request: NextRequest): AdminTokenPayload {
    const admin = getAdminFromRequest(request);
    if (!admin || admin.role !== 'super_admin') {
        throw new Error('Unauthorized');
    }
    return admin;
}
