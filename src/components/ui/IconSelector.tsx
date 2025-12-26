'use client';

import React, { useState } from 'react';

interface IconSelectorProps {
    options: Array<{
        value: string;
        icon: string;
        label: string;
    }>;
    value: string;
    onChange: (value: string) => void;
    columns?: 2 | 3 | 4;
}

export default function IconSelector({
    options,
    value,
    onChange,
    columns = 3,
}: IconSelectorProps) {
    const gridCols = {
        2: 'grid-cols-2',
        3: 'grid-cols-3',
        4: 'grid-cols-4',
    };

    return (
        <div className={`grid ${gridCols[columns]} gap-3`}>
            {options.map((option) => (
                <button
                    key={option.value}
                    type="button"
                    onClick={() => onChange(option.value)}
                    className={`
            flex flex-col items-center justify-center
            p-4 rounded-2xl border-2
            transition-all duration-200
            min-h-[100px]
            ${value === option.value
                            ? 'border-green-600 bg-green-50 shadow-lg shadow-green-500/20'
                            : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                        }
          `}
                >
                    <span className="text-4xl mb-2">{option.icon}</span>
                    <span
                        className={`text-sm font-medium ${value === option.value ? 'text-green-700' : 'text-gray-600'
                            }`}
                    >
                        {option.label}
                    </span>
                </button>
            ))}
        </div>
    );
}
