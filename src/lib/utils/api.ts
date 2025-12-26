import { NextResponse } from 'next/server';

export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    pagination?: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

/**
 * Success response helper
 */
export function successResponse<T>(
    data: T,
    message?: string,
    pagination?: ApiResponse['pagination']
): NextResponse<ApiResponse<T>> {
    return NextResponse.json({
        success: true,
        data,
        message,
        pagination,
    });
}

/**
 * Error response helper
 */
export function errorResponse(
    error: string,
    status: number = 400
): NextResponse<ApiResponse> {
    return NextResponse.json(
        {
            success: false,
            error,
        },
        { status }
    );
}

/**
 * Parse pagination params from URL
 */
export function getPaginationParams(searchParams: URLSearchParams): {
    page: number;
    limit: number;
    skip: number;
} {
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const skip = (page - 1) * limit;

    return { page, limit, skip };
}

/**
 * Create pagination metadata
 */
export function createPaginationMeta(
    total: number,
    page: number,
    limit: number
): ApiResponse['pagination'] {
    return {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
    };
}

/**
 * Format phone number (Indian)
 */
export function formatPhone(phone: string): string {
    const cleaned = phone.replace(/\D/g, '').slice(-10);
    return cleaned;
}

/**
 * Validate Indian phone number
 */
export function isValidIndianPhone(phone: string): boolean {
    return /^[6-9]\d{9}$/.test(formatPhone(phone));
}

/**
 * Format currency in INR
 */
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0,
    }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string, locale: 'hi' | 'en' = 'hi'): string {
    const d = new Date(date);
    return d.toLocaleDateString(locale === 'hi' ? 'hi-IN' : 'en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
}
