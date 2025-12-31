import mongoose, { Schema, Document, Model } from 'mongoose';

export type ContractType = 'agreement' | 'amendment' | 'nda' | 'invoice' | 'other';

export interface IBuyerContract extends Document {
    _id: mongoose.Types.ObjectId;
    buyerId: mongoose.Types.ObjectId;
    title: string;
    type: ContractType;
    fileUrl: string;
    uploadedAt: Date;
    validFrom: Date;
    validUntil?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

const BuyerContractSchema = new Schema<IBuyerContract>(
    {
        buyerId: {
            type: Schema.Types.ObjectId,
            ref: 'Buyer',
            required: true,
            index: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['agreement', 'amendment', 'nda', 'invoice', 'other'],
            required: true,
        },
        fileUrl: {
            type: String,
            required: true,
        },
        uploadedAt: {
            type: Date,
            default: Date.now,
        },
        validFrom: {
            type: Date,
            required: true,
        },
        validUntil: {
            type: Date,
        },
        notes: {
            type: String,
        },
    },
    {
        timestamps: true,
    }
);

BuyerContractSchema.index({ buyerId: 1, type: 1 });

const BuyerContract: Model<IBuyerContract> =
    mongoose.models.BuyerContract || mongoose.model<IBuyerContract>('BuyerContract', BuyerContractSchema);

export default BuyerContract;
