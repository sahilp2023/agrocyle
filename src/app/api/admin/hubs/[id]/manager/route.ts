import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import HubManager from '@/lib/models/HubManager';
import { successResponse, errorResponse } from '@/lib/utils';
import { getAdminFromRequest } from '@/lib/utils/adminAuth';
import bcrypt from 'bcryptjs';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/admin/hubs/[id]/manager - Get manager info
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;

        await dbConnect();

        const manager = await HubManager.findOne({ hubId: id, isActive: true })
            .select('name email phone lastLogin createdAt');

        if (!manager) {
            return errorResponse('Manager not found', 404);
        }

        return successResponse(manager);
    } catch (error) {
        console.error('Get manager error:', error);
        return errorResponse('Failed to fetch manager', 500);
    }
}

// PATCH /api/admin/hubs/[id]/manager - Update manager credentials
export async function PATCH(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;
        const body = await request.json();
        const { name, email, phone, password } = body;

        await dbConnect();

        let manager = await HubManager.findOne({ hubId: id, isActive: true });

        if (!manager) {
            return errorResponse('Manager not found', 404);
        }

        if (name) manager.name = name;
        if (email) manager.email = email;
        if (phone) manager.phone = phone;

        if (password) {
            const salt = await bcrypt.genSalt(10);
            manager.passwordHash = await bcrypt.hash(password, salt);
        }

        await manager.save();

        return successResponse({
            id: manager._id,
            name: manager.name,
            email: manager.email,
            phone: manager.phone,
        }, 'Manager updated successfully');
    } catch (error) {
        console.error('Update manager error:', error);
        return errorResponse('Failed to update manager', 500);
    }
}

// POST /api/admin/hubs/[id]/manager - Create new manager (if none exists)
export async function POST(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;
        const body = await request.json();
        const { name, email, phone, password } = body;

        if (!name || !email || !password) {
            return errorResponse('Name, email, and password are required', 400);
        }

        await dbConnect();

        // Check if manager already exists
        const existing = await HubManager.findOne({ hubId: id, isActive: true });
        if (existing) {
            return errorResponse('Hub already has an active manager', 400);
        }

        // Check email uniqueness
        const emailExists = await HubManager.findOne({ email: email.toLowerCase() });
        if (emailExists) {
            return errorResponse('Email already in use', 400);
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const manager = await HubManager.create({
            hubId: id,
            name,
            email: email.toLowerCase(),
            phone,
            passwordHash,
            isActive: true,
        });

        return successResponse({
            id: manager._id,
            name: manager.name,
            email: manager.email,
        }, 'Manager created successfully');
    } catch (error) {
        console.error('Create manager error:', error);
        return errorResponse('Failed to create manager', 500);
    }
}
