import mongoose, { Schema, Document, Model } from 'mongoose';

export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'cancelled';

export interface IAssignment extends Document {
    _id: mongoose.Types.ObjectId;
    bookingId: mongoose.Types.ObjectId;
    balerId: mongoose.Types.ObjectId;
    truckId?: mongoose.Types.ObjectId;
    hubId: mongoose.Types.ObjectId;
    status: AssignmentStatus;
    assignedAt: Date;
    startedAt?: Date;
    completedAt?: Date;
    actualQuantityTonnes?: number;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
    {
        bookingId: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
            index: true,
        },
        balerId: {
            type: Schema.Types.ObjectId,
            ref: 'Baler',
            required: true,
            index: true,
        },
        truckId: {
            type: Schema.Types.ObjectId,
            ref: 'Baler', // Trucks are stored in Baler collection with vehicleType='truck'
            index: true,
        },
        hubId: {
            type: Schema.Types.ObjectId,
            ref: 'Hub',
            required: true,
            index: true,
        },
        status: {
            type: String,
            enum: ['assigned', 'in_progress', 'completed', 'cancelled'],
            default: 'assigned',
        },
        assignedAt: {
            type: Date,
            default: Date.now,
        },
        startedAt: {
            type: Date,
        },
        completedAt: {
            type: Date,
        },
        actualQuantityTonnes: {
            type: Number,
            min: 0,
        },
        notes: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

AssignmentSchema.index({ hubId: 1, status: 1 });
AssignmentSchema.index({ bookingId: 1 }, { unique: true });

const Assignment: Model<IAssignment> =
    mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);

export default Assignment;
