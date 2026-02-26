import { NextRequest } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db/mongodb';
import SupportTicket from '@/lib/models/SupportTicket';
import Farmer from '@/lib/models/Farmer';
import HubManager from '@/lib/models/HubManager';
import { successResponse, errorResponse } from '@/lib/utils';
import { verifyToken } from '@/lib/utils/auth';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';

// Ensure Farmer model is registered
void Farmer;
void HubManager;

// Helper to get user from request (farmer or hub manager)
async function getUserFromRequest(request: NextRequest) {
    await dbConnect();

    // Try hub manager first
    const hubManager = getHubManagerFromRequest(request);
    if (hubManager) {
        // Fetch manager name from database
        const manager = await HubManager.findById(hubManager.id).select('name');
        return {
            id: hubManager.id,
            type: 'hub_manager' as const,
            name: manager?.name || 'Hub Manager',
            hubId: hubManager.hubId,
        };
    }

    // Try farmer token
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const decoded = verifyToken(token);
            if (decoded && decoded.farmerId) {
                // Get farmer name
                const farmer = await Farmer.findById(decoded.farmerId).select('name');
                return {
                    id: decoded.farmerId,
                    type: 'farmer' as const,
                    name: farmer?.name || 'Farmer',
                    hubId: undefined,
                };
            }
        } catch {
            // Token invalid
        }
    }

    return null;
}

// GET /api/support - List tickets for authenticated user
export async function GET(request: NextRequest) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');
        const all = searchParams.get('all'); // For super admin later

        await dbConnect();

        // Build query
        const query: Record<string, unknown> = {};

        // If not requesting all (for super admin), filter by user
        if (!all) {
            query.createdBy = new mongoose.Types.ObjectId(user.id);
            query.createdByType = user.type;
        }

        if (status && status !== 'all') {
            query.status = status;
        }

        const tickets = await SupportTicket.find(query)
            .select('ticketNumber subject category status priority createdAt updatedAt createdByName')
            .sort({ createdAt: -1 })
            .limit(50);

        return successResponse(tickets);
    } catch (error) {
        console.error('Get support tickets error:', error);
        return errorResponse('Failed to fetch tickets', 500);
    }
}

// POST /api/support - Create new ticket
export async function POST(request: NextRequest) {
    try {
        console.log('[Support POST] Starting ticket creation...');

        const user = await getUserFromRequest(request);
        console.log('[Support POST] User:', user ? `${user.type} (${user.id})` : 'null');

        if (!user) {
            console.log('[Support POST] Auth failed — no user resolved from token');
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { category, subject, description, priority } = body;
        console.log('[Support POST] Body:', { category, subject: subject?.slice(0, 30), priority });

        if (!category || !subject || !description) {
            return errorResponse('Category, subject, and description are required', 400);
        }

        await dbConnect();

        // Generate ticket number
        const year = new Date().getFullYear();
        const count = await SupportTicket.countDocuments();
        const ticketNumber = `TKT-${year}-${String(count + 1).padStart(4, '0')}`;
        console.log('[Support POST] Generated ticket number:', ticketNumber);

        // Create ObjectId properly
        let createdById: mongoose.Types.ObjectId;
        try {
            createdById = new mongoose.Types.ObjectId(user.id);
        } catch (e) {
            console.error('[Support POST] Invalid user ID for ObjectId:', user.id, e);
            return errorResponse('Invalid user ID', 400);
        }

        const ticketData = {
            ticketNumber,
            createdBy: createdById,
            createdByType: user.type,
            createdByName: user.name,
            hubId: user.hubId ? new mongoose.Types.ObjectId(user.hubId) : undefined,
            category,
            subject,
            description,
            priority: priority || 'medium',
            status: 'open' as const,
            messages: [],
        };

        console.log('[Support POST] Creating ticket with data:', JSON.stringify(ticketData, null, 2));

        const ticket = await SupportTicket.create(ticketData);
        console.log('[Support POST] Ticket created:', ticket._id);

        return successResponse(ticket, 'Ticket created successfully');
    } catch (error) {
        console.error('[Support POST] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return errorResponse(`Failed to create ticket: ${errorMessage}`, 500);
    }
}
