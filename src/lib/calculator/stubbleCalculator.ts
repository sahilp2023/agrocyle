import { CropType } from '../models/Farm';

// Crop-specific constants for stubble calculation
interface CropConstants {
    yieldFactor: number;     // tonnes of crop per acre
    residueRatio: number;    // ratio of residue to crop
    pricePerTonne: number;   // ₹ per tonne of stubble
    nameHi: string;          // Hindi name
    nameEn: string;          // English name
    icon: string;            // Icon identifier
}

export const CROP_CONSTANTS: Record<CropType, CropConstants> = {
    paddy: {
        yieldFactor: 0.8,
        residueRatio: 1.5,
        pricePerTonne: 2000,
        nameHi: 'धान',
        nameEn: 'Paddy',
        icon: '🌾',
    },
    wheat: {
        yieldFactor: 0.6,
        residueRatio: 1.3,
        pricePerTonne: 1800,
        nameHi: 'गेहूं',
        nameEn: 'Wheat',
        icon: '🌿',
    },
    sugarcane: {
        yieldFactor: 1.2,
        residueRatio: 0.8,
        pricePerTonne: 1500,
        nameHi: 'गन्ना',
        nameEn: 'Sugarcane',
        icon: '🎋',
    },
    maize: {
        yieldFactor: 0.5,
        residueRatio: 1.2,
        pricePerTonne: 1600,
        nameHi: 'मक्का',
        nameEn: 'Maize',
        icon: '🌽',
    },
    cotton: {
        yieldFactor: 0.4,
        residueRatio: 2.0,
        pricePerTonne: 1400,
        nameHi: 'कपास',
        nameEn: 'Cotton',
        icon: '☁️',
    },
    other: {
        yieldFactor: 0.5,
        residueRatio: 1.0,
        pricePerTonne: 1500,
        nameHi: 'अन्य',
        nameEn: 'Other',
        icon: '🌱',
    },
};

export interface StubbleEstimate {
    cropType: CropType;
    areaInAcres: number;
    estimatedTonnes: number;
    estimatedPrice: number;
    pricePerTonne: number;
    breakdown: {
        yieldFactor: number;
        residueRatio: number;
        formula: string;
    };
}

/**
 * Calculate estimated stubble weight and price
 * Formula: Stubble (tonnes) = Area (acres) × Yield Factor × Residue Ratio
 * Price = Stubble × Price per Tonne
 */
export function calculateStubbleEstimate(
    cropType: CropType,
    areaInAcres: number
): StubbleEstimate {
    const constants = CROP_CONSTANTS[cropType];

    const estimatedTonnes = Number(
        (areaInAcres * constants.yieldFactor * constants.residueRatio).toFixed(2)
    );

    const estimatedPrice = Math.round(estimatedTonnes * constants.pricePerTonne);

    return {
        cropType,
        areaInAcres,
        estimatedTonnes,
        estimatedPrice,
        pricePerTonne: constants.pricePerTonne,
        breakdown: {
            yieldFactor: constants.yieldFactor,
            residueRatio: constants.residueRatio,
            formula: `${areaInAcres} acres × ${constants.yieldFactor} × ${constants.residueRatio} = ${estimatedTonnes} tonnes`,
        },
    };
}

/**
 * Calculate final price after actual weighing
 */
export function calculateFinalPrice(
    cropType: CropType,
    actualTonnes: number
): number {
    const constants = CROP_CONSTANTS[cropType];
    return Math.round(actualTonnes * constants.pricePerTonne);
}

/**
 * Get crop display info for UI
 */
export function getCropInfo(cropType: CropType, language: 'hi' | 'en' = 'hi') {
    const constants = CROP_CONSTANTS[cropType];
    return {
        name: language === 'hi' ? constants.nameHi : constants.nameEn,
        icon: constants.icon,
        pricePerTonne: constants.pricePerTonne,
    };
}

/**
 * Get all crops for selection UI
 */
export function getAllCrops(language: 'hi' | 'en' = 'hi') {
    return Object.entries(CROP_CONSTANTS).map(([type, constants]) => ({
        type: type as CropType,
        name: language === 'hi' ? constants.nameHi : constants.nameEn,
        icon: constants.icon,
        pricePerTonne: constants.pricePerTonne,
    }));
}
