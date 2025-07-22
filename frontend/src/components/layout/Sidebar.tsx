'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

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
  },
  // Commented out - Gmail Demo functionality integrated into Sponsorships page
  // {
  //   title: 'INTEGRATIONS',
  //   items: [
  //     { href: '/gmail-demo', label: 'Gmail Demo' }
  //   ]
  // }
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut, signIn } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const handleSignIn = () => {
    router.push('/auth/signin');
  };

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
        
        <div className="sidebar-section sidebar-footer">
          {user ? (
            <>
              <div className="user-info">
                <div className="user-avatar">
                  {user.user_metadata?.avatar_url ? (
                    <img 
                      src={user.user_metadata.avatar_url} 
                      alt={user.user_metadata?.full_name || 'User'} 
                      className="avatar-img"
                    />
                  ) : (
                    <div className="avatar-placeholder">
                      {user.user_metadata?.full_name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                <div className="user-details">
                  <p className="user-name">
                    {user.user_metadata?.full_name || 'User'}
                  </p>
                  <p className="user-email">
                    {user.email}
                  </p>
                </div>
              </div>
              <button onClick={handleSignOut} className="auth-btn sign-out-btn">
                Sign Out
              </button>
            </>
          ) : (
            <>
              <div className="guest-info">
                <div className="guest-avatar">
                  <div className="avatar-placeholder guest-avatar-placeholder">
                    👁️
                  </div>
                </div>
                <div className="user-details">
                  <p className="user-name">
                    Guest Mode
                  </p>
                  <p className="user-email">
                    View-only access
                  </p>
                </div>
              </div>
              <button onClick={handleSignIn} className="auth-btn sign-in-btn">
                Sign In
              </button>
            </>
          )}
        </div>
      </aside>
      <style jsx>{`
        .sidebar {
          position: fixed;
          top: 0;
          left: 0;
          height: 100vh;
          width: var(--sidebar-width);
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border-right: 1px solid rgba(226, 232, 240, 0.8);
          padding: 32px 20px;
          z-index: 100;
          box-shadow: 0 8px 32px rgba(15, 23, 42, 0.12), 0 1px 3px rgba(15, 23, 42, 0.08);
          overflow-y: auto;
        }

        /* Mobile sidebar responsiveness */
        @media (max-width: 767px) {
          .sidebar {
            width: 100%;
            transform: translateX(-100%);
            transition: transform 0.3s ease-in-out;
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(16px);
          }
          
          .sidebar.mobile-open {
            transform: translateX(0);
          }
          
          .sidebar {
            padding: 24px 16px;
          }
          
          .section-title {
            padding: 0 6px;
            font-size: 12px;
          }
          
          .section-title::before {
            left: -2px;
            font-size: 11px;
          }
          
          .nav-item {
            padding: 12px 12px 12px 32px;
            font-size: 14px;
            margin: 2px 0;
          }
          
          .nav-item::before {
            left: 12px;
            font-size: 12px;
          }
          
          .sidebar-footer {
            padding: 20px 16px;
          }
        }

        .sidebar-section {
          margin-bottom: 32px;
          padding: 0;
        }
        
        .sidebar-section:first-child {
          margin-top: 0;
        }
        
        .sidebar-section:last-child {
          margin-bottom: 0;
        }

        .section-title {
          font-size: 13px;
          font-weight: 600;
          color: var(--text-secondary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 16px;
          padding: 0 8px;
          display: block;
          position: relative;
        }
        
        .section-title::before {
          content: '▸';
          position: absolute;
          left: -4px;
          color: var(--primary-accent);
          font-size: 12px;
          font-weight: normal;
        }

        .nav-list {
          display: flex;
          flex-direction: column;
        }

        .nav-item {
          display: block;
          padding: 12px 16px 12px 36px;
          font-size: 15px;
          font-weight: 500;
          color: var(--text-secondary);
          text-decoration: none;
          margin: 2px 0;
          transition: all var(--duration-normal) var(--easing-default);
          position: relative;
          border-radius: 0 12px 12px 0;
        }
        
        .nav-item::before {
          content: '├─';
          position: absolute;
          left: 16px;
          color: var(--text-muted);
          font-size: 13px;
          font-family: monospace;
          line-height: 1;
        }
        
        .nav-item:last-child::before {
          content: '└─';
        }

        .nav-item:hover {
          color: var(--text-primary);
          background: rgba(14, 165, 233, 0.06);
        }
        
        .nav-item:hover::before {
          color: var(--primary-accent);
        }

        .nav-item-active {
          color: var(--primary-accent);
          background: rgba(14, 165, 233, 0.1);
          font-weight: 600;
        }
        
        .nav-item-active::before {
          color: var(--primary-accent);
          font-weight: bold;
        }
        
        .nav-item-active:hover {
          color: var(--primary-accent);
          background: rgba(14, 165, 233, 0.15);
        }

        .sidebar-footer {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          padding: 24px 20px;
          border-top: 1px solid rgba(241, 245, 249, 0.8);
          background: rgba(248, 250, 252, 0.9);
          backdrop-filter: blur(8px);
        }

        .user-info,
        .guest-info {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 16px;
        }

        .user-avatar,
        .guest-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          overflow: hidden;
          flex-shrink: 0;
        }

        .avatar-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .avatar-placeholder {
          width: 100%;
          height: 100%;
          background: var(--primary-accent);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 600;
          font-size: 16px;
        }

        .guest-avatar-placeholder {
          background: var(--warning);
          font-size: 18px;
        }

        .user-details {
          flex: 1;
          min-width: 0;
        }

        .user-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--text-primary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .user-email {
          font-size: 12px;
          color: var(--text-secondary);
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .auth-btn {
          width: 100%;
          padding: 8px 16px;
          border: 1px solid var(--border);
          border-radius: var(--radius-input);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          transition: all var(--duration-normal) var(--easing-default);
        }

        .sign-out-btn {
          background: transparent;
          color: var(--text-secondary);
        }

        .sign-out-btn:hover {
          background: var(--error-light);
          border-color: var(--error);
          color: var(--error);
        }

        .sign-in-btn {
          background: var(--primary-accent);
          color: white;
          border-color: var(--primary-accent);
        }

        .sign-in-btn:hover {
          background: var(--primary-accent-hover);
          border-color: var(--primary-accent-hover);
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(14, 165, 233, 0.3);
        }
      `}</style>
    </>
  );
};