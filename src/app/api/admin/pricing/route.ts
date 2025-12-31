import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import CropPrice from '@/lib/models/CropPrice';
import { successResponse, errorResponse } from '@/lib/utils';
import { CROP_CONSTANTS } from '@/lib/calculator/stubbleCalculator';

// GET /api/admin/pricing - Get all crop prices
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const prices = await CropPrice.find({});

        // If no prices in DB, return defaults
        if (prices.length === 0) {
            const defaults = Object.keys(CROP_CONSTANTS).map(key => ({
                cropType: key,
                pricePerTonne: CROP_CONSTANTS[key as keyof typeof CROP_CONSTANTS].pricePerTonne
            }));
            return successResponse(defaults);
        }

        return successResponse(prices);
    } catch (error) {
        console.error('Get pricing error:', error);
        return errorResponse('Failed to fetch pricing', 500);
    }
}

// POST /api/admin/pricing - Update a crop price
export async function POST(request: NextRequest) {
    try {
        // TODO: Add Admin Authentication check here

        const body = await request.json();
        const { cropType, pricePerTonne } = body;

        if (!cropType || pricePerTonne === undefined) {
            return errorResponse('Crop type and price are required', 400);
        }

        await dbConnect();

        const price = await CropPrice.findOneAndUpdate(
            { cropType: cropType.toLowerCase() },
            { pricePerTonne },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return successResponse(price, 'Price updated successfully');
    } catch (error) {
        console.error('Update pricing error:', error);
        return errorResponse('Failed to update price', 500);
    }
}
