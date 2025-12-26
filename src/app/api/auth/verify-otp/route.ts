import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Farmer from '@/lib/models/Farmer';
import { successResponse, errorResponse, formatPhone } from '@/lib/utils';
import { generateToken, isOTPExpired } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, otp } = body;

        if (!phone || !otp) {
            return errorResponse('Phone and OTP are required', 400);
        }

        const formattedPhone = formatPhone(phone);

        await dbConnect();

        // Find farmer
        const farmer = await Farmer.findOne({ phone: formattedPhone });

        if (!farmer) {
            return errorResponse('Farmer not found', 404);
        }

        // Verify OTP
        if (!farmer.otp || farmer.otp !== otp) {
            return errorResponse('Invalid OTP', 400);
        }

        // Check expiry
        if (!farmer.otpExpiry || isOTPExpired(farmer.otpExpiry)) {
            return errorResponse('OTP has expired', 400);
        }

        // Clear OTP
        farmer.otp = undefined;
        farmer.otpExpiry = undefined;
        await farmer.save();

        // Generate JWT token
        const token = generateToken({
            farmerId: farmer._id.toString(),
            phone: farmer.phone,
        });

        // Check if new user (needs KYC)
        const isNewUser = !farmer.name || !farmer.kycVerified;

        return successResponse({
            token,
            farmer: {
                id: farmer._id,
                phone: farmer.phone,
                name: farmer.name,
                kycVerified: farmer.kycVerified,
                language: farmer.language,
            },
            isNewUser,
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        return errorResponse('Failed to verify OTP', 500);
    }
}
