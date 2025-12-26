import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Farmer from '@/lib/models/Farmer';
import { successResponse, errorResponse, formatPhone, isValidIndianPhone } from '@/lib/utils';
import { generateOTP, getOTPExpiry } from '@/lib/utils/auth';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone } = body;

        if (!phone) {
            return errorResponse('Phone number is required', 400);
        }

        const formattedPhone = formatPhone(phone);

        if (!isValidIndianPhone(formattedPhone)) {
            return errorResponse('Invalid Indian phone number', 400);
        }

        await dbConnect();

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = getOTPExpiry();

        // Find or create farmer
        let farmer = await Farmer.findOne({ phone: formattedPhone });

        if (farmer) {
            // Update OTP for existing farmer
            farmer.otp = otp;
            farmer.otpExpiry = otpExpiry;
            await farmer.save();
        } else {
            // Create new farmer with OTP
            farmer = await Farmer.create({
                phone: formattedPhone,
                otp,
                otpExpiry,
            });
        }

        // In production, send OTP via SMS (Twilio, MSG91, etc.)
        // For now, we'll log it for development
        console.log(`📱 OTP for ${formattedPhone}: ${otp}`);

        return successResponse(
            { phone: formattedPhone },
            'OTP sent successfully'
        );
    } catch (error) {
        console.error('Send OTP error:', error);
        return errorResponse('Failed to send OTP', 500);
    }
}
