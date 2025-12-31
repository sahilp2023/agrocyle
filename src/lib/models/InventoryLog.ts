import mongoose, { Schema, Document, Model } from 'mongoose';

export type InventoryType = 'inbound' | 'outbound';

export interface IInventoryLog extends Document {
    _id: mongoose.Types.ObjectId;
    hubId: mongoose.Types.ObjectId;
    type: InventoryType;
    quantityTonnes: number;
    date: Date;
    // For inbound
    farmerId?: mongoose.Types.ObjectId;
    bookingId?: mongoose.Types.ObjectId;
    storageLocation?: string;
    // For outbound
    buyerName?: string;
    buyerContact?: string;
    salePrice?: number;
    // Common
    notes?: string;
    createdBy?: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const InventoryLogSchema = new Schema<IInventoryLog>(
    {
        hubId: {
            type: Schema.Types.ObjectId,
            ref: 'Hub',
            required: true,
            index: true,
        },
        type: {
            type: String,
            enum: ['inbound', 'outbound'],
            required: true,
        },
        quantityTonnes: {
            type: Number,
            required: true,
            min: 0,
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        },
        // Inbound fields
        farmerId: {
            type: Schema.Types.ObjectId,
            ref: 'Farmer',
        },
        bookingId: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
        },
        storageLocation: {
            type: String,
            trim: true,
        },
        // Outbound fields
        buyerName: {
            type: String,
            trim: true,
        },
        buyerContact: {
            type: String,
            trim: true,
        },
        salePrice: {
            type: Number,
            min: 0,
        },
        // Common
        notes: {
            type: String,
            trim: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: 'HubManager',
        },
    },
    {
        timestamps: true,
    }
);

InventoryLogSchema.index({ hubId: 1, type: 1, date: -1 });

const InventoryLog: Model<IInventoryLog> =
    mongoose.models.InventoryLog || mongoose.model<IInventoryLog>('InventoryLog', InventoryLogSchema);

export default InventoryLog;
