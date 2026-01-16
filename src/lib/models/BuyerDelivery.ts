import mongoose, { Schema, Document, Model } from 'mongoose';

export type DeliveryStatus = 'in_transit' | 'delivered' | 'accepted' | 'rejected';

export interface IBuyerDelivery extends Document {
    _id: mongoose.Types.ObjectId;
    orderId: mongoose.Types.ObjectId;
    buyerId: mongoose.Types.ObjectId;
    hubId: mongoose.Types.ObjectId;
    deliveryNumber: string;
    deliveryDate: Date;
    vehicleNumber: string;
    driverName?: string;
    driverPhone?: string;
    quantityTonnes: number;
    status: DeliveryStatus;
    acceptedAt?: Date;
    rejectedAt?: Date;
    rejectionReason?: string;
    moistureLevel?: number;
    baleType?: 'medium' | 'large';
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const BuyerDeliverySchema = new Schema<IBuyerDelivery>(
    {
        orderId: {
            type: Schema.Types.ObjectId,
            ref: 'BuyerOrder',
            required: true,
            index: true,
        },
        buyerId: {
            type: Schema.Types.ObjectId,
            ref: 'Buyer',
            required: true,
            index: true,
        },
        hubId: {
            type: Schema.Types.ObjectId,
            ref: 'Hub',
            required: true,
        },
        deliveryNumber: {
            type: String,
            required: true,
            unique: true,
        },
        deliveryDate: {
            type: Date,
            required: true,
        },
        vehicleNumber: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        driverName: {
            type: String,
            trim: true,
        },
        driverPhone: {
            type: String,
            trim: true,
        },
        quantityTonnes: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['in_transit', 'delivered', 'accepted', 'rejected'],
            default: 'in_transit',
        },
        acceptedAt: {
            type: Date,
        },
        rejectedAt: {
            type: Date,
        },
        rejectionReason: {
            type: String,
            enum: ['high_moisture', 'contamination', 'under_weight', 'other'],
        },
        moistureLevel: {
            type: Number,
        },
        baleType: {
            type: String,
            enum: ['medium', 'large'],
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

// Auto-generate delivery number
BuyerDeliverySchema.pre('save', async function (next) {
    if (!this.deliveryNumber) {
        const year = new Date().getFullYear();
        const count = await mongoose.models.BuyerDelivery.countDocuments() + 1;
        this.deliveryNumber = `DEL-${year}-${String(count).padStart(5, '0')}`;
    }
    next();
});

BuyerDeliverySchema.index({ orderId: 1, status: 1 });
BuyerDeliverySchema.index({ buyerId: 1, status: 1 });
BuyerDeliverySchema.index({ deliveryNumber: 1 });

const BuyerDelivery: Model<IBuyerDelivery> =
    mongoose.models.BuyerDelivery || mongoose.model<IBuyerDelivery>('BuyerDelivery', BuyerDeliverySchema);

export default BuyerDelivery;
