'use client';

import React from 'react';

interface SliderProps {
    min: number;
    max: number;
    step: number;
    value: number;
    onChange: (value: number) => void;
    unit?: string;
    label?: string;
    showValue?: boolean;
    marks?: Array<{ value: number; label: string }>;
}

export default function Slider({
    min,
    max,
    step,
    value,
    onChange,
    unit = '',
    label,
    showValue = true,
    marks,
}: SliderProps) {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="w-full">
            {(label || showValue) && (
                <div className="flex justify-between items-center mb-3">
                    {label && (
                        <span className="text-gray-600 font-medium">{label}</span>
                    )}
                    {showValue && (
                        <span className="text-2xl font-bold text-green-700">
                            {value} {unit}
                        </span>
                    )}
                </div>
            )}

            <div className="relative">
                <input
                    type="range"
                    min={min}
                    max={max}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    className="
            w-full h-3 rounded-full appearance-none cursor-pointer
            bg-gray-200
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-8
            [&::-webkit-slider-thumb]:h-8
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-gradient-to-br
            [&::-webkit-slider-thumb]:from-green-500
            [&::-webkit-slider-thumb]:to-green-700
            [&::-webkit-slider-thumb]:shadow-lg
            [&::-webkit-slider-thumb]:shadow-green-500/50
            [&::-webkit-slider-thumb]:border-4
            [&::-webkit-slider-thumb]:border-white
            [&::-webkit-slider-thumb]:cursor-pointer
            [&::-webkit-slider-thumb]:transition-transform
            [&::-webkit-slider-thumb]:hover:scale-110
            [&::-webkit-slider-thumb]:active:scale-95
            [&::-moz-range-thumb]:w-8
            [&::-moz-range-thumb]:h-8
            [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-gradient-to-br
            [&::-moz-range-thumb]:from-green-500
            [&::-moz-range-thumb]:to-green-700
            [&::-moz-range-thumb]:border-4
            [&::-moz-range-thumb]:border-white
            [&::-moz-range-thumb]:cursor-pointer
          "
                    style={{
                        background: `linear-gradient(to right, #16a34a 0%, #16a34a ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
                    }}
                />

                {/* Quick select buttons */}
                <div className="flex justify-between mt-4 gap-2">
                    {[1, 5, 10, 25, 50].filter(v => v >= min && v <= max).map((preset) => (
                        <button
                            key={preset}
                            type="button"
                            onClick={() => onChange(preset)}
                            className={`
                flex-1 py-2 px-3 rounded-xl text-sm font-semibold
                transition-all duration-200
                ${value === preset
                                    ? 'bg-green-600 text-white'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }
              `}
                        >
                            {preset}
                        </button>
                    ))}
                </div>
            </div>

            {marks && (
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    {marks.map((mark) => (
                        <span key={mark.value}>{mark.label}</span>
                    ))}
                </div>
            )}
        </div>
    );
}
