import mongoose, { Schema, Document, Model } from 'mongoose';

export type OrderStatus = 'pending' | 'confirmed' | 'dispatched' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'completed';

export interface IBuyerOrder extends Document {
    _id: mongoose.Types.ObjectId;
    buyerId: mongoose.Types.ObjectId;
    orderNumber: string;
    hubId: mongoose.Types.ObjectId;
    quantityTonnes: number;
    pricePerTonne: number;
    totalAmount: number;
    status: OrderStatus;
    requestedDate: Date;
    dispatchedDate?: Date;
    deliveredDate?: Date;
    paymentStatus: PaymentStatus;
    paidAmount: number;
    invoiceNumber?: string;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const BuyerOrderSchema = new Schema<IBuyerOrder>(
    {
        buyerId: {
            type: Schema.Types.ObjectId,
            ref: 'Buyer',
            required: true,
            index: true,
        },
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },
        hubId: {
            type: Schema.Types.ObjectId,
            ref: 'Hub',
            required: true,
        },
        quantityTonnes: {
            type: Number,
            required: true,
        },
        pricePerTonne: {
            type: Number,
            required: true,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'dispatched', 'delivered', 'cancelled'],
            default: 'pending',
        },
        requestedDate: {
            type: Date,
            required: true,
        },
        dispatchedDate: {
            type: Date,
        },
        deliveredDate: {
            type: Date,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'partial', 'completed'],
            default: 'pending',
        },
        paidAmount: {
            type: Number,
            default: 0,
        },
        invoiceNumber: {
            type: String,
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-generate order number
BuyerOrderSchema.pre('save', async function (next) {
    if (!this.orderNumber) {
        const year = new Date().getFullYear();
        const count = await mongoose.models.BuyerOrder.countDocuments() + 1;
        this.orderNumber = `ORD-${year}-${String(count).padStart(4, '0')}`;
    }
    next();
});

BuyerOrderSchema.index({ buyerId: 1, status: 1 });
BuyerOrderSchema.index({ hubId: 1 });
BuyerOrderSchema.index({ orderNumber: 1 });

const BuyerOrder: Model<IBuyerOrder> =
    mongoose.models.BuyerOrder || mongoose.model<IBuyerOrder>('BuyerOrder', BuyerOrderSchema);

export default BuyerOrder;
