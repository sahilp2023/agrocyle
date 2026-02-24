import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'agrocycle-secret-key-change-in-production';

export interface OperatorTokenPayload {
    id: string;
    phone: string;
    operatorType: string;
    role: 'operator';
}

export function getOperatorFromRequest(request: NextRequest): OperatorTokenPayload | null {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return null;
        }

        const token = authHeader.substring(7);
        const decoded = jwt.verify(token, JWT_SECRET) as OperatorTokenPayload;

        if (decoded.role !== 'operator') {
            return null;
        }

        return decoded;
    } catch {
        return null;
    }
}

export function requireOperator(request: NextRequest): OperatorTokenPayload {
    const operator = getOperatorFromRequest(request);
    if (!operator) {
        throw new Error('Unauthorized');
    }
    return operator;
}
