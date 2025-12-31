import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Buyer from '@/lib/models/Buyer';
import BuyerOrder from '@/lib/models/BuyerOrder';
import BuyerContract from '@/lib/models/BuyerContract';
import Hub from '@/lib/models/Hub';
import { successResponse, errorResponse } from '@/lib/utils';
import { getAdminFromRequest } from '@/lib/utils/adminAuth';
import mongoose from 'mongoose';

// Ensure models are registered
void Hub;
void BuyerContract;

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET /api/admin/buyers/[id] - Get full buyer details with analytics
export async function GET(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;

        await dbConnect();

        const buyer = await Buyer.findById(id).lean();
        if (!buyer) {
            return errorResponse('Buyer not found', 404);
        }

        // Get assigned hubs
        const hubs = await Hub.find({
            _id: { $in: buyer.assignedHubs || [] }
        }).select('name city state').lean();

        // Get contracts
        const contracts = await BuyerContract.find({ buyerId: id })
            .sort({ uploadedAt: -1 })
            .lean();

        // Get order stats
        const orderStats = await BuyerOrder.aggregate([
            { $match: { buyerId: new mongoose.Types.ObjectId(id) } },
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: '$totalAmount' },
                    totalDelivered: {
                        $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, '$quantityTonnes', 0] }
                    },
                    paidAmount: { $sum: '$paidAmount' },
                },
            },
        ]);
        const stats = orderStats[0] || { totalOrders: 0, totalRevenue: 0, totalDelivered: 0, paidAmount: 0 };
        const pendingPayment = stats.totalRevenue - stats.paidAmount;

        // Get recent orders
        const recentOrders = await BuyerOrder.find({ buyerId: id })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate('hubId', 'name')
            .lean();

        // Get pending orders
        const pendingOrders = await BuyerOrder.find({
            buyerId: id,
            status: { $in: ['pending', 'confirmed', 'dispatched'] }
        })
            .populate('hubId', 'name')
            .sort({ requestedDate: 1 })
            .lean();

        // Monthly supply data (last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const monthlySupply = await BuyerOrder.aggregate([
            {
                $match: {
                    buyerId: new mongoose.Types.ObjectId(id),
                    status: 'delivered',
                    deliveredDate: { $gte: sixMonthsAgo },
                },
            },
            {
                $group: {
                    _id: { $month: '$deliveredDate' },
                    quantity: { $sum: '$quantityTonnes' },
                    revenue: { $sum: '$totalAmount' },
                },
            },
            { $sort: { _id: 1 } },
        ]);

        const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const monthlyData = monthlySupply.map((m: { _id: number; quantity: number; revenue: number }) => ({
            month: monthNames[m._id - 1],
            quantity: m.quantity,
            revenue: m.revenue,
        }));

        return successResponse({
            buyer,
            assignedHubs: hubs,
            contracts,
            analytics: {
                totalOrders: stats.totalOrders,
                totalRevenue: stats.totalRevenue,
                totalDelivered: stats.totalDelivered,
                paidAmount: stats.paidAmount,
                pendingPayment: Math.max(0, pendingPayment),
            },
            recentOrders,
            pendingOrders,
            monthlyData,
        });
    } catch (error) {
        console.error('Get buyer details error:', error);
        return errorResponse('Failed to fetch buyer details', 500);
    }
}

// PATCH /api/admin/buyers/[id] - Update buyer info
export async function PATCH(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;
        const body = await request.json();

        await dbConnect();

        const buyer = await Buyer.findById(id);
        if (!buyer) {
            return errorResponse('Buyer not found', 404);
        }

        // Update allowed fields
        const allowedFields = [
            'companyName', 'contactPerson', 'email', 'phone', 'gstNumber', 'panNumber',
            'plantAddress', 'plantCity', 'plantState', 'plantPincode',
            'assignedHubs', 'agreementStartDate', 'agreementEndDate',
            'pricePerTonne', 'minimumOrderTonnes', 'paymentTermsDays', 'isActive'
        ];

        allowedFields.forEach(field => {
            if (body[field] !== undefined) {
                if (field === 'agreementStartDate' || field === 'agreementEndDate') {
                    (buyer as unknown as Record<string, unknown>)[field] = new Date(body[field]);
                } else {
                    (buyer as unknown as Record<string, unknown>)[field] = body[field];
                }
            }
        });

        await buyer.save();

        return successResponse(buyer, 'Buyer updated successfully');
    } catch (error) {
        console.error('Update buyer error:', error);
        return errorResponse('Failed to update buyer', 500);
    }
}

// DELETE /api/admin/buyers/[id] - Deactivate buyer
export async function DELETE(request: NextRequest, context: RouteParams) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const { id } = await context.params;

        await dbConnect();

        const buyer = await Buyer.findById(id);
        if (!buyer) {
            return errorResponse('Buyer not found', 404);
        }

        buyer.isActive = false;
        await buyer.save();

        return successResponse({ message: 'Buyer deactivated' });
    } catch (error) {
        console.error('Delete buyer error:', error);
        return errorResponse('Failed to deactivate buyer', 500);
    }
}
