import mongoose, { Schema, Document, Model } from 'mongoose';

export type TruckStatus = 'available' | 'busy' | 'maintenance';

export interface ITruck extends Document {
    _id: mongoose.Types.ObjectId;
    vehicleNumber: string;
    driverName: string;
    driverPhone: string;
    capacityTonnes: number;
    hubId: mongoose.Types.ObjectId;
    status: TruckStatus;
    totalTrips: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const TruckSchema = new Schema<ITruck>(
    {
        vehicleNumber: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        driverName: {
            type: String,
            required: true,
            trim: true,
        },
        driverPhone: {
            type: String,
            required: true,
            trim: true,
        },
        capacityTonnes: {
            type: Number,
            required: true,
            min: 1,
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
        totalTrips: {
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

TruckSchema.index({ hubId: 1, status: 1 });

const Truck: Model<ITruck> =
    mongoose.models.Truck || mongoose.model<ITruck>('Truck', TruckSchema);

export default Truck;
