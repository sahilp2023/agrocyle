import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Hub from '@/lib/models/Hub';
import HubManager from '@/lib/models/HubManager';
import InventoryLog from '@/lib/models/InventoryLog';
import { successResponse, errorResponse } from '@/lib/utils';
import { getAdminFromRequest } from '@/lib/utils/adminAuth';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

// Ensure models are registered
void HubManager;

// GET /api/admin/hubs - Get all hubs with inventory stats
export async function GET(request: NextRequest) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        await dbConnect();

        // Get all hubs
        const hubs = await Hub.find().lean();

        // Get hub managers
        const managers = await HubManager.find({ isActive: true }).lean();
        const managerByHub: Record<string, { name: string; email: string }> = {};
        managers.forEach((m: { hubId: mongoose.Types.ObjectId; name: string; email: string }) => {
            managerByHub[m.hubId.toString()] = { name: m.name, email: m.email };
        });

        // Get inventory stats per hub
        const inventoryStats = await InventoryLog.aggregate([
            {
                $group: {
                    _id: { hubId: '$hubId', type: '$type' },
                    total: { $sum: '$quantityTonnes' },
                },
            },
        ]);

        const inventoryByHub: Record<string, { inbound: number; outbound: number }> = {};
        inventoryStats.forEach((stat: { _id: { hubId: mongoose.Types.ObjectId; type: string }; total: number }) => {
            const hubId = stat._id.hubId.toString();
            if (!inventoryByHub[hubId]) {
                inventoryByHub[hubId] = { inbound: 0, outbound: 0 };
            }
            if (stat._id.type === 'inbound') {
                inventoryByHub[hubId].inbound = stat.total;
            } else {
                inventoryByHub[hubId].outbound = stat.total;
            }
        });

        // Combine data
        const hubsWithStats = hubs.map((hub: {
            _id: mongoose.Types.ObjectId;
            name: string;
            city: string;
            state: string;
            isActive: boolean;
            capacity?: number;
        }) => {
            const hubId = hub._id.toString();
            const inv = inventoryByHub[hubId] || { inbound: 0, outbound: 0 };
            const currentStock = Math.max(0, inv.inbound - inv.outbound);
            const capacity = hub.capacity || 500; // Default capacity
            const manager = managerByHub[hubId];

            return {
                _id: hub._id,
                name: hub.name,
                city: hub.city,
                state: hub.state,
                isActive: hub.isActive,
                currentStock,
                capacity,
                capacityPercent: Math.min(100, Math.round((currentStock / capacity) * 100)),
                manager: manager || null,
                // Quality distribution (mock for now)
                qualityGood: Math.round(currentStock * 0.85),
                qualityHighMoisture: Math.round(currentStock * 0.15),
            };
        });

        // Calculate summary stats
        const totalStock = hubsWithStats.reduce((sum: number, h: { currentStock: number }) => sum + h.currentStock, 0);
        const avgCapacity = hubsWithStats.length > 0
            ? Math.round(hubsWithStats.reduce((sum: number, h: { capacityPercent: number }) => sum + h.capacityPercent, 0) / hubsWithStats.length)
            : 0;
        const highCapacityHubs = hubsWithStats.filter((h: { capacityPercent: number }) => h.capacityPercent >= 80).length;

        return successResponse({
            hubs: hubsWithStats,
            summary: {
                totalHubs: hubs.length,
                totalStock,
                avgCapacity,
                highCapacityHubs,
            },
        });
    } catch (error) {
        console.error('Get admin hubs error:', error);
        return errorResponse('Failed to fetch hubs', 500);
    }
}

// POST /api/admin/hubs - Create new hub with manager
export async function POST(request: NextRequest) {
    try {
        const admin = getAdminFromRequest(request);
        if (!admin) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const {
            name,
            code,
            city,
            state,
            address,
            contactPhone,
            servicePincodes,
            capacity,
            manager: managerData,
        } = body;

        if (!name || !code || !city || !state) {
            return errorResponse('Name, code, city, and state are required', 400);
        }

        await dbConnect();

        // Check if hub code already exists
        const existingHub = await Hub.findOne({ code: code.toUpperCase() });
        if (existingHub) {
            return errorResponse('Hub code already exists', 400);
        }

        // Create hub
        const hub = await Hub.create({
            name,
            code: code.toUpperCase(),
            city,
            state,
            address,
            contactPhone,
            servicePincodes: servicePincodes || [],
            capacity: capacity || 500,
            isActive: true,
        });

        // Create manager if provided
        let manager = null;
        if (managerData && managerData.email && managerData.password) {
            // Check email uniqueness
            const emailExists = await HubManager.findOne({ email: managerData.email.toLowerCase() });
            if (emailExists) {
                return errorResponse('Manager email already in use', 400);
            }

            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(managerData.password, salt);

            manager = await HubManager.create({
                hubId: hub._id,
                name: managerData.name || 'Hub Manager',
                email: managerData.email.toLowerCase(),
                phone: managerData.phone,
                passwordHash,
                isActive: true,
            });
        }

        return successResponse({
            hub,
            manager: manager ? {
                id: manager._id,
                name: manager.name,
                email: manager.email,
            } : null,
        }, 'Hub created successfully');
    } catch (error) {
        console.error('Create hub error:', error);
        return errorResponse('Failed to create hub', 500);
    }
}

