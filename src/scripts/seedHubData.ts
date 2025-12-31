// Seed script for Hub Manager Portal
// Run with: npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' src/scripts/seedHubData.ts

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
}

// Hub data
const hubs = [
    {
        name: 'Mohali Hub',
        code: 'MOH001',
        city: 'Mohali',
        state: 'Punjab',
        servicePincodes: ['140301', '140302', '140306', '140307', '140308', '140413'],
        address: 'Plot 45, Phase 8B, Industrial Area, Mohali',
        contactPhone: '9876500001',
        isActive: true,
    },
    {
        name: 'Sangrur Hub',
        code: 'SAN001',
        city: 'Sangrur',
        state: 'Punjab',
        servicePincodes: ['148001', '148002', '148017', '148018', '148021', '148024'],
        address: 'Patiala Road, Near Grain Market, Sangrur',
        contactPhone: '9876500002',
        isActive: true,
    },
    {
        name: 'Ludhiana Hub',
        code: 'LDH001',
        city: 'Ludhiana',
        state: 'Punjab',
        servicePincodes: ['141001', '141002', '141003', '141004', '141006', '141008'],
        address: 'Focal Point, Phase 5, Ludhiana',
        contactPhone: '9876500003',
        isActive: true,
    },
];

// Hub Manager data (password will be hashed)
const managers = [
    { email: 'mohali@agrocycle.in', password: 'Mohali@123', name: 'Gurpreet Singh', hubCode: 'MOH001' },
    { email: 'sangrur@agrocycle.in', password: 'Sangrur@123', name: 'Harjinder Kaur', hubCode: 'SAN001' },
    { email: 'ludhiana@agrocycle.in', password: 'Ludhiana@123', name: 'Rajveer Sidhu', hubCode: 'LDH001' },
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log('Connected to MongoDB');

        // Get or create Hub model (simple schema for seeding)
        const Hub = mongoose.models.Hub || mongoose.model('Hub', new mongoose.Schema({
            name: String,
            code: { type: String, unique: true },
            city: String,
            state: String,
            servicePincodes: [String],
            address: String,
            contactPhone: String,
            isActive: Boolean,
        }, { timestamps: true }));

        // Get or create HubManager model (simple schema for seeding)
        const HubManager = mongoose.models.HubManager || mongoose.model('HubManager', new mongoose.Schema({
            email: { type: String, unique: true },
            passwordHash: String,
            name: String,
            hubId: mongoose.Schema.Types.ObjectId,
            isActive: Boolean,
        }, { timestamps: true }));

        // Seed Hubs
        console.log('\nSeeding Hubs...');
        const hubDocs: Record<string, mongoose.Types.ObjectId> = {};

        for (const hub of hubs) {
            const existing = await Hub.findOne({ code: hub.code });
            if (existing) {
                console.log(`  Hub ${hub.code} already exists, updating...`);
                await Hub.updateOne({ code: hub.code }, hub);
                hubDocs[hub.code] = existing._id;
            } else {
                const newHub = await Hub.create(hub);
                console.log(`  Created Hub: ${hub.name}`);
                hubDocs[hub.code] = newHub._id;
            }
        }

        // Seed Hub Managers
        console.log('\nSeeding Hub Managers...');

        for (const manager of managers) {
            const hubId = hubDocs[manager.hubCode];

            if (!hubId) {
                console.log(`  Hub ${manager.hubCode} not found, skipping manager ${manager.email}`);
                continue;
            }

            // Always hash the password manually (since we use a simple schema without hooks)
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(manager.password, salt);

            // Delete existing and recreate to ensure clean state
            await HubManager.deleteOne({ email: manager.email });

            await HubManager.create({
                email: manager.email,
                passwordHash, // Already hashed
                name: manager.name,
                hubId,
                isActive: true,
            });
            console.log(`  Created Manager: ${manager.email} (Password: ${manager.password})`);
        }

        console.log('\n✅ Seed completed successfully!');
        console.log('\nHub Manager Credentials:');
        managers.forEach(m => {
            console.log(`  ${m.email} / ${m.password}`);
        });

    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
