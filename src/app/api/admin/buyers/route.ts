import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Buyer from '@/lib/models/Buyer';
import BuyerOrder from '@/lib/models/BuyerOrder';
import Hub from '@/lib/models/Hub';
import { successResponse, errorResponse } from '@/lib/utils';
import { getAdminFromRequest } from '@/lib/utils/adminAuth';
import mongoose from 'mongoose';

// Ensure models are registered
void Hub;

// GET /api/admin/buyers - Get all buyers with summary
export async function GET(request: NextRequest) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();

        const buyers = await Buyer.find().sort({ createdAt: -1 }).lean();

        // Get order stats per buyer
        const orderStats = await BuyerOrder.aggregate([
            {
                $group: {
                    _id: '$buyerId',
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' },
                    pendingOrders: {
                        $sum: { $cond: [{ $in: ['$status', ['pending', 'confirmed']] }, 1, 0] }
                    },
                    totalDelivered: {
                        $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$quantityTonnes', 0] }
                    },
                    pendingPayment: {
                        $sum: { $subtract: ['$totalAmount', '$paidAmount'] }
                    },
                },
            },
        ]);

        const statsByBuyer: Record<string, {
            totalOrders: number;
            totalRevenue: number;
            pendingOrders: number;
            totalDelivered: number;
            pendingPayment: number;
        }> = {};
        orderStats.forEach((s: {
            _id: mongoose.Types.ObjectId;
            totalOrders: number;
            totalRevenue: number;
            pendingOrders: number;
            totalDelivered: number;
            pendingPayment: number;
        }) => {
            statsByBuyer[s._id.toString()] = {
                totalOrders: s.totalOrders,
                totalRevenue: s.totalRevenue,
                pendingOrders: s.pendingOrders,
                totalDelivered: s.totalDelivered,
                pendingPayment: s.pendingPayment,
            };
        });

        // Combine data
        const buyersWithStats = buyers.map((buyer: {
            _id: mongoose.Types.ObjectId;
            companyName: string;
            companyCode: string;
            contactPerson: string;
            plantCity: string;
            plantState: string;
            agreementEndDate: Date;
            isActive: boolean;
        }) => {
            const stats = statsByBuyer[buyer._id.toString()] || {
                totalOrders: 0,
                totalRevenue: 0,
                pendingOrders: 0,
                totalDelivered: 0,
                pendingPayment: 0,
            };
            const daysToExpiry = Math.ceil(
                (new Date(buyer.agreementEndDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
            );
            return {
                ...buyer,
                ...stats,
                daysToExpiry,
                isExpiringSoon: daysToExpiry <= 30 && daysToExpiry > 0,
                isExpired: daysToExpiry <= 0,
            };
        });

        // Summary
        const activeBuyers = buyers.filter((b: { isActive: boolean }) => b.isActive).length;
        const totalRevenue = orderStats.reduce((sum: number, s: { totalRevenue: number }) => sum + s.totalRevenue, 0);
        const pendingOrders = orderStats.reduce((sum: number, s: { pendingOrders: number }) => sum + s.pendingOrders, 0);

        return successResponse({
            buyers: buyersWithStats,
            summary: {
                totalBuyers: buyers.length,
                activeBuyers,
                totalRevenue,
                pendingOrders,
            },
        });
    } catch (error) {
        console.error('Get buyers error:', error);
        return errorResponse('Failed to fetch buyers', 500);
    }
}

// POST /api/admin/buyers - Create new buyer
export async function POST(request: NextRequest) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const {
            companyName,
            companyCode,
            contactPerson,
            email,
            phone,
            gstNumber,
            panNumber,
            plantAddress,
            plantCity,
            plantState,
            plantPincode,
            assignedHubs,
            agreementStartDate,
            agreementEndDate,
            pricePerTonne,
            minimumOrderTonnes,
            paymentTermsDays,
        } = body;

        if (!companyName || !companyCode || !contactPerson || !email || !phone) {
            return errorResponse('Company name, code, contact person, email, and phone are required', 400);
        }

        if (!plantAddress || !plantCity || !plantState || !plantPincode) {
            return errorResponse('Plant address details are required', 400);
        }

        if (!agreementStartDate || !agreementEndDate || !pricePerTonne) {
            return errorResponse('Agreement dates and price per tonne are required', 400);
        }

        await dbConnect();

        // Check if code exists
        const existing = await Buyer.findOne({ companyCode: companyCode.toUpperCase() });
        if (existing) {
            return errorResponse('Company code already exists', 400);
        }

        const buyer = await Buyer.create({
            companyName,
            companyCode: companyCode.toUpperCase(),
            contactPerson,
            email,
            phone,
            gstNumber,
            panNumber,
            plantAddress,
            plantCity,
            plantState,
            plantPincode,
            assignedHubs: assignedHubs || [],
            agreementStartDate: new Date(agreementStartDate),
            agreementEndDate: new Date(agreementEndDate),
            pricePerTonne,
            minimumOrderTonnes: minimumOrderTonnes || 10,
            paymentTermsDays: paymentTermsDays || 30,
            isActive: true,
        });

        return successResponse(buyer, 'Buyer created successfully');
    } catch (error) {
        console.error('Create buyer error:', error);
        return errorResponse('Failed to create buyer', 500);
    }
}
