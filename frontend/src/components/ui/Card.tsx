import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  accent?: boolean;
}

export const Card: React.FC<CardProps> = ({
  padding = 'md',
  accent = false,
  className = '',
  style,
  children,
  ...props
}) => {
  const paddingStyles: Record<string, React.CSSProperties> = {
    none: { padding: 0 },
    sm: { padding: '16px 20px' },
    md: { padding: '24px 28px' },
    lg: { padding: '32px 36px' },
  };

  const accentStyle: React.CSSProperties = accent
    ? {
        background: 'var(--brand-primary)',
        color: 'var(--brand-primary-text)',
        borderColor: 'var(--brand-primary)',
      }
    : {};

  return (
    <div
      className={`card ${className}`.trim()}
      style={{
        ...paddingStyles[padding],
        ...accentStyle,
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  );
};

