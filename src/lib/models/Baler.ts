import mongoose, { Schema, Document, Model } from 'mongoose';

export type VehicleType = 'baler' | 'truck';
export type VehicleStatus = 'available' | 'busy' | 'maintenance';
export type OwnerType = 'platform' | 'third_party';

export interface IBaler extends Document {
    _id: mongoose.Types.ObjectId;
    vehicleType: VehicleType;
    vehicleNumber: string;
    balerModel?: string;
    operatorName: string;
    operatorPhone: string;
    ownerType: OwnerType;
    ownerName?: string;
    hubId: mongoose.Types.ObjectId;
    status: VehicleStatus;
    // Baler specific
    timePerTonne?: number; // minutes per tonne for estimation
    // Truck specific
    capacity?: number; // tonnes capacity
    nextServiceDate?: Date;
    totalTrips: number;
    totalBales: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BalerSchema = new Schema<IBaler>(
    {
        vehicleType: {
            type: String,
            enum: ['baler', 'truck'],
            default: 'baler',
        },
        vehicleNumber: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        balerModel: {
            type: String,
            trim: true,
        },
        operatorName: {
            type: String,
            required: true,
            trim: true,
        },
        operatorPhone: {
            type: String,
            required: true,
            trim: true,
        },
        ownerType: {
            type: String,
            enum: ['platform', 'third_party'],
            default: 'platform',
        },
        ownerName: {
            type: String,
            trim: true,
        },
        hubId: {
            type: Schema.Types.ObjectId,
            ref: 'Hub',
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['available', 'busy', 'maintenance'],
            default: 'available',
        },
        timePerTonne: {
            type: Number,
            default: 30, // 30 minutes per tonne default for balers
        },
        capacity: {
            type: Number,
            default: 5, // 5 tonnes default for trucks
        },
        nextServiceDate: {
            type: Date,
        },
        totalTrips: {
            type: Number,
            default: 0,
        },
        totalBales: {
            type: Number,
            default: 0,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

BalerSchema.index({ hubId: 1, status: 1 });
BalerSchema.index({ hubId: 1, vehicleType: 1 });

const Baler: Model<IBaler> =
    mongoose.models.Baler || mongoose.model<IBaler>('Baler', BalerSchema);

export default Baler;
