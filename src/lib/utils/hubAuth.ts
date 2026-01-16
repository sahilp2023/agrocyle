import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'agrocycle-secret-key-change-in-production';

export interface HubManagerTokenPayload {
    id: string;
    email: string;
    hubId: string;
    role: 'hub_manager';
}

export function getHubManagerFromRequest(request: NextRequest): HubManagerTokenPayload | null {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as HubManagerTokenPayload;

        if (decoded.role !== 'hub_manager') {
            return null;
        }

        return decoded;
    } catch {
        return null;
    }
}

export function requireHubManager(request: NextRequest): HubManagerTokenPayload {
    const manager = getHubManagerFromRequest(request);
    if (!manager) {
        throw new Error('Unauthorized');
    }
    return manager;
}
