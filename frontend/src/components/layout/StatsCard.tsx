import React from 'react';

interface StatsCardProps {
  title: string;
  value: string | number;
  className?: string;
}

export const StatsCard: React.FC<StatsCardProps> = ({ 
  title, 
  value, 
  className = '' 
}) => {
  return (
    <>
      <div className={`stats-card ${className}`}>
        <h3 className="stats-title">{title}</h3>
        <div className="stats-value">{value}</div>
      </div>
      <style jsx>{`
        .stats-card {
          background: var(--surface-glass);
          backdrop-filter: blur(12px);
          border-radius: var(--radius-card);
          padding: var(--card-padding);
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: var(--shadow-glass);
          text-align: center;
          transition: all var(--duration-slow) var(--easing-default);
        }

        .stats-card:hover {
          background: var(--surface-hover);
          transform: translateY(-2px);
          box-shadow: var(--shadow-glass-hover);
        }

        .stats-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin: 0 0 20px 0;
        }

        .stats-value {
          font-size: 40px;
          font-weight: 700;
          color: var(--text-primary);
          line-height: 1.1;
          letter-spacing: -0.025em;
          margin: 0;
        }
      `}</style>
    </>
  );
};