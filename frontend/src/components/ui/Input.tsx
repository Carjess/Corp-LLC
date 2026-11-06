import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, icon, id, className = '', ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
        {label && (
          <label htmlFor={inputId} className="form-label">
            {label}
          </label>
        )}
        <div style={{ position: 'relative', width: '100%' }}>
          {icon && (
            <span
              style={{
                position: 'absolute',
                left: 14,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                pointerEvents: 'none',
                display: 'inline-flex',
                alignItems: 'center',
              }}
            >
              {icon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`form-input ${className}`.trim()}
            style={{
              paddingLeft: icon ? 42 : 16,
              borderColor: error ? 'var(--status-danger-text)' : undefined,
            }}
            {...props}
          />
        </div>
        {error ? (
          <span style={{ fontSize: 12, color: 'var(--status-danger-text)', marginLeft: 4 }}>
            {error}
          </span>
        ) : helperText ? (
          <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 4 }}>
            {helperText}
          </span>
        ) : null}
      </div>
    );
  },
);

Input.displayName = 'Input';

