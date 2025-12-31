import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFarmer extends Document {
    _id: mongoose.Types.ObjectId;
    phone: string;
    name: string;
    aadhaarNumber?: string;
    kycVerified: boolean;
    language: 'hi' | 'en';
    upiId?: string;
    profilePhoto?: string;
    // Location fields
    pincode?: string;
    village?: string;
    city?: string;
    state?: string;
    location?: {
        type: 'Point';
        coordinates: [number, number]; // [longitude, latitude]
        address?: string;
    };
    otp?: string;
    otpExpiry?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const FarmerSchema = new Schema<IFarmer>(
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
            default: '',
        },
        aadhaarNumber: {
            type: String,
            validate: {
                validator: (v: string) => !v || /^\d{12}$/.test(v),
                message: 'Aadhaar must be 12 digits',
            },
        },
        kycVerified: {
            type: Boolean,
            default: false,
        },
        language: {
            type: String,
            enum: ['hi', 'en'],
            default: 'hi',
        },
        upiId: {
            type: String,
        },
        profilePhoto: {
            type: String,
        },
        pincode: {
            type: String,
            validate: {
                validator: (v: string) => !v || /^\d{6}$/.test(v),
                message: 'Pincode must be 6 digits',
            },
        },
        village: {
            type: String,
            trim: true,
        },
        city: {
            type: String,
            trim: true,
        },
        state: {
            type: String,
            trim: true,
        },
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point',
            },
            coordinates: {
                type: [Number],
                default: [0, 0],
            },
            address: String,
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

// Index for geospatial queries
FarmerSchema.index({ 'location.coordinates': '2dsphere' });

const Farmer: Model<IFarmer> =
    mongoose.models.Farmer || mongoose.model<IFarmer>('Farmer', FarmerSchema);

export default Farmer;
