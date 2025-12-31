import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import SupportTicket from '@/lib/models/SupportTicket';
import Farmer from '@/lib/models/Farmer';
import { successResponse, errorResponse } from '@/lib/utils';
import { verifyToken } from '@/lib/utils/auth';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';

// Ensure Farmer model is registered
void Farmer;

// Helper to get user from request (farmer or hub manager)
async function getUserFromRequest(request: NextRequest) {
    // Try hub manager first
    const hubManager = getHubManagerFromRequest(request);
    if (hubManager) {
        return {
            id: hubManager.id,
            type: 'hub_manager' as const,
            name: 'Hub Manager',
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
                await dbConnect();
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
            query.createdBy = user.id;
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
        const user = await getUserFromRequest(request);
        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { category, subject, description, priority } = body;

        if (!category || !subject || !description) {
            return errorResponse('Category, subject, and description are required', 400);
        }

        await dbConnect();

        // Generate ticket number
        const year = new Date().getFullYear();
        const count = await SupportTicket.countDocuments();
        const ticketNumber = `TKT-${year}-${String(count + 1).padStart(4, '0')}`;

        const ticket = await SupportTicket.create({
            ticketNumber,
            createdBy: user.id,
            createdByType: user.type,
            createdByName: user.name,
            hubId: user.hubId,
            category,
            subject,
            description,
            priority: priority || 'medium',
            status: 'open',
            messages: [],
        });

        return successResponse(ticket, 'Ticket created successfully');
    } catch (error) {
        console.error('Create support ticket error:', error);
        return errorResponse('Failed to create ticket', 500);
    }
}
