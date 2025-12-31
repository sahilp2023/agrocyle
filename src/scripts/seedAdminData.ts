// Seed script for Admin Portal
// Run with: npx ts-node --compiler-options '{"module":"CommonJS","esModuleInterop":true}' src/scripts/seedAdminData.ts

import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error('MONGODB_URI not found in .env.local');
    process.exit(1);
}

// Admin data
const admins = [
    {
        email: 'admin@agrocycle.in',
        password: 'Admin@123',
        name: 'Super Admin',
        role: 'super_admin',
    },
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI as string);
        console.log('Connected to MongoDB');

        // Get or create Admin model
        const Admin = mongoose.models.Admin || mongoose.model('Admin', new mongoose.Schema({
            email: { type: String, unique: true },
            passwordHash: String,
            name: String,
            role: String,
            isActive: Boolean,
            lastLogin: Date,
        }, { timestamps: true }));

        // Seed Admins
        console.log('\nSeeding Admins...');

        for (const admin of admins) {
            const salt = await bcrypt.genSalt(10);
            const passwordHash = await bcrypt.hash(admin.password, salt);

            // Delete existing and recreate
            await Admin.deleteOne({ email: admin.email });

            await Admin.create({
                email: admin.email,
                passwordHash,
                name: admin.name,
                role: admin.role,
                isActive: true,
            });
            console.log(`  Created Admin: ${admin.email} (Password: ${admin.password})`);
        }

        console.log('\n✅ Admin seed completed successfully!');
        console.log('\nAdmin Credentials:');
        admins.forEach(a => {
            console.log(`  ${a.email} / ${a.password}`);
        });

    } catch (error) {
        console.error('Seed error:', error);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
