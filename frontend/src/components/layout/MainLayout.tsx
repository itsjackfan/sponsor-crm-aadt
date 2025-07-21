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
        }

        .main-content {
          margin-left: var(--sidebar-width);
          padding: var(--container-padding);
          max-width: calc(100% - var(--sidebar-width));
          min-height: 100vh;
        }
      `}</style>
    </>
  );
};