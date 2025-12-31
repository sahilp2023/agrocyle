import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import HubStaff from '@/lib/models/HubStaff';
import { successResponse, errorResponse } from '@/lib/utils';
import { getAdminFromRequest } from '@/lib/utils/adminAuth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/admin/hubs/[id]/staff - List staff
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;

        await dbConnect();

        const staff = await HubStaff.find({ hubId: id })
            .sort({ createdAt: -1 });

        return successResponse(staff);
    } catch (error) {
        console.error('Get staff error:', error);
        return errorResponse('Failed to fetch staff', 500);
    }
}

// POST /api/admin/hubs/[id]/staff - Add staff
export async function POST(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;
        const body = await request.json();
        const { name, phone, role } = body;

        if (!name || !phone || !role) {
            return errorResponse('Name, phone, and role are required', 400);
        }

        await dbConnect();

        const staff = await HubStaff.create({
            hubId: id,
            name,
            phone,
            role,
            isActive: true,
        });

        return successResponse(staff, 'Staff added successfully');
    } catch (error) {
        console.error('Add staff error:', error);
        return errorResponse('Failed to add staff', 500);
    }
}

// DELETE /api/admin/hubs/[id]/staff - Remove staff (by staffId in body)
export async function DELETE(request: NextRequest) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { staffId } = body;

        if (!staffId) {
            return errorResponse('Staff ID required', 400);
        }

        await dbConnect();

        const staff = await HubStaff.findById(staffId);
        if (!staff) {
            return errorResponse('Staff not found', 404);
        }

        staff.isActive = false;
        await staff.save();

        return successResponse({ message: 'Staff removed' });
    } catch (error) {
        console.error('Remove staff error:', error);
        return errorResponse('Failed to remove staff', 500);
    }
}

// PATCH /api/admin/hubs/[id]/staff - Update staff
export async function PATCH(request: NextRequest) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { staffId, name, phone, role } = body;

        if (!staffId) {
            return errorResponse('Staff ID required', 400);
        }

        await dbConnect();

        const staff = await HubStaff.findById(staffId);
        if (!staff) {
            return errorResponse('Staff not found', 404);
        }

        if (name) staff.name = name;
        if (phone) staff.phone = phone;
        if (role) staff.role = role;

        await staff.save();

        return successResponse(staff, 'Staff updated');
    } catch (error) {
        console.error('Update staff error:', error);
        return errorResponse('Failed to update staff', 500);
    }
}
