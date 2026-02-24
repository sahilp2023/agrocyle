import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Operator from '@/lib/models/Operator';
import { generateOTP, getOTPExpiry } from '@/lib/utils/auth';
import { successResponse, errorResponse } from '@/lib/utils';

// POST /api/operator/auth/register - Register new operator
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            phone,
            name,
            operatorType,
            vehicleNumber,
            vehicleModel,
            licenseNumber,
            upiId,
            profilePhoto,
            hubId,
        } = body;

        // Validation
        if (!phone || !name || !operatorType || !vehicleNumber) {
            return errorResponse('Phone, name, operator type, and vehicle number are required', 400);
        }

        if (!/^[6-9]\d{9}$/.test(phone)) {
            return errorResponse('Invalid Indian phone number', 400);
        }

        if (!['baler', 'truck', 'both'].includes(operatorType)) {
            return errorResponse('Operator type must be baler, truck, or both', 400);
        }

        await dbConnect();

        // Check if operator already exists
        const existing = await Operator.findOne({ phone });
        if (existing) {
            return errorResponse('Phone number already registered. Please login instead.', 409);
        }

        // Generate OTP
        const otp = generateOTP();
        const otpExpiry = getOTPExpiry();

        // Create operator
        const operator = await Operator.create({
            phone,
            name,
            operatorType,
            vehicleNumber: vehicleNumber.toUpperCase(),
            vehicleModel: vehicleModel || '',
            licenseNumber: licenseNumber || '',
            upiId: upiId || '',
            profilePhoto: profilePhoto || '',
            hubId: hubId || undefined,
            otp,
            otpExpiry,
        });

        // Log OTP to console for development
        console.log(`\n📱 OPERATOR OTP for ${phone}: ${otp}\n`);

        return NextResponse.json(
            {
                success: true,
                message: 'OTP sent successfully. Please verify to complete registration.',
                data: {
                    operatorId: operator._id,
                    phone: operator.phone,
                    otp, // DEV ONLY: Remove in production
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error('Operator registration error:', error);
        return errorResponse('Failed to register operator', 500);
    }
}
