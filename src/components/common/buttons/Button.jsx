import React from 'react';
import { FiLoader } from 'react-icons/fi';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  isDisabled = false,
  icon: Icon = null,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  type = 'button',
  onClick,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] shadow-sm';

  const variants = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white focus:ring-primary-500 shadow-primary-600/20 shadow-md',
    secondary: 'bg-slate-900 hover:bg-slate-800 text-white focus:ring-slate-700',
    outline: 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 focus:ring-primary-500',
    ghost: 'bg-transparent hover:bg-slate-100 text-slate-600 focus:ring-slate-400 shadow-none',
    danger: 'bg-rose-600 hover:bg-rose-700 text-white focus:ring-rose-500 shadow-rose-600/20 shadow-md',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs gap-1.5',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'px-6 py-3 text-base gap-2.5',
  };

  return (
    <button
      type={type}
      disabled={isDisabled || isLoading}
      onClick={onClick}
      className={twMerge(
        clsx(
          baseStyles,
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )
      )}
      {...props}
    >
      {isLoading ? (
        <FiLoader className="animate-spin text-current text-lg" />
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="text-lg" />}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && <Icon className="text-lg" />}
        </>
      )}
    </button>
  );
};
