import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import SupportTicket from '@/lib/models/SupportTicket';
import Farmer from '@/lib/models/Farmer';
import { successResponse, errorResponse } from '@/lib/utils';
import { verifyToken } from '@/lib/utils/auth';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';

// Ensure Farmer model is registered
void Farmer;

// Helper to get user from request
async function getUserFromRequest(request: NextRequest) {
    const hubManager = getHubManagerFromRequest(request);
    if (hubManager) {
        return {
            id: hubManager.id,
            type: 'hub_manager' as const,
            name: 'Hub Manager',
            isAdmin: false,
        };
    }

    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        try {
            const decoded = verifyToken(token);
            if (decoded?.farmerId) {
                return {
                    id: decoded.farmerId,
                    type: 'farmer' as const,
                    name: 'Farmer',
                    isAdmin: false,
                };
            }
        } catch {
            // Token invalid
        }
    }

    return null;
}

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/support/[id] - Get single ticket with messages
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;

        await dbConnect();

        const ticket = await SupportTicket.findById(id);

        if (!ticket) {
            return errorResponse('Ticket not found', 404);
        }

        // Check ownership (unless admin)
        if (!user.isAdmin && ticket.createdBy.toString() !== user.id) {
            return errorResponse('Access denied', 403);
        }

        return successResponse(ticket);
    } catch (error) {
        console.error('Get ticket error:', error);
        return errorResponse('Failed to fetch ticket', 500);
    }
}

// PATCH /api/support/[id] - Update ticket (add message, close, etc)
export async function PATCH(request: NextRequest, context: RouteParams) {
    try {
        const user = await getUserFromRequest(request);
        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;
        const body = await request.json();
        const { message, status } = body;

        await dbConnect();

        const ticket = await SupportTicket.findById(id);

        if (!ticket) {
            return errorResponse('Ticket not found', 404);
        }

        // Check ownership (unless admin)
        if (!user.isAdmin && ticket.createdBy.toString() !== user.id) {
            return errorResponse('Access denied', 403);
        }

        // Add message if provided
        if (message) {
            ticket.messages.push({
                sender: user.isAdmin ? 'admin' : 'user',
                message,
                timestamp: new Date(),
            });
        }

        // Update status if provided
        if (status) {
            ticket.status = status;

            if (status === 'resolved') {
                ticket.resolvedAt = new Date();
            } else if (status === 'closed') {
                ticket.closedAt = new Date();
            }
        }

        await ticket.save();

        return successResponse(ticket, 'Ticket updated successfully');
    } catch (error) {
        console.error('Update ticket error:', error);
        return errorResponse('Failed to update ticket', 500);
    }
}
