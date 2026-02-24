import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Assignment from '@/lib/models/Assignment';
import Booking from '@/lib/models/Booking';
import Operator from '@/lib/models/Operator';
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
                select: 'cropType estimatedStubbleTonnes actualStubbleTonnes farmerId farmId scheduledPickupDate',
                populate: [
                    { path: 'farmerId', select: 'name phone village city location' },
                    { path: 'farmId', select: 'plotName areaAcre geometry' },
                ]
            })
            .populate('operatorId', 'name phone vehicleNumber operatorType isOnline')
            .sort({ assignedAt: -1 });

        return successResponse(assignments);
    } catch (error) {
        console.error('Get assignments error:', error);
        return errorResponse('Failed to fetch assignments', 500);
    }
}

// POST /api/hub/assignments - Create new assignment (operator-based)
export async function POST(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            console.error('Assignment POST: Unauthorized - no manager token');
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { bookingId, balerId, truckId } = body;
        // balerId & truckId now refer to Operator IDs (from the assign modal)

        console.log('Assignment POST:', { bookingId, balerId, truckId, hubId: manager.hubId });

        if (!bookingId || !balerId) {
            return errorResponse('Booking ID and Operator ID are required', 400);
        }

        await dbConnect();

        // Check if booking exists — try with hubId first, then without
        let booking = await Booking.findOne({ _id: bookingId, hubId: manager.hubId });
        if (!booking) {
            // Booking might not have hubId set — try finding by ID only and set hubId
            booking = await Booking.findById(bookingId);
            if (!booking) {
                console.error('Assignment POST: Booking not found at all', bookingId);
                return errorResponse('Booking not found', 404);
            }
            // Set hubId on the booking if missing
            if (!booking.hubId) {
                console.log('Assignment POST: Setting hubId on booking', bookingId);
                booking.hubId = manager.hubId as unknown as typeof booking.hubId;
                await booking.save();
            }
        }

        // Verify the baler operator exists — try with hubId first, then without
        let balerOperator = await Operator.findOne({
            _id: balerId,
            hubId: manager.hubId,
            isVerified: true,
            isActive: true,
        });
        if (!balerOperator) {
            // Maybe hubId is stored differently — try just by ID + verified
            balerOperator = await Operator.findOne({
                _id: balerId,
                isVerified: true,
                isActive: true,
            });
            if (!balerOperator) {
                console.error('Assignment POST: Operator not found or not verified', balerId);
                return errorResponse('Operator not found or not verified', 404);
            }
            console.log('Assignment POST: Operator found but hubId mismatch. Operator hubId:', balerOperator.hubId, 'Manager hubId:', manager.hubId);
        }

        // Verify the truck operator if provided
        let truckOperatorId = undefined;
        if (truckId) {
            let truckOperator = await Operator.findOne({
                _id: truckId,
                isVerified: true,
                isActive: true,
            });
            if (!truckOperator) {
                console.error('Assignment POST: Truck operator not found', truckId);
                return errorResponse('Truck operator not found or not verified', 404);
            }
            truckOperatorId = truckOperator._id;
        }

        // Check for duplicate assignment on same booking — delete old failed ones
        const existing = await Assignment.findOne({ bookingId });
        if (existing) {
            // If there's an existing cancelled/rejected one, remove it so we can reassign
            if (existing.status === 'cancelled' || existing.operatorStatus === 'rejected') {
                console.log('Assignment POST: Removing old cancelled assignment for rebooking');
                await Assignment.deleteOne({ _id: existing._id });
            } else {
                console.error('Assignment POST: Booking already has active assignment', existing._id);
                return errorResponse('This booking already has an active assignment', 400);
            }
        }

        // Create assignment — operatorId is the baler operator
        // Also set balerId = operator ID for backward compatibility with any cached schema
        const assignment = await Assignment.create({
            bookingId,
            hubId: manager.hubId,
            balerId: balerOperator._id,
            operatorId: balerOperator._id,
            status: 'assigned',
            operatorStatus: 'pending',
            assignedAt: new Date(),
        });

        console.log('Assignment POST: Created successfully', assignment._id);

        // Update booking status
        await Booking.findByIdAndUpdate(bookingId, { status: 'scheduled' });

        return successResponse(assignment, 'Assignment created successfully');
    } catch (error) {
        console.error('Create assignment error:', error);
        const message = error instanceof Error ? error.message : 'Failed to create assignment';
        return errorResponse(message, 500);
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
            assignment.operatorStatus = 'delivered';

            // Update booking status
            await Booking.findByIdAndUpdate(assignment.bookingId, {
                status: 'completed',
                actualStubbleTonnes: actualQuantityTonnes
            });

            // Update operator stats
            if (assignment.operatorId) {
                await Operator.findByIdAndUpdate(assignment.operatorId, {
                    $inc: {
                        totalJobs: 1,
                        totalEarnings: assignment.estimatedEarning || 0,
                    }
                });
            }
        }

        await assignment.save();

        return successResponse(assignment, 'Assignment updated successfully');
    } catch (error) {
        console.error('Update assignment error:', error);
        return errorResponse('Failed to update assignment', 500);
    }
}
