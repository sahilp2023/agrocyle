import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';
import dbConnect from '@/lib/db/mongodb';
import Buyer from '@/lib/models/Buyer';
import { successResponse, errorResponse } from '@/lib/utils';

const JWT_SECRET = process.env.JWT_SECRET || 'agrocycle-secret-key-change-in-production';

// POST /api/buyer/auth/login - Buyer Login
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        if (!email || !password) {
            return errorResponse('Email and password are required', 400);
        }

        await dbConnect();

        // Find buyer by email
        const buyer = await Buyer.findOne({
            email: email.toLowerCase().trim(),
            isActive: true
        });

        if (!buyer) {
            return errorResponse('Invalid email or password', 401);
        }

        // Check if agreement is accepted
        if (!buyer.agreementAccepted) {
            return errorResponse('Please accept the agreement before logging in', 403);
        }

        // Verify password
        const isMatch = await buyer.comparePassword(password);
        if (!isMatch) {
            return errorResponse('Invalid email or password', 401);
        }

        // Update last login
        await Buyer.updateOne({ _id: buyer._id }, { lastLogin: new Date() });

        // Generate JWT token
        const token = jwt.sign(
            {
                id: buyer._id.toString(),
                email: buyer.email,
                companyCode: buyer.companyCode,
                role: 'buyer'
            },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        return successResponse({
            token,
            buyer: {
                id: buyer._id,
                companyName: buyer.companyName,
                companyCode: buyer.companyCode,
                contactPerson: buyer.contactPerson,
                email: buyer.email,
                phone: buyer.phone,
                plantCity: buyer.plantCity,
                plantState: buyer.plantState,
            }
        }, 'Login successful');
    } catch (error) {
        console.error('Buyer login error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        return errorResponse(`Login failed: ${errorMessage}`, 500);
    }
}

// GET /api/buyer/auth/login - Verify token and get buyer info
export async function GET(request: NextRequest) {
    try {
        const authHeader = request.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return errorResponse('No token provided', 401);
        }

        const token = authHeader.substring(7);

        try {
            const decoded = jwt.verify(token, JWT_SECRET) as { id: string };

            await dbConnect();

            const buyer = await Buyer.findById(decoded.id)
                .select('-passwordHash');

            if (!buyer || !buyer.isActive) {
                return errorResponse('Buyer not found or inactive', 401);
            }

            return successResponse({
                buyer: {
                    id: buyer._id,
                    companyName: buyer.companyName,
                    companyCode: buyer.companyCode,
                    contactPerson: buyer.contactPerson,
                    email: buyer.email,
                    phone: buyer.phone,
                    plantCity: buyer.plantCity,
                    plantState: buyer.plantState,
                }
            });
        } catch {
            return errorResponse('Invalid token', 401);
        }
    } catch (error) {
        console.error('Token verification error:', error);
        return errorResponse('Authentication failed', 500);
    }
}
