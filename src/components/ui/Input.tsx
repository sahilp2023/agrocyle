import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    icon?: React.ReactNode;
    helperText?: string;
}

export default function Input({
    label,
    error,
    icon,
    helperText,
    className = '',
    ...props
}: InputProps) {
    return (
        <div className="w-full">
            {label && (
                <label className="block text-sm font-medium text-gray-700 mb-2">
                    {label}
                </label>
            )}

            <div className="relative">
                {icon && (
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xl">
                        {icon}
                    </div>
                )}

                <input
                    className={`
            w-full
            ${icon ? 'pl-12' : 'pl-4'}
            pr-4 py-4
            text-lg
            rounded-xl
            border-2
            transition-all duration-200
            focus:outline-none focus:ring-4 focus:ring-offset-0
            ${error
                            ? 'border-red-400 bg-red-50 focus:border-red-500 focus:ring-red-500/20'
                            : 'border-gray-200 bg-white focus:border-green-500 focus:ring-green-500/20'
                        }
            placeholder:text-gray-400
            disabled:bg-gray-100 disabled:cursor-not-allowed
            ${className}
          `}
                    {...props}
                />
            </div>

            {error && (
                <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                    <span>⚠️</span> {error}
                </p>
            )}

            {helperText && !error && (
                <p className="mt-2 text-sm text-gray-500">{helperText}</p>
            )}
        </div>
    );
}
