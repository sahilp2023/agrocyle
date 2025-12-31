import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import SupportTicket from '@/lib/models/SupportTicket';
import { successResponse, errorResponse } from '@/lib/utils';
import { getAdminFromRequest } from '@/lib/utils/adminAuth';

// GET /api/admin/tickets - Get all support tickets
export async function GET(request: NextRequest) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        await dbConnect();

        const query: Record<string, unknown> = {};
        if (status && status !== 'all') {
            query.status = status;
        }

        const tickets = await SupportTicket.find(query)
            .select('ticketNumber subject category status priority createdByType createdByName createdAt')
            .sort({ createdAt: -1 })
            .limit(100);

        return successResponse(tickets);
    } catch (error) {
        console.error('Get admin tickets error:', error);
        return errorResponse('Failed to fetch tickets', 500);
    }
}
