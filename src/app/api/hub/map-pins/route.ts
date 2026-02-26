import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Booking from '@/lib/models/Booking';
import Assignment from '@/lib/models/Assignment';
import Farmer from '@/lib/models/Farmer';
import FarmPlot from '@/lib/models/FarmPlot';
import { successResponse, errorResponse } from '@/lib/utils';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';

void Farmer;
void FarmPlot;

// GET /api/hub/map-pins — returns active bookings with farm locations for the map
export async function GET(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) return errorResponse('Unauthorized', 401);

        await dbConnect();

        // Get all non-completed, non-cancelled bookings for this hub
        const bookings = await Booking.find({
            hubId: manager.hubId,
            status: { $in: ['pending', 'confirmed', 'scheduled', 'in_progress'] },
        })
            .populate('farmerId', 'name phone village city location')
            .populate('farmId', 'plotName areaAcre geometry')
            .select('farmerId farmId status cropType estimatedStubbleTonnes scheduledPickupDate')
            .lean();

        // Get assignments for these bookings to determine detailed status
        const bookingIds = bookings.map(b => b._id);
        const assignments = await Assignment.find({
            bookingId: { $in: bookingIds },
            status: { $ne: 'cancelled' },
        })
            .select('bookingId status operatorStatus operatorId')
            .populate('operatorId', 'name')
            .lean();

        // Map assignments by bookingId
        const assignmentMap = new Map<string, typeof assignments[0]>();
        assignments.forEach(a => {
            assignmentMap.set(a.bookingId.toString(), a);
        });

        // Build pins array
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const pins = bookings.map((b: any) => {
            // Get coordinates: prefer farm polygon center, fallback to farmer location
            let lat = 0, lng = 0;
            const farm = b.farmId;
            const farmer = b.farmerId;

            if (farm?.geometry?.coordinates?.[0]?.length > 0) {
                const ring = farm.geometry.coordinates[0];
                lat = ring.reduce((s: number, p: number[]) => s + (p[1] || 0), 0) / ring.length;
                lng = ring.reduce((s: number, p: number[]) => s + (p[0] || 0), 0) / ring.length;
            } else if (farmer?.location?.coordinates?.[0] !== 0 && farmer?.location?.coordinates?.[1] !== 0) {
                lng = farmer.location.coordinates[0];
                lat = farmer.location.coordinates[1];
            }

            // Skip pins with no valid coordinates
            if (lat === 0 && lng === 0) return null;

            const assignment = assignmentMap.get(b._id.toString());

            // Determine display status
            let stage = 'pending';
            if (assignment) {
                if (['work_complete', 'delivered'].includes(assignment.operatorStatus || '')) {
                    stage = 'completed';
                } else if (['work_started', 'en_route', 'arrived'].includes(assignment.operatorStatus || '')) {
                    stage = 'in_progress';
                } else {
                    stage = 'assigned';
                }
            } else if (b.status === 'confirmed' || b.status === 'scheduled') {
                stage = 'confirmed';
            }

            return {
                id: b._id.toString(),
                lat,
                lng,
                stage,
                farmerName: farmer?.name || 'Unknown',
                farmerPhone: farmer?.phone,
                village: farmer?.village || farmer?.city || '',
                cropType: b.cropType,
                quantity: b.estimatedStubbleTonnes,
                plotName: farm?.plotName || '',
                areaAcre: farm?.areaAcre || 0,
                operatorName: (assignment?.operatorId as unknown as { name?: string })?.name,
                scheduledDate: b.scheduledPickupDate,
            };
        }).filter(Boolean);

        return successResponse(pins);
    } catch (error) {
        console.error('Hub map pins error:', error);
        return errorResponse('Failed to fetch map data', 500);
    }
}
