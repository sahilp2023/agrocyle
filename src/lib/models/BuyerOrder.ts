import mongoose, { Schema, Document, Model } from 'mongoose';

export type OrderStatus = 'pending' | 'confirmed' | 'processing' | 'dispatched' | 'delivered' | 'cancelled';
export type PaymentStatus = 'pending' | 'partial' | 'completed';

export interface IQualityReport {
    calorificValue?: number;       // MJ/kg
    moistureContent?: number;      // %
    pelletSize?: number;           // mm
    bulkDensity?: number;          // kg/m³
    ashContent?: number;           // %
    silicaInAsh?: number;          // %
    sulfurContent?: number;        // %
    chlorineContent?: number;      // %
    torrefied?: boolean;
}

export interface IShipmentDetails {
    shippingDate?: Date;
    trackingId?: string;
    vehicleNumber?: string;
    driverName?: string;
    driverPhone?: string;
    estimatedDelivery?: Date;
}

export interface IStockAllocation {
    allocatedQtyTonnes?: number;
    allocatedAt?: Date;
}

export interface IBuyerOrder extends Document {
    _id: mongoose.Types.ObjectId;
    buyerId: mongoose.Types.ObjectId;
    orderNumber: string;
    hubId: mongoose.Types.ObjectId;
    quantityTonnes: number;
    pricePerTonne: number;
    totalAmount: number;
    status: OrderStatus;
    requestedDate: Date;
    dispatchedDate?: Date;
    deliveredDate?: Date;
    paymentStatus: PaymentStatus;
    paidAmount: number;
    invoiceNumber?: string;
    notes?: string;
    // Fulfilment fields
    qualityReport?: IQualityReport;
    shipmentDetails?: IShipmentDetails;
    stockAllocated?: IStockAllocation;
    preparedBy?: mongoose.Types.ObjectId;
    // Razorpay fields
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    createdAt: Date;
    updatedAt: Date;
}

const QualityReportSchema = new Schema<IQualityReport>(
    {
        calorificValue: { type: Number },
        moistureContent: { type: Number },
        pelletSize: { type: Number },
        bulkDensity: { type: Number },
        ashContent: { type: Number },
        silicaInAsh: { type: Number },
        sulfurContent: { type: Number },
        chlorineContent: { type: Number },
        torrefied: { type: Boolean, default: false },
    },
    { _id: false }
);

const ShipmentDetailsSchema = new Schema<IShipmentDetails>(
    {
        shippingDate: { type: Date },
        trackingId: { type: String, trim: true },
        vehicleNumber: { type: String, trim: true },
        driverName: { type: String, trim: true },
        driverPhone: { type: String, trim: true },
        estimatedDelivery: { type: Date },
    },
    { _id: false }
);

const StockAllocationSchema = new Schema<IStockAllocation>(
    {
        allocatedQtyTonnes: { type: Number },
        allocatedAt: { type: Date },
    },
    { _id: false }
);

const BuyerOrderSchema = new Schema<IBuyerOrder>(
    {
        buyerId: {
            type: Schema.Types.ObjectId,
            ref: 'Buyer',
            required: true,
            index: true,
        },
        orderNumber: {
            type: String,
            required: true,
            unique: true,
        },
        hubId: {
            type: Schema.Types.ObjectId,
            ref: 'Hub',
            required: true,
        },
        quantityTonnes: {
            type: Number,
            required: true,
        },
        pricePerTonne: {
            type: Number,
            required: true,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'processing', 'dispatched', 'delivered', 'cancelled'],
            default: 'pending',
        },
        requestedDate: {
            type: Date,
            required: true,
        },
        dispatchedDate: {
            type: Date,
        },
        deliveredDate: {
            type: Date,
        },
        paymentStatus: {
            type: String,
            enum: ['pending', 'partial', 'completed'],
            default: 'pending',
        },
        paidAmount: {
            type: Number,
            default: 0,
        },
        invoiceNumber: {
            type: String,
        },
        notes: {
            type: String,
        },
        // Fulfilment
        qualityReport: {
            type: QualityReportSchema,
        },
        shipmentDetails: {
            type: ShipmentDetailsSchema,
        },
        stockAllocated: {
            type: StockAllocationSchema,
        },
        preparedBy: {
            type: Schema.Types.ObjectId,
            ref: 'HubManager',
        },
        // Razorpay fields
        razorpayOrderId: {
            type: String,
            sparse: true,
        },
        razorpayPaymentId: {
            type: String,
            sparse: true,
        },
    },
    {
        timestamps: true,
    }
);

BuyerOrderSchema.index({ buyerId: 1, status: 1 });
BuyerOrderSchema.index({ hubId: 1 });
BuyerOrderSchema.index({ orderNumber: 1 });

// Force fresh model registration to pick up schema changes
let BuyerOrder: Model<IBuyerOrder>;
try {
    // deleteModel is the proper Mongoose API to clear a cached model
    mongoose.deleteModel('BuyerOrder');
} catch {
    // Model didn't exist yet, that's fine
}
BuyerOrder = mongoose.model<IBuyerOrder>('BuyerOrder', BuyerOrderSchema);

export default BuyerOrder;
