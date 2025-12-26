import mongoose, { Schema, Document, Model } from 'mongoose';

export type PaymentStatus =
    | 'pending'     // Payment not yet initiated
    | 'processing'  // Payment being processed
    | 'completed'   // Payment successful
    | 'failed';     // Payment failed

export interface IPayment extends Document {
    _id: mongoose.Types.ObjectId;
    bookingId: mongoose.Types.ObjectId;
    farmerId: mongoose.Types.ObjectId;
    amount: number;
    status: PaymentStatus;
    paymentMethod: 'upi' | 'bank_transfer' | 'cash';
    transactionId?: string;
    upiRef?: string;
    bankRefNumber?: string;
    paidAt?: Date;
    failureReason?: string;
    receipt?: string; // URL or ID for receipt
    createdAt: Date;
    updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
    {
        bookingId: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
            index: true,
        },
        farmerId: {
            type: Schema.Types.ObjectId,
            ref: 'Farmer',
            required: true,
            index: true,
        },
        amount: {
            type: Number,
            required: true,
            min: 0,
        },
        status: {
            type: String,
            enum: ['pending', 'processing', 'completed', 'failed'],
            default: 'pending',
            index: true,
        },
        paymentMethod: {
            type: String,
            enum: ['upi', 'bank_transfer', 'cash'],
            default: 'upi',
        },
        transactionId: {
            type: String,
            sparse: true,
        },
        upiRef: {
            type: String,
        },
        bankRefNumber: {
            type: String,
        },
        paidAt: {
            type: Date,
        },
        failureReason: {
            type: String,
        },
        receipt: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Compound indexes
PaymentSchema.index({ farmerId: 1, status: 1 });
PaymentSchema.index({ createdAt: -1 });

const Payment: Model<IPayment> =
    mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);

export default Payment;
