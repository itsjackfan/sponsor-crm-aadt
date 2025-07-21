'use client';

import React from 'react';
import { MainLayout, PageHeader } from '@/components/layout';

export default function DiscoveryPage() {
  return (
    <MainLayout>
      <PageHeader
        title="DISCOVERY"
        subtitle="Discover and track potential new sponsors."
      />
      
      <div className="coming-soon">
        <p>Discovery features coming soon...</p>
      </div>

      <style jsx>{`
        .coming-soon {
          display: flex;
          justify-content: center;
          align-items: center;
          height: 300px;
          background: var(--surface-glass);
          backdrop-filter: blur(12px);
          border-radius: var(--radius-card);
          border: 1px solid rgba(226, 232, 240, 0.8);
          box-shadow: var(--shadow-glass);
        }

        .coming-soon p {
          font-size: 18px;
          color: var(--text-secondary);
          margin: 0;
        }
      `}</style>
    </MainLayout>
  );
}