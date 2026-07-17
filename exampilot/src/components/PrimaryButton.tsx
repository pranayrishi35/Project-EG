import React from 'react';

type PrimaryButtonProps = {
  children: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  disabled?: boolean;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
};

export default function PrimaryButton({
  children,
  onClick,
  disabled = false,
  className = '',
  type = 'button',
}: PrimaryButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`
        min-w-[44px] min-h-[44px] inline-flex items-center justify-center
        rounded-xl bg-indigo-600 text-white font-bold
        hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500
        active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        ${className}`}
    >
      {children}
    </button>
  );
}
