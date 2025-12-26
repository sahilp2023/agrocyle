'use client';

import React, { useRef, useEffect, useState } from 'react';

interface OTPInputProps {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    onComplete?: (value: string) => void;
    error?: boolean;
}

export default function OTPInput({
    length = 6,
    value,
    onChange,
    onComplete,
    error = false,
}: OTPInputProps) {
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        inputRefs.current[0]?.focus();
    }, []);

    const handleChange = (index: number, digit: string) => {
        if (!/^\d*$/.test(digit)) return;

        const newValue = value.split('');
        newValue[index] = digit.slice(-1);
        const updatedValue = newValue.join('').slice(0, length);
        onChange(updatedValue);

        if (digit && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
            setActiveIndex(index + 1);
        }

        if (updatedValue.length === length && onComplete) {
            onComplete(updatedValue);
        }
    };

    const handleKeyDown = (
        index: number,
        e: React.KeyboardEvent<HTMLInputElement>
    ) => {
        if (e.key === 'Backspace' && !value[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
            setActiveIndex(index - 1);
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').replace(/\D/g, '');
        const newValue = pastedData.slice(0, length);
        onChange(newValue);

        if (newValue.length === length && onComplete) {
            onComplete(newValue);
        }
    };

    return (
        <div className="flex justify-center gap-3">
            {Array.from({ length }).map((_, index) => (
                <input
                    key={index}
                    ref={(el) => {
                        inputRefs.current[index] = el;
                    }}
                    type="tel"
                    inputMode="numeric"
                    maxLength={1}
                    value={value[index] || ''}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
                    onPaste={handlePaste}
                    onFocus={() => setActiveIndex(index)}
                    className={`
            w-12 h-14 sm:w-14 sm:h-16
            text-center text-2xl font-bold
            rounded-xl border-2
            transition-all duration-200
            focus:outline-none
            ${error
                            ? 'border-red-400 bg-red-50 text-red-600 animate-shake'
                            : activeIndex === index
                                ? 'border-green-500 bg-green-50 shadow-lg shadow-green-500/20'
                                : value[index]
                                    ? 'border-green-400 bg-green-50/50'
                                    : 'border-gray-200 bg-white'
                        }
          `}
                />
            ))}
        </div>
    );
}
