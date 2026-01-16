import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Buyer from '@/lib/models/Buyer';
import { successResponse, errorResponse } from '@/lib/utils';

// POST /api/buyer/auth/accept-agreement - Accept agreement
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { buyerId, email } = body;

        if (!buyerId && !email) {
            return errorResponse('Buyer ID or email is required', 400);
        }

        await dbConnect();

        // Find buyer
        const query = buyerId ? { _id: buyerId } : { email: email.toLowerCase().trim() };
        const buyer = await Buyer.findOne(query);

        if (!buyer) {
            return errorResponse('Buyer not found', 404);
        }

        if (buyer.agreementAccepted) {
            return errorResponse('Agreement already accepted', 400);
        }

        // Update agreement status
        await Buyer.updateOne(
            { _id: buyer._id },
            {
                agreementAccepted: true,
                agreementAcceptedAt: new Date(),
            }
        );

        return successResponse({
            message: 'Agreement accepted successfully'
        }, 'You can now login to your account');
    } catch (error) {
        console.error('Accept agreement error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return errorResponse(`Failed to accept agreement: ${errorMessage}`, 500);
    }
}
