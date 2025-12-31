import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Assignment from '@/lib/models/Assignment';
import Booking from '@/lib/models/Booking';
import Baler from '@/lib/models/Baler';
import Farmer from '@/lib/models/Farmer';
import { successResponse, errorResponse } from '@/lib/utils';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';

// Ensure Farmer model is registered for populate
void Farmer;

// GET /api/hub/assignments - Get assignments for a hub
export async function GET(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status');

        await dbConnect();

        const query: Record<string, unknown> = { hubId: manager.hubId };
        if (status) {
            query.status = status;
        }

        const assignments = await Assignment.find(query)
            .populate({
                path: 'bookingId',
                select: 'cropType estimatedStubbleTonnes actualStubbleTonnes',
                populate: {
                    path: 'farmerId',
                    select: 'name phone',
                }
            })
            .populate('balerId', 'vehicleNumber operatorName timePerTonne')
            .populate('truckId', 'vehicleNumber operatorName capacity')
            .sort({ assignedAt: -1 });

        return successResponse(assignments);
    } catch (error) {
        console.error('Get assignments error:', error);
        return errorResponse('Failed to fetch assignments', 500);
    }
}

// POST /api/hub/assignments - Create new assignment
export async function POST(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { bookingId, balerId, truckId } = body;

        if (!bookingId || !balerId) {
            return errorResponse('Booking ID and Baler ID are required', 400);
        }

        await dbConnect();

        // Check if booking exists and belongs to this hub
        const booking = await Booking.findOne({ _id: bookingId, hubId: manager.hubId });
        if (!booking) {
            return errorResponse('Booking not found', 404);
        }

        // Check if baler exists and is available
        const baler = await Baler.findOne({ _id: balerId, hubId: manager.hubId });
        if (!baler) {
            return errorResponse('Baler not found', 404);
        }
        if (baler.status !== 'available') {
            return errorResponse('Baler is not available', 400);
        }

        // Check if truck exists and is available (if provided)
        if (truckId) {
            const truck = await Baler.findOne({ _id: truckId, hubId: manager.hubId, vehicleType: 'truck' });
            if (!truck) {
                return errorResponse('Truck not found', 404);
            }
            if (truck.status !== 'available') {
                return errorResponse('Truck is not available', 400);
            }
        }

        // Create assignment
        const assignment = await Assignment.create({
            bookingId,
            balerId,
            truckId: truckId || undefined,
            hubId: manager.hubId,
            status: 'assigned',
            assignedAt: new Date(),
        });

        // Update baler status to busy
        await Baler.findByIdAndUpdate(balerId, { status: 'busy' });

        // Update truck status to busy (if provided)
        if (truckId) {
            await Baler.findByIdAndUpdate(truckId, { status: 'busy' });
        }

        // Update booking status
        await Booking.findByIdAndUpdate(bookingId, { status: 'scheduled' });

        return successResponse(assignment, 'Assignment created successfully');
    } catch (error) {
        console.error('Create assignment error:', error);
        return errorResponse('Failed to create assignment', 500);
    }
}

// PATCH /api/hub/assignments - Update assignment (mark complete, etc)
export async function PATCH(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { assignmentId, status, actualQuantityTonnes, notes } = body;

        if (!assignmentId) {
            return errorResponse('Assignment ID is required', 400);
        }

        await dbConnect();

        const assignment = await Assignment.findOne({ _id: assignmentId, hubId: manager.hubId });
        if (!assignment) {
            return errorResponse('Assignment not found', 404);
        }

        // Update assignment
        if (status) assignment.status = status;
        if (actualQuantityTonnes !== undefined) assignment.actualQuantityTonnes = actualQuantityTonnes;
        if (notes) assignment.notes = notes;

        if (status === 'completed') {
            assignment.completedAt = new Date();

            // Update baler status back to available
            await Baler.findByIdAndUpdate(assignment.balerId, {
                status: 'available',
                $inc: { totalTrips: 1 }
            });

            // Update truck status back to available (if assigned)
            if (assignment.truckId) {
                await Baler.findByIdAndUpdate(assignment.truckId, {
                    status: 'available',
                    $inc: { totalTrips: 1 }
                });
            }

            // Update booking status
            await Booking.findByIdAndUpdate(assignment.bookingId, {
                status: 'completed',
                actualStubbleTonnes: actualQuantityTonnes
            });
        }

        await assignment.save();

        return successResponse(assignment, 'Assignment updated successfully');
    } catch (error) {
        console.error('Update assignment error:', error);
        return errorResponse('Failed to update assignment', 500);
    }
}
