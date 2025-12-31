import mongoose, { Schema, Document, Model } from 'mongoose';

export type StaffRole = 'quality_inspector' | 'operator' | 'driver' | 'supervisor';

export interface IHubStaff extends Document {
    _id: mongoose.Types.ObjectId;
    hubId: mongoose.Types.ObjectId;
    name: string;
    phone: string;
    role: StaffRole;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const HubStaffSchema = new Schema<IHubStaff>(
    {
        hubId: {
            type: Schema.Types.ObjectId,
            ref: 'Hub',
            required: true,
            index: true,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        role: {
            type: String,
            enum: ['quality_inspector', 'operator', 'driver', 'supervisor'],
            required: true,
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

// Index for hub lookup
HubStaffSchema.index({ hubId: 1, isActive: 1 });

const HubStaff: Model<IHubStaff> =
    mongoose.models.HubStaff || mongoose.model<IHubStaff>('HubStaff', HubStaffSchema);

export default HubStaff;
