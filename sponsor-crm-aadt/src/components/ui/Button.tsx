import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md',
  children, 
  className = '',
  ...props 
}) => {
  const classes = [
    'btn',
    `btn-${variant}`,
    `btn-${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <>
      <button className={classes} {...props}>
        {children}
      </button>
      <style jsx>{`
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          transition: all var(--duration-normal) var(--easing-default);
          text-decoration: none;
          font-family: var(--font-primary);
        }

        .btn-sm {
          padding: 10px 16px;
          font-size: 14px;
        }

        .btn-md {
          padding: 14px 28px;
          font-size: 15px;
        }

        .btn-lg {
          padding: 16px 40px;
          font-size: 15px;
        }

        .btn-primary {
          background: var(--primary-accent);
          color: white;
          border-radius: var(--radius-button);
          box-shadow: var(--shadow-blue);
        }

        .btn-primary:hover {
          background: var(--primary-accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 12px 32px rgba(14, 165, 233, 0.2), 0 4px 12px rgba(14, 165, 233, 0.15);
        }

        .btn-primary:active {
          transform: translateY(0px);
        }

        .btn-secondary {
          background: var(--glass-white);
          backdrop-filter: blur(8px);
          color: var(--text-secondary);
          border: 1px solid var(--border);
          border-radius: 10px;
        }

        .btn-secondary:hover {
          background: var(--surface);
          color: var(--text-primary);
          border-color: var(--primary-accent);
        }

        .btn-ghost {
          background: transparent;
          color: var(--text-secondary);
          border-radius: 8px;
        }

        .btn-ghost:hover {
          background: rgba(14, 165, 233, 0.05);
          color: var(--primary-accent);
        }
      `}</style>
    </>
  );
};