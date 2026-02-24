import { NextRequest } from 'next/server';
import dbConnect from '@/lib/db/mongodb';
import Payout from '@/lib/models/Payout';
import Farmer from '@/lib/models/Farmer';
import Booking from '@/lib/models/Booking';
import {
    createRazorpayContact,
    createBankFundAccount,
    createUPIFundAccount,
    createPayout,
    isRazorpayXConfigured
} from '@/lib/razorpay';
import { successResponse, errorResponse } from '@/lib/utils';
import { getHubManagerFromRequest } from '@/lib/utils/hubAuth';

// POST /api/hub/payouts/process - Process a payout with Razorpay
export async function POST(request: NextRequest) {
    try {
        const manager = getHubManagerFromRequest(request);
        if (!manager) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json();
        const {
            farmerId,
            bookingIds,
            totalQuantityTonnes,
            basePrice,
            subsidyAmount,
            balingCost,
            logisticsDeduction,
            netPayable,
            paymentMethod, // 'upi' | 'bank' | 'manual'
            notes,
        } = body;

        if (!farmerId || !netPayable || netPayable <= 0) {
            return errorResponse('Farmer ID and valid net payable amount are required', 400);
        }

        if (!paymentMethod) {
            return errorResponse('Payment method is required', 400);
        }

        await dbConnect();

        // Get farmer details
        const farmer = await Farmer.findById(farmerId);
        if (!farmer) {
            return errorResponse('Farmer not found', 404);
        }

        // Validate payment method details
        if (paymentMethod === 'upi' && !farmer.upiId) {
            return errorResponse('Farmer has no UPI ID registered', 400);
        }
        if (paymentMethod === 'bank' && !farmer.bankDetails?.accountNumber) {
            return errorResponse('Farmer has no bank account registered', 400);
        }

        // Create payout record first
        const payout = await Payout.create({
            farmerId,
            hubId: manager.hubId,
            bookingIds: bookingIds || [],
            totalQuantityTonnes: totalQuantityTonnes || 0,
            pricePerTonne: basePrice || 0,
            breakdown: {
                baseAmount: (totalQuantityTonnes || 0) * (basePrice || 0),
                subsidy: subsidyAmount || 0,
                balingCost: balingCost || 0,
                logisticsDeduction: logisticsDeduction || 0,
                netPayable: netPayable,
            },
            status: 'processing',
            notes,
        });

        // Mark bookings as payout initiated
        if (bookingIds && bookingIds.length > 0) {
            await Booking.updateMany(
                { _id: { $in: bookingIds } },
                { payoutInitiated: true }
            );
        }

        // Process actual payment via RazorpayX (if configured)
        if (paymentMethod !== 'manual' && isRazorpayXConfigured()) {
            try {
                // Create or get Razorpay contact
                let contactId = farmer.razorpayContactId;
                if (!contactId) {
                    const contact = await createRazorpayContact({
                        name: farmer.name,
                        phone: farmer.phone,
                        referenceId: farmer._id.toString(),
                    });
                    contactId = contact.id;
                    // Save contact ID for future payouts
                    farmer.razorpayContactId = contactId;
                    await farmer.save();
                }

                // Create fund account based on payment method
                let fundAccountId: string;

                if (paymentMethod === 'upi') {
                    const fundAccount = await createUPIFundAccount(contactId!, {
                        upiId: farmer.upiId!,
                        name: farmer.name,
                    });
                    fundAccountId = fundAccount.id;
                } else {
                    const fundAccount = await createBankFundAccount(contactId!, {
                        accountNumber: farmer.bankDetails!.accountNumber,
                        ifsc: farmer.bankDetails!.ifsc,
                        accountHolderName: farmer.bankDetails!.accountHolderName,
                    });
                    fundAccountId = fundAccount.id;
                }

                // Create the payout
                const razorpayPayout = await createPayout({
                    fundAccountId,
                    amount: netPayable,
                    purpose: 'vendor_payment',
                    referenceId: payout._id.toString(),
                    narration: `AgroCycle payout for ${totalQuantityTonnes} tonnes`,
                });

                // Update payout with Razorpay details
                payout.razorpayPayoutId = razorpayPayout.id;
                payout.razorpayFundAccountId = fundAccountId;
                payout.razorpayContactId = contactId;
                payout.status = razorpayPayout.status === 'processed' ? 'completed' : 'processing';
                await payout.save();

            } catch (razorpayError) {
                console.error('RazorpayX payout failed:', razorpayError);
                // Mark as pending for manual processing
                payout.status = 'pending';
                payout.notes = (payout.notes || '') + '\nRazorpayX failed, marked for manual processing.';
                await payout.save();
            }
        } else {
            // Manual processing - just mark as pending
            payout.status = 'pending';
            await payout.save();
        }

        const populatedPayout = await Payout.findById(payout._id).populate('farmerId', 'name phone upiId');

        return successResponse({
            payout: populatedPayout,
            isRazorpayXEnabled: isRazorpayXConfigured(),
            paymentMethod,
        }, paymentMethod === 'manual'
            ? 'Payout created for manual processing'
            : 'Payout initiated via Razorpay'
        );
    } catch (error) {
        console.error('Process payout error:', error);
        return errorResponse(
            error instanceof Error ? error.message : 'Failed to process payout',
            500
        );
    }
}
