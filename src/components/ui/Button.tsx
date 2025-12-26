import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
    size?: 'sm' | 'md' | 'lg' | 'xl';
    fullWidth?: boolean;
    icon?: React.ReactNode;
    iconPosition?: 'left' | 'right';
    loading?: boolean;
    children: React.ReactNode;
}

export default function Button({
    variant = 'primary',
    size = 'lg',
    fullWidth = true,
    icon,
    iconPosition = 'left',
    loading = false,
    children,
    disabled,
    className = '',
    ...props
}: ButtonProps) {
    const baseStyles = `
    inline-flex items-center justify-center gap-3
    font-semibold rounded-2xl
    transition-all duration-200 ease-out
    active:scale-[0.98]
    disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
    focus:outline-none focus:ring-4 focus:ring-offset-2
  `;

    const variants = {
        primary: `
      bg-gradient-to-r from-green-600 to-green-700
      hover:from-green-700 hover:to-green-800
      text-white shadow-lg shadow-green-500/30
      focus:ring-green-500/50
    `,
        secondary: `
      bg-gradient-to-r from-amber-500 to-amber-600
      hover:from-amber-600 hover:to-amber-700
      text-white shadow-lg shadow-amber-500/30
      focus:ring-amber-500/50
    `,
        outline: `
      border-2 border-green-600 text-green-700
      hover:bg-green-50
      focus:ring-green-500/50
    `,
        ghost: `
      text-gray-600 hover:bg-gray-100
      focus:ring-gray-500/50
    `,
        danger: `
      bg-gradient-to-r from-red-500 to-red-600
      hover:from-red-600 hover:to-red-700
      text-white shadow-lg shadow-red-500/30
      focus:ring-red-500/50
    `,
    };

    const sizes = {
        sm: 'px-4 py-2 text-sm min-h-[40px]',
        md: 'px-5 py-3 text-base min-h-[48px]',
        lg: 'px-6 py-4 text-lg min-h-[56px]',
        xl: 'px-8 py-5 text-xl min-h-[64px]',
    };

    return (
        <button
            className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
            disabled={disabled || loading}
            {...props}
        >
            {loading ? (
                <span className="animate-spin h-5 w-5 border-2 border-current border-t-transparent rounded-full" />
            ) : (
                <>
                    {icon && iconPosition === 'left' && (
                        <span className="text-2xl">{icon}</span>
                    )}
                    <span>{children}</span>
                    {icon && iconPosition === 'right' && (
                        <span className="text-2xl">{icon}</span>
                    )}
                </>
            )}
        </button>
    );
}
