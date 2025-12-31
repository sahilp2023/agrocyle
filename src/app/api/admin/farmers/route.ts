import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Farmer from '@/lib/models/Farmer';
import Booking from '@/lib/models/Booking';
import Payout from '@/lib/models/Payout';
import { successResponse, errorResponse } from '@/lib/utils';
import { getAdminFromRequest } from '@/lib/utils/adminAuth';
import mongoose from 'mongoose';

// GET /api/admin/farmers - Get all farmers with stats
export async function GET(request: NextRequest) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();

        // Get all farmers
        const farmers = await Farmer.find()
            .select('name phone village city state pincode isVerified isKYCDone createdAt')
            .sort({ createdAt: -1 })
            .lean();

        // Get pickup counts per farmer
        const pickupStats = await Booking.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: '$farmerId', count: { $sum: 1 } } },
        ]);
        const pickupByFarmer: Record<string, number> = {};
        pickupStats.forEach((s: { _id: mongoose.Types.ObjectId; count: number }) => {
            pickupByFarmer[s._id.toString()] = s.count;
        });

        // Get earnings per farmer
        const earningsStats = await Payout.aggregate([
            { $match: { status: 'completed' } },
            { $group: { _id: '$farmerId', total: { $sum: '$amount' } } },
        ]);
        const earningsByFarmer: Record<string, number> = {};
        earningsStats.forEach((s: { _id: mongoose.Types.ObjectId; total: number }) => {
            earningsByFarmer[s._id.toString()] = s.total;
        });

        // Combine data
        const farmersWithStats = farmers.map((farmer: {
            _id: mongoose.Types.ObjectId;
            name: string;
            phone: string;
            village?: string;
            city?: string;
            state?: string;
            pincode?: string;
            isVerified: boolean;
            isKYCDone: boolean;
            createdAt: Date;
        }) => ({
            ...farmer,
            totalPickups: pickupByFarmer[farmer._id.toString()] || 0,
            totalEarnings: earningsByFarmer[farmer._id.toString()] || 0,
        }));

        return successResponse(farmersWithStats);
    } catch (error) {
        console.error('Get admin farmers error:', error);
        return errorResponse('Failed to fetch farmers', 500);
    }
}
