import mongoose, { Schema, Document, Model } from 'mongoose';

export type PayoutStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface IPayoutBreakdown {
    baseAmount: number;
    subsidy: number;
    balingCost: number;
    logisticsDeduction: number;
    netPayable: number;
}

export interface IPayout extends Document {
    _id: mongoose.Types.ObjectId;
    farmerId: mongoose.Types.ObjectId;
    hubId: mongoose.Types.ObjectId;
    bookingIds: mongoose.Types.ObjectId[];
    totalQuantityTonnes: number;
    pricePerTonne: number;
    breakdown: IPayoutBreakdown;
    status: PayoutStatus;
    transactionId?: string;
    processedAt?: Date;
    processedBy?: mongoose.Types.ObjectId;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const PayoutSchema = new Schema<IPayout>(
    {
        farmerId: {
            type: Schema.Types.ObjectId,
            ref: 'Farmer',
            required: true,
            index: true,
        },
        hubId: {
            type: Schema.Types.ObjectId,
            ref: 'Hub',
            required: true,
            index: true,
        },
        bookingIds: [{
            type: Schema.Types.ObjectId,
            ref: 'Booking',
        }],
        totalQuantityTonnes: {
            type: Number,
            required: true,
            min: 0,
        },
        pricePerTonne: {
            type: Number,
            required: true,
            min: 0,
        },
        breakdown: {
            baseAmount: { type: Number, required: true },
            subsidy: { type: Number, default: 0 },
            balingCost: { type: Number, default: 0 },
            logisticsDeduction: { type: Number, default: 0 },
            netPayable: { type: Number, required: true },
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
        },
        transactionId: {
            type: String,
            trim: true,
        },
        processedAt: {
            type: Date,
        },
        processedBy: {
            type: Schema.Types.ObjectId,
            ref: 'HubManager',
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

PayoutSchema.index({ hubId: 1, status: 1 });
PayoutSchema.index({ farmerId: 1, createdAt: -1 });

const Payout: Model<IPayout> =
    mongoose.models.Payout || mongoose.model<IPayout>('Payout', PayoutSchema);

export default Payout;
