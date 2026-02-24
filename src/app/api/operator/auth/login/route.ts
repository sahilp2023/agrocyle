import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Operator from '@/lib/models/Operator';
import { generateOTP, getOTPExpiry } from '@/lib/utils/auth';
import { successResponse, errorResponse } from '@/lib/utils';

// POST /api/operator/auth/login - Send OTP for login
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone } = body;

        if (!phone || !/^[6-9]\d{9}$/.test(phone)) {
            return errorResponse('Valid Indian phone number is required', 400);
        }

        await dbConnect();

        const operator = await Operator.findOne({ phone });
        if (!operator) {
            return errorResponse('No account found with this phone number. Please register first.', 404);
        }

        if (!operator.isActive) {
            return errorResponse('Your account has been deactivated. Contact support.', 403);
        }

        // Generate OTP
        const otp = generateOTP();
        operator.otp = otp;
        operator.otpExpiry = getOTPExpiry();
        await operator.save();

        // Log OTP to console for development
        console.log(`\n📱 OPERATOR LOGIN OTP for ${phone}: ${otp}\n`);

        return successResponse(
            { phone: operator.phone, otp }, // DEV ONLY: Remove otp in production
            'OTP sent successfully'
        );
    } catch (error) {
        console.error('Operator login error:', error);
        return errorResponse('Failed to send OTP', 500);
    }
}
