import React from 'react';

export type PillVariant = 'success' | 'warning' | 'info' | 'danger' | 'pending' | 'tag';

export interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: PillVariant;
  dot?: boolean;
}

export const Pill: React.FC<PillProps> = ({
  variant = 'pending',
  dot = false,
  className = '',
  children,
  ...props
}) => {
  const variantClass: Record<PillVariant, string> = {
    success: 'pill-success',
    warning: 'pill-warning',
    info: 'pill-info',
    danger: 'pill-danger',
    pending: 'pill-pending',
    tag: 'pill-tag',
  };

  return (
    <span className={`pill ${variantClass[variant]} ${className}`.trim()} {...props}>
      {dot && (
        <span
          style={{
            display: 'inline-block',
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: 'currentColor',
            marginRight: 6,
          }}
        />
      )}
      {children}
    </span>
  );
};

