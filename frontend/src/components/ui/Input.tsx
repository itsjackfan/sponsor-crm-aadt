import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ 
  label, 
  error, 
  className = '',
  ...props 
}) => {
  return (
    <>
      <div className={`input-group ${className}`}>
        {label && <label className="input-label">{label}</label>}
        <input 
          className={`input ${error ? 'input-error' : ''}`} 
          {...props} 
        />
        {error && <span className="input-error-text">{error}</span>}
      </div>
      <style jsx>{`
        .input-group {
          display: flex;
          flex-direction: column;
        }

        .input-label {
          font-size: 15px;
          font-weight: 500;
          color: var(--text-primary);
          margin-bottom: 8px;
          display: block;
        }

        .input {
          width: 100%;
          padding: 14px 18px;
          border: 1px solid var(--border);
          border-radius: var(--radius-input);
          font-size: 15px;
          color: var(--text-primary);
          background: var(--glass-white);
          backdrop-filter: blur(8px);
          transition: all var(--duration-normal) var(--easing-default);
          font-family: var(--font-primary);
        }

        .input::placeholder {
          color: var(--text-tertiary);
          font-weight: 400;
        }

        .input:focus {
          border-color: var(--primary-accent);
          outline: none;
          background: var(--surface);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }

        .input:hover {
          border-color: var(--text-muted);
        }

        .input-error {
          border-color: var(--error);
        }

        .input-error:focus {
          border-color: var(--error);
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .input-error-text {
          color: var(--error);
          font-size: 13px;
          margin-top: 4px;
        }
      `}</style>
    </>
  );
};