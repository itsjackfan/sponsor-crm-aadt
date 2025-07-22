import React from 'react';
import { Sidebar } from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <>
      <div className="layout">
        <Sidebar />
        <main className="main-content">
          {children}
        </main>
      </div>
      <style jsx>{`
        .layout {
          min-height: 100vh;
          background: var(--background);
          display: flex;
          flex-direction: row;
        }

        .main-content {
          margin-left: var(--sidebar-width);
          padding: var(--container-padding);
          max-width: calc(100% - var(--sidebar-width));
          min-height: 100vh;
          flex: 1;
          overflow-x: hidden;
          background: var(--background);
        }

        /* Mobile responsiveness */
        @media (max-width: 767px) {
          .layout {
            flex-direction: column;
          }
          
          .main-content {
            margin-left: 0;
            padding: 20px;
            max-width: 100%;
            width: 100%;
          }
        }

        /* Tablet responsiveness */
        @media (max-width: 1024px) and (min-width: 768px) {
          .main-content {
            padding: 32px;
          }
        }
        
        /* Large screens - more generous padding */
        @media (min-width: 1440px) {
          .main-content {
            padding: 48px;
          }
        }
      `}</style>
    </>
  );
};