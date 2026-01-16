import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db/mongodb';
import BuyerQualitySettings from '@/lib/models/BuyerQualitySettings';
import { successResponse, errorResponse } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'agrocycle-secret-key-change-in-production';

function verifyBuyerToken(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return null;
    }
    try {
        const token = authHeader.substring(7);
        return jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    } catch {
        return null;
    }
}

// GET /api/buyer/quality-settings - Get quality settings
export async function GET(request: NextRequest) {
    try {
        const decoded = verifyBuyerToken(request);
        if (!decoded || decoded.role !== 'buyer') {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();

        let settings = await BuyerQualitySettings.findOne({ buyerId: decoded.id });

        // Create default settings if not exists
        if (!settings) {
            settings = new BuyerQualitySettings({
                buyerId: decoded.id,
                maxMoisturePercent: 15,
                acceptedBaleTypes: ['medium', 'large'],
                rejectionReasons: ['High moisture', 'Contamination', 'Under-weight'],
            });
            await settings.save();
        }

        return successResponse({ settings });
    } catch (error) {
        console.error('Get quality settings error:', error);
        return errorResponse('Failed to fetch quality settings', 500);
    }
}

// PUT /api/buyer/quality-settings - Update quality settings
export async function PUT(request: NextRequest) {
    try {
        const decoded = verifyBuyerToken(request);
        if (!decoded || decoded.role !== 'buyer') {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { maxMoisturePercent, acceptedBaleTypes, rejectionReasons } = body;

        await dbConnect();

        let settings = await BuyerQualitySettings.findOne({ buyerId: decoded.id });

        if (!settings) {
            settings = new BuyerQualitySettings({
                buyerId: decoded.id,
            });
        }

        if (maxMoisturePercent !== undefined) {
            settings.maxMoisturePercent = Math.min(100, Math.max(0, Number(maxMoisturePercent)));
        }

        if (acceptedBaleTypes !== undefined) {
            settings.acceptedBaleTypes = acceptedBaleTypes.filter((t: string) =>
                ['medium', 'large'].includes(t)
            );
        }

        if (rejectionReasons !== undefined) {
            settings.rejectionReasons = rejectionReasons
                .filter((r: string) => r && r.trim())
                .map((r: string) => r.trim());
        }

        await settings.save();

        return successResponse({ settings }, 'Quality settings updated successfully');
    } catch (error) {
        console.error('Update quality settings error:', error);
        return errorResponse('Failed to update quality settings', 500);
    }
}
