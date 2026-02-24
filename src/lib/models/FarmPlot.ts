import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IFarmPlot extends Document {
    farmerId: mongoose.Types.ObjectId;
    plotName: string;
    geometry?: {
        type: 'Polygon';
        coordinates: number[][][]; // GeoJSON Polygon coordinates
    } | null;
    areaM2: number;
    areaAcre: number;
    areaHa: number;
    isManualEntry?: boolean; // true if area was entered manually
    createdAt: Date;
    updatedAt: Date;
}

const FarmPlotSchema = new Schema<IFarmPlot>(
    {
        farmerId: {
            type: Schema.Types.ObjectId,
            ref: 'Farmer',
            required: true,
            index: true,
        },
        plotName: {
            type: String,
            required: true,
            trim: true,
        },
        geometry: {
            type: {
                type: String,
                enum: ['Polygon'],
            },
            coordinates: {
                type: [[[Number]]], // Array of arrays of arrays of numbers
                validate: {
                    validator: function (this: any, coords: number[][][]) {
                        // Skip validation if geometry is not provided (manual entry)
                        if (!coords || coords.length === 0) return true;
                        // Basic GeoJSON Polygon validation
                        // 1. Must be an array of linear rings
                        if (!Array.isArray(coords)) return false;
                        // 2. First ring (exterior) must have at least 4 points (3 points + closure)
                        const exteriorRing = coords[0];
                        if (!Array.isArray(exteriorRing) || exteriorRing.length < 4) return false;
                        // 3. First and last point must be same (closed ring)
                        const first = exteriorRing[0];
                        const last = exteriorRing[exteriorRing.length - 1];
                        return (
                            first[0] === last[0] &&
                            first[1] === last[1]
                        );
                    },
                    message: 'Invalid Polygon coordinates. Must be a closed ring with at least 4 points.',
                },
            },
        },
        isManualEntry: {
            type: Boolean,
            default: false,
        },
        areaM2: {
            type: Number,
            default: 0,
        },
        areaAcre: {
            type: Number,
            required: true,
        },
        areaHa: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true,
    }
);

// Index for geospatial queries
FarmPlotSchema.index({ geometry: '2dsphere' });

// Compound index for unique plot names per farmer (optional but good for UX)
FarmPlotSchema.index({ farmerId: 1, plotName: 1 }, { unique: true });

const FarmPlot: Model<IFarmPlot> =
    mongoose.models.FarmPlot || mongoose.model<IFarmPlot>('FarmPlot', FarmPlotSchema);

export default FarmPlot;
