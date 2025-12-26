'use client';

import React from 'react';
import { FiGlobe } from 'react-icons/fi';

interface LanguageToggleProps {
    locale: 'hi' | 'en';
    onChange: (locale: 'hi' | 'en') => void;
}

export default function LanguageToggle({ locale, onChange }: LanguageToggleProps) {
    return (
        <button
            onClick={() => onChange(locale === 'hi' ? 'en' : 'hi')}
            className="
        flex items-center gap-2
        px-4 py-2
        bg-white/80 backdrop-blur-sm
        rounded-full
        border border-gray-200
        shadow-sm
        transition-all duration-200
        hover:bg-white hover:shadow-md
        active:scale-95
      "
        >
            <FiGlobe className="text-green-600" />
            <span className="text-sm font-semibold text-gray-700">
                {locale === 'hi' ? 'EN' : 'हिं'}
            </span>
        </button>
    );
}
