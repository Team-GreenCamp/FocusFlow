import React from 'react';

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export default function Skeleton({
  className = '',
  variant = 'rectangular',
}: SkeletonProps) {
  const variantClasses = {
    text: 'h-4 w-full rounded-lg',
    circular: 'rounded-full',
    rectangular: 'rounded-2xl',
  };

  return (
    <div
      className={`animate-pulse bg-border-color/60 ${variantClasses[variant]} ${className}`}
    />
  );
}
