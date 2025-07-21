'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface SidebarItem {
  href: string;
  label: string;
}

interface SidebarSection {
  title: string;
  items: SidebarItem[];
}

const sidebarData: SidebarSection[] = [
  {
    title: 'EXISTING SPONSORS',
    items: [
      { href: '/sponsorships', label: 'Sponsorships' },
      { href: '/fulfillments', label: 'Fulfillments' }
    ]
  },
  {
    title: 'NEW SPONSORS',
    items: [
      { href: '/discovery', label: 'Discovery' }
    ]
  }
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <>
      <aside className="sidebar">
        {sidebarData.map((section, index) => (
          <div key={index} className="sidebar-section">
            <h3 className="section-title">{section.title}</h3>
            <nav className="nav-list">
              {section.items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`nav-item ${pathname === item.href ? 'nav-item-active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        ))}
      </aside>
      <style jsx>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: var(--sidebar-width);
          background: var(--glass-white);
          backdrop-filter: blur(12px);
          border-right: 1px solid var(--border);
          padding: 32px 0;
          z-index: 100;
        }

        .sidebar-section {
          margin-bottom: 40px;
        }

        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 20px;
          padding-left: 24px;
        }

        .nav-list {
          display: flex;
          flex-direction: column;
        }

        .nav-item {
          display: block;
          padding: 12px 24px;
          font-size: 15px;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          border-left: 3px solid transparent;
          margin: 2px 0;
          transition: all var(--duration-normal) var(--easing-default);
        }

        .nav-item:hover {
          color: var(--text-primary);
          background: rgba(14, 165, 233, 0.05);
          border-left-color: rgba(14, 165, 233, 0.3);
        }

        .nav-item-active {
          color: var(--primary-accent);
          background: rgba(14, 165, 233, 0.1);
          border-left-color: var(--primary-accent);
          font-weight: 600;
        }
      `}</style>
    </>
  );
};