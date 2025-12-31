import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db/mongodb';
import HubManager from '@/lib/models/HubManager';
import Hub from '@/lib/models/Hub';
import { successResponse, errorResponse } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// POST /api/hub/auth/login - Hub Manager Login
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return errorResponse('Email and password are required', 400);
        }

        await dbConnect();

        // Ensure Hub model is registered before populate
        // eslint-disable-next-line @typescript-eslint/no-unused-expressions
        Hub;

        // Find hub manager by email
        const manager = await HubManager.findOne({
            email: email.toLowerCase().trim(),
            isActive: true
        }).populate('hubId', 'name code city');

        if (!manager) {
            return errorResponse('Invalid email or password', 401);
        }

        // Verify password
        const isMatch = await manager.comparePassword(password);
        if (!isMatch) {
            return errorResponse('Invalid email or password', 401);
        }

        // Update last login (use updateOne to avoid model issues)
        await HubManager.updateOne({ _id: manager._id }, { lastLogin: new Date() });

        // Generate JWT token
        const token = jwt.sign(
            {
                id: manager._id.toString(),
                email: manager.email,
                hubId: manager.hubId._id.toString(),
                role: 'hub_manager'
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return successResponse({
            token,
            manager: {
                id: manager._id,
                name: manager.name,
                email: manager.email,
                hub: manager.hubId,
            }
        }, 'Login successful');
    } catch (error) {
        console.error('Hub Manager login error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return errorResponse(`Login failed: ${errorMessage}`, 500);
    }
}

// GET /api/hub/auth/login - Verify token and get manager info
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return errorResponse('No token provided', 401);
        }

        const token = authHeader.substring(7);

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: string; hubId: string };

            await dbConnect();

            const manager = await HubManager.findById(decoded.id)
                .select('-passwordHash')
                .populate('hubId', 'name code city state');

            if (!manager || !manager.isActive) {
                return errorResponse('Manager not found or inactive', 401);
            }

            return successResponse({
                manager: {
                    id: manager._id,
                    name: manager.name,
                    email: manager.email,
                    hub: manager.hubId,
                }
            });
        } catch {
            return errorResponse('Invalid token', 401);
        }
    } catch (error) {
        console.error('Token verification error:', error);
        return errorResponse('Authentication failed', 500);
    }
}
