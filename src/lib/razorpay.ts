import Razorpay from 'razorpay';
import crypto from 'crypto';

// Initialize Razorpay client
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

// Types
export interface CreateOrderParams {
    amount: number; // Amount in INR (will be converted to paise)
    currency?: string;
    receipt: string;
    notes?: Record<string, string>;
}

export interface OrderResponse {
    id: string;
    entity: string;
    amount: number;
    amount_paid: number;
    amount_due: number;
    currency: string;
    receipt: string;
    status: string;
    created_at: number;
}

export interface PaymentVerificationParams {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
}

export interface PayoutParams {
    accountNumber: string;
    ifsc: string;
    accountHolderName: string;
    amount: number; // Amount in INR
    purpose: string;
    referenceId: string;
    narration?: string;
}

export interface UPIPayoutParams {
    upiId: string;
    name: string;
    amount: number;
    purpose: string;
    referenceId: string;
    narration?: string;
}

/**
 * Create a Razorpay order for checkout
 * @param params Order parameters
 * @returns Razorpay order object
 */
export async function createRazorpayOrder(params: CreateOrderParams): Promise<OrderResponse> {
    const options = {
        amount: Math.round(params.amount * 100), // Convert to paise
        currency: params.currency || 'INR',
        receipt: params.receipt,
        notes: params.notes || {},
    };

    const order = await razorpay.orders.create(options);
    return order as OrderResponse;
}

/**
 * Verify Razorpay payment signature
 * @param params Payment verification parameters
 * @returns Boolean indicating if signature is valid
 */
export function verifyPaymentSignature(params: PaymentVerificationParams): boolean {
    const secret = process.env.RAZORPAY_KEY_SECRET || '';

    const body = params.razorpay_order_id + '|' + params.razorpay_payment_id;
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

    return expectedSignature === params.razorpay_signature;
}

/**
 * Verify Razorpay webhook signature
 * @param body Raw request body
 * @param signature Signature from header
 * @returns Boolean indicating if signature is valid
 */
export function verifyWebhookSignature(body: string, signature: string): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || '';

    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(body)
        .digest('hex');

    return expectedSignature === signature;
}

/**
 * Fetch payment details from Razorpay
 * @param paymentId Razorpay payment ID
 */
export async function fetchPayment(paymentId: string) {
    return await razorpay.payments.fetch(paymentId);
}

/**
 * Initiate refund for a payment
 * @param paymentId Razorpay payment ID
 * @param amount Amount to refund in INR (optional, defaults to full refund)
 */
export async function initiateRefund(paymentId: string, amount?: number) {
    const options: any = {};
    if (amount) {
        options.amount = Math.round(amount * 100); // Convert to paise
    }
    return await razorpay.payments.refund(paymentId, options);
}

/**
 * Get Razorpay key ID for frontend
 */
export function getRazorpayKeyId(): string {
    return process.env.RAZORPAY_KEY_ID || '';
}

// ============== RazorpayX Payout Functions ==============
// Note: RazorpayX requires separate activation from Razorpay dashboard

/**
 * Create a fund account for bank transfer payout
 * @param contactId Razorpay contact ID
 * @param bankDetails Bank account details
 * @returns Fund account object with id property
 */
export async function createBankFundAccount(
    contactId: string,
    bankDetails: { accountNumber: string; ifsc: string; accountHolderName: string }
): Promise<{ id: string }> {
    try {
        // @ts-ignore - RazorpayX fund_accounts API not in types
        const fundAccount = await (razorpay as any).fundAccount.create({
            contact_id: contactId,
            account_type: 'bank_account',
            bank_account: {
                name: bankDetails.accountHolderName,
                ifsc: bankDetails.ifsc,
                account_number: bankDetails.accountNumber,
            },
        });
        return fundAccount;
    } catch (error) {
        console.error('Failed to create bank fund account:', error);
        throw error;
    }
}

/**
 * Create a fund account for UPI payout
 * @param contactId Razorpay contact ID
 * @param upiDetails UPI details
 * @returns Fund account object with id property
 */
export async function createUPIFundAccount(
    contactId: string,
    upiDetails: { upiId: string; name: string }
): Promise<{ id: string }> {
    try {
        // @ts-ignore - RazorpayX fund_accounts API not in types
        const fundAccount = await (razorpay as any).fundAccount.create({
            contact_id: contactId,
            account_type: 'vpa',
            vpa: {
                address: upiDetails.upiId,
            },
        });
        return fundAccount;
    } catch (error) {
        console.error('Failed to create UPI fund account:', error);
        throw error;
    }
}

/**
 * Create a contact in RazorpayX
 * @param farmer Farmer details
 */
export async function createRazorpayContact(farmer: {
    name: string;
    phone: string;
    email?: string;
    referenceId: string;
}) {
    try {
        // @ts-ignore - RazorpayX contacts API
        const contact = await razorpay.contacts.create({
            name: farmer.name,
            contact: farmer.phone,
            email: farmer.email || undefined,
            type: 'vendor',
            reference_id: farmer.referenceId,
        });
        return contact;
    } catch (error) {
        console.error('Failed to create Razorpay contact:', error);
        throw error;
    }
}

/**
 * Create a payout to a fund account
 * @param params Payout parameters
 */
export async function createPayout(params: {
    fundAccountId: string;
    amount: number; // in INR
    purpose: 'vendor_payment' | 'salary' | 'payout' | 'refund';
    referenceId: string;
    narration?: string;
}) {
    try {
        // @ts-ignore - RazorpayX payouts API
        const payout = await razorpay.payouts.create({
            account_number: process.env.RAZORPAYX_ACCOUNT_NUMBER, // Your RazorpayX account
            fund_account_id: params.fundAccountId,
            amount: Math.round(params.amount * 100), // Convert to paise
            currency: 'INR',
            mode: 'IMPS', // or NEFT, RTGS, UPI
            purpose: params.purpose,
            queue_if_low_balance: true,
            reference_id: params.referenceId,
            narration: params.narration || 'AgroCycle Payout',
        });
        return payout;
    } catch (error) {
        console.error('Failed to create payout:', error);
        throw error;
    }
}

/**
 * Check if RazorpayX is configured
 */
export function isRazorpayXConfigured(): boolean {
    return !!(
        process.env.RAZORPAY_KEY_ID &&
        process.env.RAZORPAY_KEY_SECRET &&
        process.env.RAZORPAYX_ACCOUNT_NUMBER
    );
}

// Export the razorpay instance for direct access if needed
export { razorpay };
