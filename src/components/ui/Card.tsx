import React from 'react';

interface CardProps {
    children: React.ReactNode;
    className?: string;
    padding?: 'none' | 'sm' | 'md' | 'lg';
    onClick?: () => void;
    interactive?: boolean;
}

export default function Card({
    children,
    className = '',
    padding = 'md',
    onClick,
    interactive = false,
}: CardProps) {
    const paddingStyles = {
        none: '',
        sm: 'p-3',
        md: 'p-4',
        lg: 'p-6',
    };

    return (
        <div
            onClick={onClick}
            className={`
        bg-white rounded-2xl shadow-sm border border-gray-100
        ${paddingStyles[padding]}
        ${interactive ? 'cursor-pointer hover:shadow-md hover:border-gray-200 transition-all duration-200 active:scale-[0.99]' : ''}
        ${className}
      `}
        >
            {children}
        </div>
    );
}
