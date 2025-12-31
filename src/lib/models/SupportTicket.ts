import mongoose, { Schema, Document, Model } from 'mongoose';

export type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed';
export type TicketCategory = 'payment' | 'pickup' | 'technical' | 'other';
export type TicketPriority = 'low' | 'medium' | 'high';
export type CreatorType = 'farmer' | 'hub_manager';

export interface ITicketMessage {
    sender: 'user' | 'admin';
    message: string;
    timestamp: Date;
}

export interface ISupportTicket extends Document {
    _id: mongoose.Types.ObjectId;
    ticketNumber: string;
    createdBy: mongoose.Types.ObjectId;
    createdByType: CreatorType;
    createdByName: string;
    hubId?: mongoose.Types.ObjectId;

    category: TicketCategory;
    subject: string;
    description: string;

    status: TicketStatus;
    priority: TicketPriority;

    messages: ITicketMessage[];

    resolvedAt?: Date;
    closedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

const TicketMessageSchema = new Schema<ITicketMessage>(
    {
        sender: {
            type: String,
            enum: ['user', 'admin'],
            required: true,
        },
        message: {
            type: String,
            required: true,
            trim: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { _id: false }
);

const SupportTicketSchema = new Schema<ISupportTicket>(
    {
        ticketNumber: {
            type: String,
            unique: true,
            required: true,
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            required: true,
            refPath: 'createdByType',
        },
        createdByType: {
            type: String,
            enum: ['farmer', 'hub_manager'],
            required: true,
        },
        createdByName: {
            type: String,
            required: true,
            trim: true,
        },
        hubId: {
            type: Schema.Types.ObjectId,
            ref: 'Hub',
            index: true,
        },
        category: {
            type: String,
            enum: ['payment', 'pickup', 'technical', 'other'],
            required: true,
        },
        subject: {
            type: String,
            required: true,
            trim: true,
            maxlength: 200,
        },
        description: {
            type: String,
            required: true,
            trim: true,
            maxlength: 2000,
        },
        status: {
            type: String,
            enum: ['open', 'in_progress', 'resolved', 'closed'],
            default: 'open',
        },
        priority: {
            type: String,
            enum: ['low', 'medium', 'high'],
            default: 'medium',
        },
        messages: {
            type: [TicketMessageSchema],
            default: [],
        },
        resolvedAt: {
            type: Date,
        },
        closedAt: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Indexes
SupportTicketSchema.index({ createdBy: 1, createdByType: 1 });
SupportTicketSchema.index({ status: 1 });
SupportTicketSchema.index({ createdAt: -1 });

// Generate ticket number before save
SupportTicketSchema.pre('save', async function (next) {
    if (this.isNew && !this.ticketNumber) {
        const year = new Date().getFullYear();
        const count = await mongoose.models.SupportTicket.countDocuments();
        this.ticketNumber = `TKT-${year}-${String(count + 1).padStart(4, '0')}`;
    }
    next();
});

const SupportTicket: Model<ISupportTicket> =
    mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);

export default SupportTicket;
