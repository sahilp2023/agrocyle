import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Assignment from '@/lib/models/Assignment';
import Booking from '@/lib/models/Booking';
import Farmer from '@/lib/models/Farmer';
import FarmPlot from '@/lib/models/FarmPlot';
import Operator from '@/lib/models/Operator';
import Hub from '@/lib/models/Hub';
import { successResponse, errorResponse } from '@/lib/utils';
import { getOperatorFromRequest } from '@/lib/utils/operatorAuth';

// Ensure models are registered for populate
void Farmer;
void Booking;
void FarmPlot;
void Hub;

// GET /api/operator/jobs - Get operator's jobs
export async function GET(request: NextRequest) {
    try {
        const operator = getOperatorFromRequest(request);
        if (!operator) {
            return errorResponse('Unauthorized', 401);
        }

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status'); // active, history, incoming
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        await dbConnect();

        const query: Record<string, unknown> = { operatorId: operator.id };

        if (status === 'incoming') {
            query.operatorStatus = 'pending';
        } else if (status === 'active') {
            query.operatorStatus = { $in: ['accepted', 'en_route', 'arrived', 'work_started'] };
        } else if (status === 'history') {
            query.operatorStatus = { $in: ['delivered', 'work_complete', 'rejected'] };
        }

        const total = await Assignment.countDocuments(query);
        const jobs = await Assignment.find(query)
            .populate({
                path: 'bookingId',
                select: 'cropType estimatedStubbleTonnes actualStubbleTonnes farmerId farmId scheduledPickupDate farmerNotes',
                populate: [
                    { path: 'farmerId', select: 'name phone village city location' },
                    { path: 'farmId', select: 'plotName geometry areaAcre' },
                ]
            })
            .populate('hubId', 'name code city')
            .sort({ assignedAt: -1 })
            .skip((page - 1) * limit)
            .limit(limit);

        return successResponse({
            jobs,
            pagination: {
                page,
                limit,
                total,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        console.error('Get operator jobs error:', error);
        return errorResponse('Failed to fetch jobs', 500);
    }
}

// PATCH /api/operator/jobs - Update job status
export async function PATCH(request: NextRequest) {
    try {
        const operator = getOperatorFromRequest(request);
        if (!operator) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const {
            assignmentId,
            operatorStatus,
            rejectionReason,
            photos,
            baleCount,
            loadWeightTonnes,
            farmerSignature,
            operatorRemarks,
            actualQuantityTonnes,
            timeRequired,
            moistureContent,
            pauseReason,
        } = body;

        if (!assignmentId) {
            return errorResponse('Assignment ID is required', 400);
        }

        await dbConnect();

        const assignment = await Assignment.findOne({ _id: assignmentId, operatorId: operator.id });
        if (!assignment) {
            return errorResponse('Assignment not found', 404);
        }

        // Validate status transitions
        if (operatorStatus) {
            const validTransitions: Record<string, string[]> = {
                'pending': ['accepted', 'rejected'],
                'accepted': ['en_route', 'work_started'],
                'en_route': ['arrived'],
                'arrived': ['work_started'],
                'work_started': ['work_complete'],
                'work_complete': ['delivered'],
            };

            const currentStatus = assignment.operatorStatus || 'pending';
            const allowed = validTransitions[currentStatus] || [];
            if (!allowed.includes(operatorStatus)) {
                return errorResponse(
                    `Cannot transition from "${currentStatus}" to "${operatorStatus}". Allowed: ${allowed.join(', ')}`,
                    400
                );
            }

            assignment.operatorStatus = operatorStatus;

            // Set timestamps for each transition
            const now = new Date();
            switch (operatorStatus) {
                case 'accepted':
                    assignment.acceptedAt = now;
                    assignment.status = 'in_progress';
                    break;
                case 'rejected':
                    assignment.rejectionReason = rejectionReason || 'No reason provided';
                    assignment.status = 'cancelled';
                    // Reset booking status
                    await Booking.findByIdAndUpdate(assignment.bookingId, { status: 'confirmed' });
                    break;
                case 'en_route':
                    assignment.enRouteAt = now;
                    assignment.startedAt = now;
                    break;
                case 'arrived':
                    assignment.arrivedAt = now;
                    break;
                case 'work_started':
                    assignment.workStartedAt = now;
                    break;
                case 'work_complete':
                    assignment.workCompletedAt = now;
                    // work_complete means operator has submitted form — stays in_progress until hub approves
                    break;
                case 'delivered':
                    assignment.completedAt = now;
                    assignment.status = 'completed';
                    // Update booking
                    await Booking.findByIdAndUpdate(assignment.bookingId, {
                        status: 'completed',
                        actualStubbleTonnes: actualQuantityTonnes || assignment.actualQuantityTonnes,
                    });
                    // Update operator stats
                    await Operator.findByIdAndUpdate(operator.id, {
                        $inc: {
                            totalJobs: 1,
                            totalEarnings: assignment.estimatedEarning || 0,
                        }
                    });
                    break;
            }
        }

        // Update work documentation fields
        if (photos) {
            if (!assignment.photos) {
                assignment.photos = { before: [], after: [], fieldCondition: [] };
            }
            if (photos.before) assignment.photos.before.push(...photos.before);
            if (photos.after) assignment.photos.after.push(...photos.after);
            if (photos.fieldCondition) assignment.photos.fieldCondition.push(...photos.fieldCondition);
        }
        if (baleCount !== undefined) assignment.baleCount = baleCount;
        if (loadWeightTonnes !== undefined) assignment.loadWeightTonnes = loadWeightTonnes;
        if (actualQuantityTonnes !== undefined) assignment.actualQuantityTonnes = actualQuantityTonnes;
        if (farmerSignature) assignment.farmerSignature = farmerSignature;
        if (operatorRemarks) assignment.operatorRemarks = operatorRemarks;
        if (pauseReason) assignment.pauseReason = pauseReason;
        // Additional fields for completion form
        if (timeRequired !== undefined) assignment.set('timeRequired', timeRequired);
        if (moistureContent !== undefined) assignment.set('moistureContent', moistureContent);

        await assignment.save();

        return successResponse(assignment, 'Job updated successfully');
    } catch (error) {
        console.error('Update operator job error:', error);
        return errorResponse('Failed to update job', 500);
    }
}
