import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IBuyerQualitySettings extends Document {
    _id: mongoose.Types.ObjectId;
    buyerId: mongoose.Types.ObjectId;
    maxMoisturePercent: number;
    acceptedBaleTypes: ('medium' | 'large')[];
    rejectionReasons: string[];
    createdAt: Date;
    updatedAt: Date;
}

const BuyerQualitySettingsSchema = new Schema<IBuyerQualitySettings>(
    {
        buyerId: {
            type: Schema.Types.ObjectId,
            ref: 'Buyer',
            required: true,
            unique: true,
            index: true,
        },
        maxMoisturePercent: {
            type: Number,
            required: true,
            default: 15,
            min: 0,
            max: 100,
        },
        acceptedBaleTypes: [{
            type: String,
            enum: ['medium', 'large'],
        }],
        rejectionReasons: [{
            type: String,
            trim: true,
        }],
    },
    {
        timestamps: true,
    }
);

// Default rejection reasons
BuyerQualitySettingsSchema.pre('save', function () {
    if (this.isNew && (!this.rejectionReasons || this.rejectionReasons.length === 0)) {
        this.rejectionReasons = ['High moisture', 'Contamination', 'Under-weight'];
    }
    if (this.isNew && (!this.acceptedBaleTypes || this.acceptedBaleTypes.length === 0)) {
        this.acceptedBaleTypes = ['medium', 'large'];
    }
});

const BuyerQualitySettings: Model<IBuyerQualitySettings> =
    mongoose.models.BuyerQualitySettings || mongoose.model<IBuyerQualitySettings>('BuyerQualitySettings', BuyerQualitySettingsSchema);

export default BuyerQualitySettings;
