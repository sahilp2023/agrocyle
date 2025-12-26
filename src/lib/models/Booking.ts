import mongoose, { Schema, Document, Model } from 'mongoose';

export type BookingStatus =
    | 'pending'      // Booking created, waiting for confirmation
    | 'confirmed'    // Booking confirmed by system
    | 'scheduled'    // Pickup date assigned
    | 'in_progress'  // Pickup team on the way / collecting
    | 'completed'    // Pickup done, weighing complete
    | 'cancelled';   // Booking cancelled

export interface IBooking extends Document {
    _id: mongoose.Types.ObjectId;
    farmerId: mongoose.Types.ObjectId;
    farmId: mongoose.Types.ObjectId;
    harvestEndDate: Date;
    scheduledPickupDate?: Date;
    actualPickupDate?: Date;
    status: BookingStatus;
    // Estimates (shown to farmer before pickup)
    estimatedStubbleTonnes: number;
    estimatedPrice: number;
    // Actuals (after weighing)
    actualStubbleTonnes?: number;
    finalPrice?: number;
    // Notes
    farmerNotes?: string;
    adminNotes?: string;
    cancellationReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const BookingSchema = new Schema<IBooking>(
    {
        farmerId: {
            type: Schema.Types.ObjectId,
            ref: 'Farmer',
            required: true,
            index: true,
        },
        farmId: {
            type: Schema.Types.ObjectId,
            ref: 'Farm',
            required: true,
            index: true,
        },
        harvestEndDate: {
            type: Date,
            required: true,
        },
        scheduledPickupDate: {
            type: Date,
        },
        actualPickupDate: {
            type: Date,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'scheduled', 'in_progress', 'completed', 'cancelled'],
            default: 'pending',
            index: true,
        },
        estimatedStubbleTonnes: {
            type: Number,
            required: true,
            min: 0,
        },
        estimatedPrice: {
            type: Number,
            required: true,
            min: 0,
        },
        actualStubbleTonnes: {
            type: Number,
            min: 0,
        },
        finalPrice: {
            type: Number,
            min: 0,
        },
        farmerNotes: {
            type: String,
            maxlength: 500,
        },
        adminNotes: {
            type: String,
            maxlength: 1000,
        },
        cancellationReason: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes for common queries
BookingSchema.index({ farmerId: 1, status: 1 });
BookingSchema.index({ status: 1, scheduledPickupDate: 1 });
BookingSchema.index({ createdAt: -1 });

const Booking: Model<IBooking> =
    mongoose.models.Booking || mongoose.model<IBooking>('Booking', BookingSchema);

export default Booking;
