import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/utils';

// Simple pincode to city/state mapping for common Indian pincodes
// In production, use an external API like India Post or a comprehensive database
const PINCODE_DATA: Record<string, { city: string; state: string; district?: string }> = {
    // Punjab
    '140301': { city: 'Mohali', state: 'Punjab', district: 'Mohali' },
    '140302': { city: 'Mohali', state: 'Punjab', district: 'Mohali' },
    '140306': { city: 'Mohali', state: 'Punjab', district: 'Mohali' },
    '140307': { city: 'Kharar', state: 'Punjab', district: 'Mohali' },
    '140413': { city: 'Dera Bassi', state: 'Punjab', district: 'Mohali' },
    '140001': { city: 'Ludhiana', state: 'Punjab', district: 'Ludhiana' },
    '140101': { city: 'Ropar', state: 'Punjab', district: 'Rupnagar' },
    '143001': { city: 'Amritsar', state: 'Punjab', district: 'Amritsar' },
    '141001': { city: 'Ludhiana', state: 'Punjab', district: 'Ludhiana' },
    '147001': { city: 'Patiala', state: 'Punjab', district: 'Patiala' },
    '151001': { city: 'Bathinda', state: 'Punjab', district: 'Bathinda' },
    '144001': { city: 'Jalandhar', state: 'Punjab', district: 'Jalandhar' },

    // Haryana
    '121001': { city: 'Faridabad', state: 'Haryana', district: 'Faridabad' },
    '122001': { city: 'Gurgaon', state: 'Haryana', district: 'Gurugram' },
    '124001': { city: 'Rohtak', state: 'Haryana', district: 'Rohtak' },
    '125001': { city: 'Hisar', state: 'Haryana', district: 'Hisar' },
    '132001': { city: 'Karnal', state: 'Haryana', district: 'Karnal' },
    '133001': { city: 'Ambala', state: 'Haryana', district: 'Ambala' },
    '134001': { city: 'Panchkula', state: 'Haryana', district: 'Panchkula' },
    '135001': { city: 'Yamunanagar', state: 'Haryana', district: 'Yamunanagar' },
    '136001': { city: 'Kaithal', state: 'Haryana', district: 'Kaithal' },

    // Chandigarh
    '160001': { city: 'Chandigarh', state: 'Chandigarh', district: 'Chandigarh' },
    '160002': { city: 'Chandigarh', state: 'Chandigarh', district: 'Chandigarh' },
    '160003': { city: 'Chandigarh', state: 'Chandigarh', district: 'Chandigarh' },
    '160017': { city: 'Chandigarh', state: 'Chandigarh', district: 'Chandigarh' },

    // Uttar Pradesh
    '201001': { city: 'Ghaziabad', state: 'Uttar Pradesh', district: 'Ghaziabad' },
    '201301': { city: 'Noida', state: 'Uttar Pradesh', district: 'Gautam Buddha Nagar' },
    '226001': { city: 'Lucknow', state: 'Uttar Pradesh', district: 'Lucknow' },
    '208001': { city: 'Kanpur', state: 'Uttar Pradesh', district: 'Kanpur' },
    '221001': { city: 'Varanasi', state: 'Uttar Pradesh', district: 'Varanasi' },
    '250001': { city: 'Meerut', state: 'Uttar Pradesh', district: 'Meerut' },
};

// GET /api/pincode?code=140301
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const pincode = searchParams.get('code');

        if (!pincode) {
            return errorResponse('Pincode is required', 400);
        }

        if (!/^\d{6}$/.test(pincode)) {
            return errorResponse('Invalid pincode format', 400);
        }

        // Check local mapping first
        const localData = PINCODE_DATA[pincode];
        if (localData) {
            return successResponse({
                pincode,
                city: localData.city,
                state: localData.state,
                district: localData.district,
            });
        }

        // Try external API (India Post) as fallback
        try {
            const externalRes = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
            const externalData = await externalRes.json();

            if (externalData[0]?.Status === 'Success' && externalData[0]?.PostOffice?.length > 0) {
                const postOffice = externalData[0].PostOffice[0];
                return successResponse({
                    pincode,
                    city: postOffice.Block || postOffice.District,
                    state: postOffice.State,
                    district: postOffice.District,
                });
            }
        } catch {
            // External API failed, continue with not found
        }

        return errorResponse('Pincode not found', 404);
    } catch (error) {
        console.error('Pincode lookup error:', error);
        return errorResponse('Failed to lookup pincode', 500);
    }
}
