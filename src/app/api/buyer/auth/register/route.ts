import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Buyer from '@/lib/models/Buyer';
import BuyerQualitySettings from '@/lib/models/BuyerQualitySettings';
import { successResponse, errorResponse } from '@/lib/utils';

// POST /api/buyer/auth/register - Register new buyer
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            companyName,
            companyCode,
            contactPerson,
            email,
            phone,
            password,
            gstNumber,
            panNumber,
            plantAddress,
            plantCity,
            plantState,
            plantPincode,
            agreementStartDate,
            agreementEndDate,
            pricePerTonne,
            minimumOrderTonnes,
        } = body;

        // Validate required fields
        if (!companyName || !companyCode || !contactPerson || !email || !phone || !password) {
            return errorResponse('Missing required fields', 400);
        }

        if (!plantAddress || !plantCity || !plantState || !plantPincode) {
            return errorResponse('Plant location details are required', 400);
        }

        if (!agreementStartDate || !agreementEndDate || !pricePerTonne) {
            return errorResponse('Agreement terms are required', 400);
        }

        if (password.length < 6) {
            return errorResponse('Password must be at least 6 characters', 400);
        }

        await dbConnect();

        // Check if email or company code already exists
        const existingBuyer = await Buyer.findOne({
            $or: [
                { email: email.toLowerCase().trim() },
                { companyCode: companyCode.toUpperCase().trim() }
            ]
        });

        if (existingBuyer) {
            if (existingBuyer.email === email.toLowerCase().trim()) {
                return errorResponse('Email already registered', 409);
            }
            return errorResponse('Company code already exists', 409);
        }

        // Create buyer
        const buyer = new Buyer({
            companyName: companyName.trim(),
            companyCode: companyCode.toUpperCase().trim(),
            contactPerson: contactPerson.trim(),
            email: email.toLowerCase().trim(),
            phone: phone.trim(),
            passwordHash: password, // Will be hashed by pre-save hook
            gstNumber: gstNumber?.trim(),
            panNumber: panNumber?.toUpperCase().trim(),
            plantAddress: plantAddress.trim(),
            plantCity: plantCity.trim(),
            plantState: plantState.trim(),
            plantPincode: plantPincode.trim(),
            agreementStartDate: new Date(agreementStartDate),
            agreementEndDate: new Date(agreementEndDate),
            pricePerTonne: Number(pricePerTonne),
            minimumOrderTonnes: Number(minimumOrderTonnes) || 10,
            agreementAccepted: false,
            isActive: true,
        });

        await buyer.save();

        // Create default quality settings for this buyer
        const qualitySettings = new BuyerQualitySettings({
            buyerId: buyer._id,
            maxMoisturePercent: 15,
            acceptedBaleTypes: ['medium', 'large'],
            rejectionReasons: ['High moisture', 'Contamination', 'Under-weight'],
        });
        await qualitySettings.save();

        return successResponse({
            buyer: {
                id: buyer._id,
                companyName: buyer.companyName,
                companyCode: buyer.companyCode,
                email: buyer.email,
            }
        }, 'Registration successful. Please accept the agreement to continue.', 201);
    } catch (error) {
        console.error('Buyer registration error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return errorResponse(`Registration failed: ${errorMessage}`, 500);
    }
}
