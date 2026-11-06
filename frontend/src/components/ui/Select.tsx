import React from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options?: SelectOption[];
  error?: string;
  helperText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, error, helperText, id, className = '', children, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
        {label && (
          <label htmlFor={selectId} className="form-label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`form-input ${className}`.trim()}
          style={{
            cursor: 'pointer',
            borderColor: error ? 'var(--status-danger-text)' : undefined,
          }}
          {...props}
        >
          {options
            ? options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))
            : children}
        </select>
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

Select.displayName = 'Select';

