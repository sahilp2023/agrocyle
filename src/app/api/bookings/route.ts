import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Booking from '@/lib/models/Booking';
import Farm from '@/lib/models/Farm';
import { successResponse, errorResponse, getPaginationParams, createPaginationMeta } from '@/lib/utils';
import { getFarmerIdFromRequest } from '@/lib/utils/auth';
import { calculateStubbleEstimate } from '@/lib/calculator/stubbleCalculator';
import type { CropType } from '@/lib/models/Farm';

// GET /api/bookings - List bookings
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const farmerId = searchParams.get('farmerId');
        const status = searchParams.get('status');
        const fromDate = searchParams.get('fromDate');
        const toDate = searchParams.get('toDate');
        const { page, limit, skip } = getPaginationParams(searchParams);

        const query: Record<string, unknown> = {};

        if (farmerId) {
            query.farmerId = farmerId;
        }

        if (status) {
            query.status = status;
        }

        if (fromDate || toDate) {
            query.createdAt = {};
            if (fromDate) {
                (query.createdAt as Record<string, Date>)['$gte'] = new Date(fromDate);
            }
            if (toDate) {
                (query.createdAt as Record<string, Date>)['$lte'] = new Date(toDate);
            }
        }

        const total = await Booking.countDocuments(query);
        const bookings = await Booking.find(query)
            .populate('farmId', 'name cropType areaInAcres location')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return successResponse(
            bookings,
            undefined,
            createPaginationMeta(total, page, limit)
        );
    } catch (error) {
        console.error('Get bookings error:', error);
        return errorResponse('Failed to fetch bookings', 500);
    }
}

// POST /api/bookings - Create new booking
export async function POST(request: NextRequest) {
    try {
        const farmerId = getFarmerIdFromRequest(request);
        if (!farmerId) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { farmId, harvestEndDate, scheduledPickupDate, farmerNotes } = body;

        if (!farmId || !harvestEndDate) {
            return errorResponse('Farm ID and harvest end date are required', 400);
        }

        await dbConnect();

        // Get farm details for estimation
        const farm = await Farm.findOne({ _id: farmId, farmerId, isActive: true });
        if (!farm) {
            return errorResponse('Farm not found', 404);
        }

        // Calculate stubble estimate
        const estimate = calculateStubbleEstimate(
            farm.cropType as CropType,
            farm.areaInAcres
        );

        // Create booking
        const booking = await Booking.create({
            farmerId,
            farmId,
            harvestEndDate: new Date(harvestEndDate),
            scheduledPickupDate: scheduledPickupDate ? new Date(scheduledPickupDate) : undefined,
            status: 'pending',
            estimatedStubbleTonnes: estimate.estimatedTonnes,
            estimatedPrice: estimate.estimatedPrice,
            farmerNotes,
        });

        // Populate farm details
        await booking.populate('farmId', 'name cropType areaInAcres');

        return successResponse(booking, 'Booking created successfully');
    } catch (error) {
        console.error('Create booking error:', error);
        return errorResponse('Failed to create booking', 500);
    }
}

// PATCH /api/bookings - Update booking (status, actual weight, etc.)
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            bookingId,
            status,
            scheduledPickupDate,
            actualPickupDate,
            actualStubbleTonnes,
            adminNotes,
            cancellationReason,
        } = body;

        if (!bookingId) {
            return errorResponse('Booking ID is required', 400);
        }

        await dbConnect();

        const booking = await Booking.findById(bookingId);
        if (!booking) {
            return errorResponse('Booking not found', 404);
        }

        // Update fields
        if (status) booking.status = status;
        if (scheduledPickupDate) booking.scheduledPickupDate = new Date(scheduledPickupDate);
        if (actualPickupDate) booking.actualPickupDate = new Date(actualPickupDate);
        if (adminNotes) booking.adminNotes = adminNotes;
        if (cancellationReason) booking.cancellationReason = cancellationReason;

        // If actual weight is provided, calculate final price
        if (actualStubbleTonnes !== undefined) {
            booking.actualStubbleTonnes = actualStubbleTonnes;

            // Get farm to calculate final price
            const farm = await Farm.findById(booking.farmId);
            if (farm) {
                const estimate = calculateStubbleEstimate(farm.cropType as CropType, farm.areaInAcres);
                booking.finalPrice = Math.round(actualStubbleTonnes * estimate.pricePerTonne);
            }
        }

        await booking.save();
        await booking.populate('farmId', 'name cropType areaInAcres');

        return successResponse(booking, 'Booking updated successfully');
    } catch (error) {
        console.error('Update booking error:', error);
        return errorResponse('Failed to update booking', 500);
    }
}
