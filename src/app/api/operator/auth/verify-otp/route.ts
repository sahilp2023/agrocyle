import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db/mongodb';
import Operator from '@/lib/models/Operator';
import { isOTPExpired } from '@/lib/utils/auth';
import { successResponse, errorResponse } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'agrocycle-secret-key-change-in-production';

// POST /api/operator/auth/verify-otp - Verify OTP and return JWT
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { phone, otp } = body;

        if (!phone || !otp) {
            return errorResponse('Phone and OTP are required', 400);
        }

        await dbConnect();

        const operator = await Operator.findOne({ phone });
        if (!operator) {
            return errorResponse('Operator not found', 404);
        }

        // Verify OTP
        if (!operator.otp || !operator.otpExpiry) {
            return errorResponse('No OTP was sent. Please request a new one.', 400);
        }

        if (isOTPExpired(operator.otpExpiry)) {
            return errorResponse('OTP has expired. Please request a new one.', 400);
        }

        if (operator.otp !== otp) {
            return errorResponse('Invalid OTP', 400);
        }

        // Clear OTP
        operator.otp = undefined;
        operator.otpExpiry = undefined;
        operator.isOnline = true;
        await operator.save();

        // Generate JWT
        const token = jwt.sign(
            {
                id: operator._id.toString(),
                phone: operator.phone,
                operatorType: operator.operatorType,
                role: 'operator',
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return successResponse({
            token,
            operator: {
                id: operator._id,
                phone: operator.phone,
                name: operator.name,
                operatorType: operator.operatorType,
                vehicleNumber: operator.vehicleNumber,
                vehicleModel: operator.vehicleModel,
                profilePhoto: operator.profilePhoto,
                isVerified: operator.isVerified,
                isOnline: operator.isOnline,
                hubId: operator.hubId,
                totalJobs: operator.totalJobs,
                totalEarnings: operator.totalEarnings,
            },
        }, 'Login successful');
    } catch (error) {
        console.error('OTP verification error:', error);
        return errorResponse('Failed to verify OTP', 500);
    }
}
