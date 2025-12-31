import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import { successResponse, errorResponse } from '@/lib/utils';
import { calculateStubbleEstimate, getAllCrops, CROP_CONSTANTS } from '@/lib/calculator/stubbleCalculator';
import type { CropType } from '@/lib/models/Farm';
import CropPrice from '@/lib/models/CropPrice';

// POST /api/calculator - Calculate stubble estimate
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { cropType, areaInAcres } = body;

        if (!cropType || areaInAcres === undefined) {
            return errorResponse('Crop type and area are required', 400);
        }

        if (!CROP_CONSTANTS[cropType as CropType]) {
            return errorResponse('Invalid crop type', 400);
        }

        if (areaInAcres < 0.1 || areaInAcres > 1000) {
            return errorResponse('Area must be between 0.1 and 1000 acres', 400);
        }

        // Fetch dynamic price
        await dbConnect();
        const priceDoc = await CropPrice.findOne({ cropType: cropType.toLowerCase() });
        const pricePerTonne = priceDoc ? priceDoc.pricePerTonne : undefined;

        const estimate = calculateStubbleEstimate(cropType as CropType, areaInAcres, pricePerTonne);

        return successResponse(estimate);
    } catch (error) {
        console.error('Calculator error:', error);
        return errorResponse('Failed to calculate estimate', 500);
    }
}

// GET /api/calculator - Get all crop types and their info
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const language = (searchParams.get('lang') as 'hi' | 'en') || 'hi';

        const crops = getAllCrops(language);

        return successResponse({
            crops,
            priceNote: language === 'hi'
                ? 'कीमतें बाजार के अनुसार बदल सकती हैं'
                : 'Prices may vary based on market conditions',
        });
    } catch (error) {
        console.error('Get crops error:', error);
        return errorResponse('Failed to fetch crop types', 500);
    }
}
