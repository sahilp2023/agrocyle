import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import SupportTicket from '@/lib/models/SupportTicket';
import { successResponse, errorResponse } from '@/lib/utils';
import { getAdminFromRequest } from '@/lib/utils/adminAuth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/admin/tickets/[id] - Get single ticket
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;

        await dbConnect();

        const ticket = await SupportTicket.findById(id);
        if (!ticket) {
            return errorResponse('Ticket not found', 404);
        }

        return successResponse(ticket);
    } catch (error) {
        console.error('Get ticket error:', error);
        return errorResponse('Failed to fetch ticket', 500);
    }
}

// PATCH /api/admin/tickets/[id] - Update ticket (reply, status)
export async function PATCH(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
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

        if (message) {
            ticket.messages.push({
                sender: 'admin',
                message,
                timestamp: new Date(),
            });
        }

        if (status) {
            ticket.status = status;
            if (status === 'resolved') {
                ticket.resolvedAt = new Date();
            } else if (status === 'closed') {
                ticket.closedAt = new Date();
            }
        }

        await ticket.save();

        return successResponse(ticket, 'Ticket updated');
    } catch (error) {
        console.error('Update ticket error:', error);
        return errorResponse('Failed to update ticket', 500);
    }
}
