import React from 'react';

interface BadgeProps {
  variant: 'initial-email' | 'see-email';
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Badge: React.FC<BadgeProps> = ({ 
  variant, 
  children, 
  className = '',
  onClick 
}) => {
  const isClickable = Boolean(onClick);

  return (
    <>
      <span 
        className={`badge badge-${variant} ${isClickable ? 'badge-clickable' : ''} ${className}`}
        onClick={onClick}
      >
        {children}
        {variant === 'see-email' && (
          <svg className="badge-icon" viewBox="0 0 16 16" fill="currentColor">
            <path d="M6.22 8.72a.75.75 0 0 0 1.06 1.06l5.22-5.22v1.69a.75.75 0 0 0 1.5 0V3.75a.75.75 0 0 0-.75-.75H10.75a.75.75 0 0 0 0 1.5h1.69L7.28 9.72a.75.75 0 0 0 0 1.06Z"/>
            <path d="M3.5 2A1.5 1.5 0 0 0 2 3.5v9A1.5 1.5 0 0 0 3.5 14h9a1.5 1.5 0 0 0 1.5-1.5V8.75a.75.75 0 0 0-1.5 0v3.75a.25.25 0 0 1-.25.25h-9a.25.25 0 0 1-.25-.25v-9a.25.25 0 0 1 .25-.25h3.75a.75.75 0 0 0 0-1.5H3.5Z"/>
          </svg>
        )}
      </span>
      <style jsx>{`
        .badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          border-radius: var(--radius-pill);
          font-size: 13px;
          font-weight: 500;
          transition: all var(--duration-normal) var(--easing-default);
        }

        .badge-initial-email {
          background: var(--error-light);
          color: #DC2626;
          border: 1px solid rgba(220, 38, 38, 0.2);
        }

        .badge-see-email {
          background: var(--primary-accent);
          color: white;
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
        }

        .badge-clickable {
          cursor: pointer;
        }

        .badge-see-email.badge-clickable:hover {
          background: var(--primary-accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 6px 16px rgba(14, 165, 233, 0.4);
        }

        .badge-icon {
          width: 14px;
          height: 14px;
          flex-shrink: 0;
        }
      `}</style>
    </>
  );
};