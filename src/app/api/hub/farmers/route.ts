import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Farmer from '@/lib/models/Farmer';
import Booking from '@/lib/models/Booking';
import Hub from '@/lib/models/Hub';
import { successResponse, errorResponse } from '@/lib/utils';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';
import mongoose from 'mongoose';

// GET /api/hub/farmers - Get farmers linked to a hub via pincode with stats
export async function GET(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();

        // Get the hub's service pincodes
        const hub = await Hub.findById(manager.hubId);
        if (!hub) {
            return errorResponse('Hub not found', 404);
        }

        // Find farmers whose pincode matches hub's service area
        const farmers = await Farmer.find({
            pincode: { $in: hub.servicePincodes },
        })
            .select('name phone village city pincode aadhaarNumber upiId kycVerified createdAt')
            .sort({ createdAt: -1 });

        // Get booking stats for each farmer from this hub
        const hubId = new mongoose.Types.ObjectId(manager.hubId);
        const farmerIds = farmers.map(f => f._id);

        const bookingStats = await Booking.aggregate([
            {
                $match: {
                    hubId,
                    farmerId: { $in: farmerIds },
                    status: 'completed',
                },
            },
            {
                $group: {
                    _id: '$farmerId',
                    totalPickups: { $sum: 1 },
                    totalQuantity: {
                        $sum: { $ifNull: ['$actualStubbleTonnes', '$estimatedStubbleTonnes'] },
                    },
                    lastPickupDate: { $max: '$actualPickupDate' },
                    firstPickupDate: { $min: '$createdAt' },
                    cropTypes: { $addToSet: '$cropType' },
                },
            },
        ]);

        // Get recent bookings for each farmer
        const recentBookings = await Booking.aggregate([
            {
                $match: {
                    hubId,
                    farmerId: { $in: farmerIds },
                    status: 'completed',
                },
            },
            { $sort: { completedAt: -1 } },
            {
                $group: {
                    _id: '$farmerId',
                    recentPickups: {
                        $push: {
                            bookingId: '$_id',
                            cropType: '$cropType',
                            quantity: { $ifNull: ['$actualStubbleTonnes', '$estimatedStubbleTonnes'] },
                            date: { $ifNull: ['$actualPickupDate', '$createdAt'] },
                        },
                    },
                },
            },
            {
                $project: {
                    recentPickups: { $slice: ['$recentPickups', 3] }, // Last 3 pickups
                },
            },
        ]);

        // Create stats lookup
        const statsMap = new Map();
        bookingStats.forEach((stat) => {
            statsMap.set(stat._id.toString(), stat);
        });

        const recentMap = new Map();
        recentBookings.forEach((r) => {
            recentMap.set(r._id.toString(), r.recentPickups);
        });

        // Combine farmer data with stats
        const farmersWithStats = farmers.map((farmer) => {
            const stats = statsMap.get(farmer._id.toString());
            const recent = recentMap.get(farmer._id.toString());

            return {
                _id: farmer._id,
                name: farmer.name,
                phone: farmer.phone,
                village: farmer.village,
                city: farmer.city,
                pincode: farmer.pincode,
                kycVerified: farmer.kycVerified,
                registeredAt: farmer.createdAt,
                // Stats
                totalPickups: stats?.totalPickups || 0,
                totalQuantity: stats?.totalQuantity || 0,
                lastPickupDate: stats?.lastPickupDate || null,
                firstPickupDate: stats?.firstPickupDate || null,
                cropTypes: stats?.cropTypes || [],
                // Recent pickups
                recentPickups: recent || [],
            };
        });

        return successResponse(farmersWithStats);
    } catch (error) {
        console.error('Get hub farmers error:', error);
        return errorResponse('Failed to fetch farmers', 500);
    }
}
