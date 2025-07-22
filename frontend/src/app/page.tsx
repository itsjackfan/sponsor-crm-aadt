'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

export default function Home() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    
    // Always redirect to sponsorships dashboard (works for both guest and authenticated users)
    router.push('/sponsorships');
  }, [loading, router]);

  return (
    <div className="loading-container">
      <div className="loading-card">
        <div className="loading-spinner" />
        <p className="loading-text">Loading...</p>
      </div>
      
      <style jsx>{`
        .loading-container {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--background);
          padding: 20px;
        }
        
        .loading-card {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: var(--radius-card);
          padding: 48px;
          text-align: center;
          box-shadow: var(--shadow-glass);
          transition: all var(--duration-slow) var(--easing-default);
        }
        
        .loading-card:hover {
          background: rgba(255, 255, 255, 0.95);
          transform: translateY(-2px);
          box-shadow: var(--shadow-glass-hover);
        }
        
        .loading-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(226, 232, 240, 0.3);
          border-top-color: var(--primary-accent);
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto 24px;
        }
        
        .loading-text {
          margin: 0;
          color: var(--text-secondary);
          font-size: 16px;
          font-weight: 500;
        }
        
        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </div>
  );
}
