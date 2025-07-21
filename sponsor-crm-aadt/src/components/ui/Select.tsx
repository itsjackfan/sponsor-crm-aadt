import React from 'react';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({ 
  label, 
  options, 
  placeholder,
  error,
  className = '',
  ...props 
}) => {
  return (
    <>
      <div className={`select-group ${className}`}>
        {label && <label className="select-label">{label}</label>}
        <select 
          className={`select ${error ? 'select-error' : ''}`} 
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <span className="select-error-text">{error}</span>}
      </div>
      <style jsx>{`
        .select-group {
          display: flex;
          flex-direction: column;
        }

        .select-label {
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 8px;
          display: block;
        }

        .select {
          width: 100%;
          padding: 14px 18px;
          border: 1px solid var(--border);
          border-radius: var(--radius-input);
          font-size: 15px;
          color: var(--text-primary);
          background: var(--glass-white);
          backdrop-filter: blur(8px);
          cursor: pointer;
          appearance: none;
          transition: all var(--duration-normal) var(--easing-default);
          font-family: var(--font-primary);
          background-image: url('data:image/svg+xml;charset=US-ASCII,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="%2364748B"><path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"/></svg>');
          background-repeat: no-repeat;
          background-position: right 14px center;
          background-size: 16px;
        }

        .select:focus {
          border-color: var(--primary-accent);
          outline: none;
          background-color: var(--surface);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }

        .select:hover {
          border-color: var(--text-muted);
        }

        .select-error {
          border-color: var(--error);
        }

        .select-error:focus {
          border-color: var(--error);
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .select-error-text {
          color: var(--error);
          font-size: 13px;
          margin-top: 4px;
        }
      `}</style>
    </>
  );
};