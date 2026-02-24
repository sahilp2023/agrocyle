import mongoose, { Schema, Document, Model } from 'mongoose';

export type OperatorType = 'baler' | 'truck' | 'both';

export interface IOperator extends Document {
    _id: mongoose.Types.ObjectId;
    phone: string;
    name: string;
    profilePhoto?: string;
    operatorType: OperatorType;
    vehicleNumber: string;
    vehicleModel?: string;
    licenseNumber?: string;
    upiId?: string;
    bankDetails?: {
        accountNumber: string;
        ifsc: string;
        accountHolderName: string;
        bankName?: string;
    };
    hubId?: mongoose.Types.ObjectId;
    isVerified: boolean;
    isActive: boolean;
    isOnline: boolean;
    currentLocation?: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
    };
    totalJobs: number;
    totalEarnings: number;
    rating?: number;
    otp?: string;
    otpExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const OperatorSchema = new Schema<IOperator>(
    {
        phone: {
            type: String,
            required: true,
            unique: true,
            index: true,
            validate: {
                validator: (v: string) => /^[6-9]\d{9}$/.test(v),
                message: 'Invalid Indian phone number',
            },
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        profilePhoto: {
            type: String,
        },
        operatorType: {
            type: String,
            enum: ['baler', 'truck', 'both'],
            required: true,
        },
        vehicleNumber: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
        },
        vehicleModel: {
            type: String,
            trim: true,
        },
        licenseNumber: {
            type: String,
            trim: true,
        },
        upiId: {
            type: String,
            trim: true,
        },
        bankDetails: {
            accountNumber: { type: String },
            ifsc: { type: String },
            accountHolderName: { type: String },
            bankName: { type: String },
        },
        hubId: {
            type: Schema.Types.ObjectId,
            ref: 'Hub',
            index: true,
        },
        isVerified: {
            type: Boolean,
            default: false,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        isOnline: {
            type: Boolean,
            default: false,
        },
        currentLocation: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                default: [0, 0],
            },
        },
        totalJobs: {
            type: Number,
            default: 0,
        },
        totalEarnings: {
            type: Number,
            default: 0,
        },
        rating: {
            type: Number,
            min: 0,
            max: 5,
        },
        otp: {
            type: String,
        },
        otpExpiry: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
OperatorSchema.index({ 'currentLocation.coordinates': '2dsphere' });
OperatorSchema.index({ hubId: 1, isActive: 1 });
OperatorSchema.index({ operatorType: 1, isOnline: 1 });

const Operator: Model<IOperator> =
    mongoose.models.Operator || mongoose.model<IOperator>('Operator', OperatorSchema);

export default Operator;
