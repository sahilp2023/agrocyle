import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Admin from '@/lib/models/Admin';
import { successResponse, errorResponse } from '@/lib/utils';
import { generateAdminToken } from '@/lib/utils/adminAuth';

// POST /api/admin/auth - Admin login
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return errorResponse('Email and password are required', 400);
        }

        await dbConnect();

        // Find admin by email
        const admin = await Admin.findOne({ email: email.toLowerCase() });
        if (!admin) {
            return errorResponse('Invalid credentials', 401);
        }

        if (!admin.isActive) {
            return errorResponse('Account is disabled', 403);
        }

        // Verify password
        const isValid = await admin.comparePassword(password);
        if (!isValid) {
            return errorResponse('Invalid credentials', 401);
        }

        // Update last login
        admin.lastLogin = new Date();
        await admin.save();

        // Generate token
        const token = generateAdminToken({
            id: admin._id.toString(),
            email: admin.email,
            role: admin.role,
        });

        return successResponse({
            token,
            admin: {
                id: admin._id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
            },
        }, 'Login successful');
    } catch (error) {
        console.error('Admin login error:', error);
        return errorResponse('Login failed', 500);
    }
}
