import mongoose, { Schema, Document, Model } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IBuyer extends Document {
    _id: mongoose.Types.ObjectId;
    companyName: string;
    companyCode: string;
    contactPerson: string;
    email: string;
    phone: string;
    passwordHash: string;
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
    agreementAccepted: boolean;
    agreementAcceptedAt?: Date;
    isActive: boolean;
    lastLogin?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
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
            unique: true,
            lowercase: true,
            trim: true,
        },
        phone: {
            type: String,
            required: true,
            trim: true,
        },
        passwordHash: {
            type: String,
            required: true,
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
        agreementAccepted: {
            type: Boolean,
            default: false,
        },
        agreementAcceptedAt: {
            type: Date,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        lastLogin: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Hash password before saving
BuyerSchema.pre('save', async function () {
    if (!this.isModified('passwordHash')) {
        return;
    }
    const salt = await bcrypt.genSalt(10);
    this.passwordHash = await bcrypt.hash(this.passwordHash, salt);
});

// Compare password method
BuyerSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.passwordHash);
};

BuyerSchema.index({ companyCode: 1 });
BuyerSchema.index({ email: 1 });
BuyerSchema.index({ isActive: 1 });

const Buyer: Model<IBuyer> =
    mongoose.models.Buyer || mongoose.model<IBuyer>('Buyer', BuyerSchema);

export default Buyer;
