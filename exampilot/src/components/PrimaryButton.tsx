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
      className={`ep-btn-primary ${className}`}
    >
      {children}
    </button>
  );
}
