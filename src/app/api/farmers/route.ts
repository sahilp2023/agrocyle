import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Farmer from '@/lib/models/Farmer';
import { successResponse, errorResponse, getPaginationParams, createPaginationMeta } from '@/lib/utils';
import { getFarmerIdFromRequest } from '@/lib/utils/auth';

// GET /api/farmers - List all farmers (admin) or get current farmer
export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        const { searchParams } = new URL(request.url);
        const farmerId = searchParams.get('farmerId');

        // If farmerId is provided, get specific farmer
        if (farmerId) {
            const farmer = await Farmer.findById(farmerId).select('-otp -otpExpiry');
            if (!farmer) {
                return errorResponse('Farmer not found', 404);
            }
            return successResponse(farmer);
        }

        // List all farmers (for admin dashboard)
        const { page, limit, skip } = getPaginationParams(searchParams);

        const total = await Farmer.countDocuments();
        const farmers = await Farmer.find()
            .select('-otp -otpExpiry')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        return successResponse(
            farmers,
            undefined,
            createPaginationMeta(total, page, limit)
        );
    } catch (error) {
        console.error('Get farmers error:', error);
        return errorResponse('Failed to fetch farmers', 500);
    }
}

// POST /api/farmers - Create/Update farmer profile (KYC)
export async function POST(request: NextRequest) {
    try {
        const farmerId = getFarmerIdFromRequest(request);
        if (!farmerId) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const { name, aadhaarNumber, upiId, language, location, pincode, village, city, state } = body;

        await dbConnect();

        const farmer = await Farmer.findById(farmerId);
        if (!farmer) {
            return errorResponse('Farmer not found', 404);
        }

        // Update farmer profile
        if (name) farmer.name = name;
        if (aadhaarNumber) farmer.aadhaarNumber = aadhaarNumber;
        if (upiId) farmer.upiId = upiId;
        if (language) farmer.language = language;
        if (location) farmer.location = location;
        if (pincode) farmer.pincode = pincode;
        if (village) farmer.village = village;
        if (city) farmer.city = city;
        if (state) farmer.state = state;

        // Mark KYC as completed if name and aadhaar are provided
        if (farmer.name && farmer.aadhaarNumber) {
            farmer.kycVerified = true;
        }

        await farmer.save();

        return successResponse({
            id: farmer._id,
            phone: farmer.phone,
            name: farmer.name,
            aadhaarNumber: farmer.aadhaarNumber ? '****' + farmer.aadhaarNumber.slice(-4) : null,
            upiId: farmer.upiId,
            kycVerified: farmer.kycVerified,
            language: farmer.language,
            pincode: farmer.pincode,
            village: farmer.village,
            city: farmer.city,
            state: farmer.state,
        }, 'Profile updated successfully');
    } catch (error) {
        console.error('Update farmer error:', error);
        return errorResponse('Failed to update profile', 500);
    }
}
