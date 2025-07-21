import React from 'react';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

export const Checkbox: React.FC<CheckboxProps> = ({ 
  label, 
  className = '',
  ...props 
}) => {
  return (
    <>
      <label className={`checkbox-wrapper ${className}`}>
        <input 
          type="checkbox" 
          className="checkbox-input" 
          {...props} 
        />
        <span className="checkbox-custom"></span>
        {label && <span className="checkbox-label">{label}</span>}
      </label>
      <style jsx>{`
        .checkbox-wrapper {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
          user-select: none;
        }

        .checkbox-input {
          display: none;
        }

        .checkbox-custom {
          width: 20px;
          height: 20px;
          border-radius: var(--radius-sm);
          border: 2px solid var(--text-muted);
          background: var(--surface);
          transition: all var(--duration-normal) var(--easing-default);
          position: relative;
          flex-shrink: 0;
        }

        .checkbox-custom::after {
          content: '';
          position: absolute;
          top: 2px;
          left: 5px;
          width: 6px;
          height: 10px;
          border: solid white;
          border-width: 0 2px 2px 0;
          transform: rotate(45deg);
          opacity: 0;
          transition: opacity var(--duration-normal) var(--easing-default);
        }

        .checkbox-input:checked + .checkbox-custom {
          background: var(--primary-accent);
          border-color: var(--primary-accent);
          box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.1);
        }

        .checkbox-input:checked + .checkbox-custom::after {
          opacity: 1;
        }

        .checkbox-wrapper:hover .checkbox-custom {
          border-color: var(--primary-accent);
        }

        .checkbox-label {
          font-size: 15px;
          color: var(--text-primary);
          line-height: 1.4;
        }
      `}</style>
    </>
  );
};