import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IHub extends Document {
    _id: mongoose.Types.ObjectId;
    name: string;
    code: string;
    city: string;
    state: string;
    servicePincodes: string[];
    address?: string;
    contactPhone?: string;
    capacity: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const HubSchema = new Schema<IHub>(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        code: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        city: {
            type: String,
            required: true,
            trim: true,
        },
        state: {
            type: String,
            required: true,
            trim: true,
        },
        servicePincodes: {
            type: [String],
            default: [],
            index: true,
        },
        address: {
            type: String,
        },
        contactPhone: {
            type: String,
        },
        capacity: {
            type: Number,
            default: 500,
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

// Index for quick pincode lookup
HubSchema.index({ servicePincodes: 1, isActive: 1 });

const Hub: Model<IHub> =
    mongoose.models.Hub || mongoose.model<IHub>('Hub', HubSchema);

export default Hub;
