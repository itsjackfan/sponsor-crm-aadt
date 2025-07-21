import React from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  children?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ 
  title, 
  subtitle, 
  children,
  className = '' 
}) => {
  return (
    <>
      <header className={`page-header ${className}`}>
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">{title}</h1>
            <p className="page-subtitle">{subtitle}</p>
          </div>
          {children && (
            <div className="header-actions">
              {children}
            </div>
          )}
        </div>
      </header>
      <style jsx>{`
        .page-header {
          margin-bottom: 48px;
        }

        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
        }

        .header-text {
          flex: 1;
        }

        .page-title {
          font-size: 56px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.1;
          letter-spacing: -0.025em;
          margin: 0 0 8px 0;
        }

        .page-subtitle {
          font-size: 18px;
          font-weight: 400;
          color: var(--text-secondary);
          line-height: 1.5;
          margin: 0;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-left: 32px;
        }
      `}</style>
    </>
  );
};