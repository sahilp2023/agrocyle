import mongoose, { Schema, Document, Model } from 'mongoose';

export type CropType = 'paddy' | 'wheat' | 'sugarcane' | 'maize' | 'cotton' | 'other';

export interface IFarm extends Document {
    _id: mongoose.Types.ObjectId;
    farmerId: mongoose.Types.ObjectId;
    name: string;
    cropType: CropType;
    areaInAcres: number;
    location: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
        address?: string;
        village?: string;
        district?: string;
        state?: string;
    };
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const FarmSchema = new Schema<IFarm>(
    {
        farmerId: {
            type: Schema.Types.ObjectId,
            ref: 'Farmer',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            default: 'मेरा खेत', // My Farm in Hindi
        },
        cropType: {
            type: String,
            enum: ['paddy', 'wheat', 'sugarcane', 'maize', 'cotton', 'other'],
            required: true,
        },
        areaInAcres: {
            type: Number,
            required: true,
            min: 0.1,
            max: 1000,
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                required: true,
            },
            address: String,
            village: String,
            district: String,
            state: String,
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

// Index for geospatial queries
FarmSchema.index({ 'location.coordinates': '2dsphere' });

// Compound index for farmer's farms
FarmSchema.index({ farmerId: 1, isActive: 1 });

const Farm: Model<IFarm> =
    mongoose.models.Farm || mongoose.model<IFarm>('Farm', FarmSchema);

export default Farm;
