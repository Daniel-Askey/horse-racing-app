
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'default' | 'inner';
}

export const Card: React.FC<CardProps> = ({ children, className = '', variant = 'default' }) => {
  const baseClasses = "rounded-xl";
  const variantClasses = {
      default: "bg-gray-800/60 border border-gray-700 shadow-lg p-4 md:p-6",
      inner: "bg-gray-800/70 border border-gray-700/50 p-4"
  }
  
  return (
    <div className={`${baseClasses} ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};
