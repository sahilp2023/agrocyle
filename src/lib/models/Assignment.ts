import mongoose, { Schema, Document, Model } from 'mongoose';

export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'cancelled';
export type OperatorJobStatus =
    | 'pending'        // Waiting for operator to accept
    | 'accepted'       // Operator accepted
    | 'rejected'       // Operator rejected
    | 'en_route'       // Operator heading to farm
    | 'arrived'        // Arrived at farm
    | 'work_started'   // Baling/Loading started
    | 'work_complete'  // Baling/Loading done
    | 'loading'        // Truck: loading bales
    | 'in_transit'     // Truck: heading to hub
    | 'delivered';     // Truck: delivered to hub

export interface IAssignment extends Document {
    _id: mongoose.Types.ObjectId;
    bookingId: mongoose.Types.ObjectId;
    balerId: mongoose.Types.ObjectId;
    truckId?: mongoose.Types.ObjectId;
    hubId: mongoose.Types.ObjectId;
    operatorId?: mongoose.Types.ObjectId;
    status: AssignmentStatus;
    operatorStatus: OperatorJobStatus;
    rejectionReason?: string;
    assignedAt: Date;
    acceptedAt?: Date;
    enRouteAt?: Date;
    arrivedAt?: Date;
    workStartedAt?: Date;
    workCompletedAt?: Date;
    startedAt?: Date;
    completedAt?: Date;
    actualQuantityTonnes?: number;
    notes?: string;
    // Operator work documentation
    farmLocation?: {
        lat: number;
        lng: number;
        address?: string;
    };
    photos?: {
        before: string[];
        after: string[];
        fieldCondition: string[];
    };
    baleCount?: number;
    loadWeightTonnes?: number;
    farmerSignature?: string;
    operatorRemarks?: string;
    timeRequired?: number;       // Minutes taken for the job
    moistureContent?: number;    // Moisture % of the field
    estimatedEarning?: number;
    pauseReason?: string;
    createdAt: Date;
    updatedAt: Date;
}

const AssignmentSchema = new Schema<IAssignment>(
    {
        bookingId: {
            type: Schema.Types.ObjectId,
            ref: 'Booking',
            required: true,
            index: true,
        },
        balerId: {
            type: Schema.Types.ObjectId,
            ref: 'Baler',
            index: true,
        },
        truckId: {
            type: Schema.Types.ObjectId,
            ref: 'Baler', // Trucks are stored in Baler collection with vehicleType='truck'
            index: true,
        },
        hubId: {
            type: Schema.Types.ObjectId,
            ref: 'Hub',
            required: true,
            index: true,
        },
        operatorId: {
            type: Schema.Types.ObjectId,
            ref: 'Operator',
            index: true,
        },
        status: {
            type: String,
            enum: ['assigned', 'in_progress', 'completed', 'cancelled'],
            default: 'assigned',
        },
        operatorStatus: {
            type: String,
            enum: ['pending', 'accepted', 'rejected', 'en_route', 'arrived', 'work_started', 'work_complete', 'loading', 'in_transit', 'delivered'],
            default: 'pending',
        },
        rejectionReason: {
            type: String,
            trim: true,
        },
        assignedAt: {
            type: Date,
            default: Date.now,
        },
        acceptedAt: { type: Date },
        enRouteAt: { type: Date },
        arrivedAt: { type: Date },
        workStartedAt: { type: Date },
        workCompletedAt: { type: Date },
        startedAt: {
            type: Date,
        },
        completedAt: {
            type: Date,
        },
        actualQuantityTonnes: {
            type: Number,
            min: 0,
        },
        notes: {
            type: String,
            trim: true,
        },
        // Operator work documentation
        farmLocation: {
            lat: { type: Number },
            lng: { type: Number },
            address: { type: String },
        },
        photos: {
            before: [{ type: String }],
            after: [{ type: String }],
            fieldCondition: [{ type: String }],
        },
        baleCount: {
            type: Number,
            min: 0,
        },
        loadWeightTonnes: {
            type: Number,
            min: 0,
        },
        farmerSignature: {
            type: String,
        },
        operatorRemarks: {
            type: String,
            trim: true,
        },
        timeRequired: {
            type: Number,
            min: 0,
        },
        moistureContent: {
            type: Number,
            min: 0,
        },
        estimatedEarning: {
            type: Number,
            min: 0,
        },
        pauseReason: {
            type: String,
            trim: true,
        },
    },
    {
        timestamps: true,
    }
);

AssignmentSchema.index({ hubId: 1, status: 1 });
AssignmentSchema.index({ bookingId: 1 }, { unique: true });
AssignmentSchema.index({ operatorId: 1, operatorStatus: 1 });
AssignmentSchema.index({ operatorId: 1, completedAt: -1 });

const Assignment: Model<IAssignment> =
    mongoose.models.Assignment || mongoose.model<IAssignment>('Assignment', AssignmentSchema);

export default Assignment;
