import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBuyer extends Document {
    _id: mongoose.Types.ObjectId;
    companyName: string;
    companyCode: string;
    contactPerson: string;
    email: string;
    phone: string;
    gstNumber?: string;
    panNumber?: string;
    plantAddress: string;
    plantCity: string;
    plantState: string;
    plantPincode: string;
    assignedHubs: mongoose.Types.ObjectId[];
    agreementStartDate: Date;
    agreementEndDate: Date;
    pricePerTonne: number;
    minimumOrderTonnes: number;
    paymentTermsDays: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BuyerSchema = new Schema<IBuyer>(
    {
        companyName: {
            type: String,
            required: true,
            trim: true,
        },
        companyCode: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true,
        },
        contactPerson: {
            type: String,
            required: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        gstNumber: {
            type: String,
            trim: true,
        },
        panNumber: {
            type: String,
            uppercase: true,
            trim: true,
        },
        plantAddress: {
            type: String,
            required: true,
        },
        plantCity: {
            type: String,
            required: true,
            trim: true,
        },
        plantState: {
            type: String,
            required: true,
            trim: true,
        },
        plantPincode: {
            type: String,
            required: true,
            trim: true,
        },
        assignedHubs: [{
            type: Schema.Types.ObjectId,
            ref: 'Hub',
        }],
        agreementStartDate: {
            type: Date,
            required: true,
        },
        agreementEndDate: {
            type: Date,
            required: true,
        },
        pricePerTonne: {
            type: Number,
            required: true,
        },
        minimumOrderTonnes: {
            type: Number,
            default: 10,
        },
        paymentTermsDays: {
            type: Number,
            default: 30,
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

BuyerSchema.index({ companyCode: 1 });
BuyerSchema.index({ isActive: 1 });

const Buyer: Model<IBuyer> =
    mongoose.models.Buyer || mongoose.model<IBuyer>('Buyer', BuyerSchema);

export default Buyer;
