import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ICropPrice extends Document {
    cropType: string;
    pricePerTonne: number;
    updatedBy?: mongoose.Types.ObjectId;
    updatedAt: Date;
}

const CropPriceSchema = new Schema<ICropPrice>(
    {
        cropType: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        pricePerTonne: {
            type: Number,
            required: true,
            min: 0,
        },
        updatedBy: {
            type: Schema.Types.ObjectId,
            ref: 'Admin', // Assuming we might have an Admin model later
        },
    },
    {
        timestamps: true,
    }
);

const CropPrice: Model<ICropPrice> =
    mongoose.models.CropPrice || mongoose.model<ICropPrice>('CropPrice', CropPriceSchema);

export default CropPrice;
