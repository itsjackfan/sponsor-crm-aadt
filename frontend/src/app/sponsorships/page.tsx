'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout, PageHeader, StatsCard, Table } from '@/components/layout';
import { Button, Badge, Select, Modal } from '@/components/ui';
import { Sponsor } from '@/types';
import { NewSponsorModal } from '@/components/modals/NewSponsorModal';
import { ComposeDraftModal } from '@/components/modals/ComposeDraftModal';
import { useAuth } from '@/contexts/AuthContext';

interface SponsorStats {
  totalSponsors: number;
  totalValue: string;
  monetarySponsors: number;
  inKindSponsors: number;
  highPrioritySponsors: number;
  otherStat: string;
  anotherStat: string;
}

const periodOptions = [
  { value: 'fall-25', label: 'Fall \'25' },
  { value: 'spring-25', label: 'Spring \'25' },
  { value: 'fall-24', label: 'Fall \'24' }
];

export default function SponsorshipsPage() {
  const { user, loading: authLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('fall-25');
  const [isNewSponsorModalOpen, setIsNewSponsorModalOpen] = useState(false);
  const [isComposeDraftModalOpen, setIsComposeDraftModalOpen] = useState(false);
  const [selectedSponsor, setSelectedSponsor] = useState<any | null>(null);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [sponsorStats, setSponsorStats] = useState<SponsorStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Guest mode is default (true when no user, false when user is signed in)
  const isGuestMode = !user;

  useEffect(() => {
    loadSponsors();
    loadSponsorStats();
  }, []);

  const loadSponsors = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/sponsors');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load sponsors');
      }
      const data = await response.json();
      setSponsors(data);
    } catch (err) {
      console.error('Error loading sponsors:', err);
      setError(err instanceof Error ? err.message : 'Failed to load sponsors');
      setSponsors([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSponsorStats = async () => {
    try {
      const response = await fetch('/api/sponsor-analytics');
      if (response.ok) {
        const data = await response.json();
        setSponsorStats(data);
      }
    } catch (err) {
      console.error('Error loading sponsor stats:', err);
    }
  };

  const handleSeeEmail = (sponsor: Sponsor) => {
    if (sponsor.emailChain) {
      window.open(sponsor.emailChain, '_blank');
    } else {
      console.log('No email chain available for sponsor:', sponsor.id);
    }
  };

  const handleComposeDraft = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setIsComposeDraftModalOpen(true);
  };

  const handleNewSponsor = async (data: any) => {
    try {
      const response = await fetch('/api/sponsors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create sponsor');
      }

      const newSponsor = await response.json();
      setSponsors(prev => [newSponsor, ...prev]);
      setSponsorStats(prev => prev ? {
        ...prev,
        totalSponsors: prev.totalSponsors + 1
      } : null);
      setIsNewSponsorModalOpen(false);
    } catch (err) {
      console.error('Error creating sponsor:', err);
      setError(err instanceof Error ? err.message : 'Failed to create sponsor');
    }
  };

  const getNextActionInfo = (sponsor: any) => {
    const { actualLastMessageDate, lastMessageFromUser } = sponsor;
    
    // Use actual last message date instead of DB update time
    const now = new Date();
    const lastMessageDate = new Date(actualLastMessageDate);
    const daysSinceLastMessage = (now.getTime() - lastMessageDate.getTime()) / (1000 * 60 * 60 * 24);
    
    // Use actual message direction instead of AI summary
    const userRepliedLast = lastMessageFromUser;

    // Determine action and priority based on your rules
    let actionText = '';
    let urgencyText = '';
    let color = '';

    if (userRepliedLast) {
      if (daysSinceLastMessage <= 2) {
        // I've replied within 2 days → awaiting response (low priority)
        actionText = '⏳ Awaiting Response';
        urgencyText = 'Low Priority';
        color = 'var(--success)';
      } else {
        // I've replied but it's been more than 2 days → bump (medium priority)
        actionText = '↗️ Bump';
        urgencyText = 'Medium';
        color = 'var(--warning)';
      }
    } else {
      if (daysSinceLastMessage <= 2) {
        // They've emailed but it's been less than 2 days → read/respond (medium priority)
        actionText = '✉️ Read/Respond';
        urgencyText = 'Medium';
        color = 'var(--warning)';
      } else {
        // They've emailed and it's been more than 2 days → READ/RESPOND IMMEDIATELY (high priority)
        actionText = '🔥 READ/RESPOND IMMEDIATELY';
        urgencyText = 'High';
        color = 'var(--error)';
      }
    }

    return {
      actionText,
      urgencyText,
      color,
      description: `Last message: ${Math.round(daysSinceLastMessage)} days ago ${userRepliedLast ? '(from you)' : '(from them)'}`,
      daysSinceLastMessage: Math.round(daysSinceLastMessage),
      userRepliedLast,
      lastMessageDate: lastMessageDate.toLocaleDateString()
    };
  };

  // Define responsive columns based on screen size
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Mobile-first column configuration
  const getMobileColumns = () => [
    {
      key: 'sponsor',
      header: 'Sponsor',
      render: (_: any, row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minWidth: '140px' }}>
          <div style={{ 
            fontSize: '14px', 
            fontWeight: 600,
            color: 'var(--text-primary)',
            lineHeight: 1.2
          }}>
            {row.name}
          </div>
          <div style={{ 
            fontSize: '12px', 
            color: 'var(--text-secondary)'
          }}>
            {row.contactName || 'Unknown contact'}
          </div>
          <div style={{ 
            fontSize: '11px', 
            color: 'var(--text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {row.type} • {row.approximateValue}
          </div>
        </div>
      )
    },
    {
      key: 'nextAction',
      header: 'Next Action',
      render: (_: any, row: any) => {
        const actionInfo = getNextActionInfo(row);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '120px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ 
                fontSize: '13px', 
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}>
                {actionInfo.actionText}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 6px',
                backgroundColor: actionInfo.color + '20',
                color: actionInfo.color,
                borderRadius: 'var(--radius-pill)',
                fontSize: '10px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.3px',
                border: `1px solid ${actionInfo.color}40`
              }}>
                {actionInfo.urgencyText}
              </span>
            </div>
            {actionInfo.description !== 'No specific action noted' && (
              <span style={{ 
                fontSize: '11px', 
                color: 'var(--text-tertiary)',
                fontStyle: 'italic',
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                lineHeight: 1.3
              }}>
                {actionInfo.description}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: any) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minWidth: '80px' }}>
          {!isGuestMode && row.emailChain && (
            <Button
              onClick={() => handleSeeEmail(row)}
              style={{
                fontSize: '12px',
                padding: '8px 12px',
                backgroundColor: 'var(--primary-accent)',
                color: 'white',
                borderRadius: 'var(--radius-sm)',
                border: 'none',
                width: '100%'
              }}
            >
              View
            </Button>
          )}
          {!isGuestMode && (
            <Button
              onClick={() => handleComposeDraft(row)}
              style={{
                fontSize: '12px',
                padding: '8px 12px',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                width: '100%'
              }}
            >
              Draft
            </Button>
          )}
          {isGuestMode && (
            <span style={{
              fontSize: '11px',
              color: 'var(--text-tertiary)',
              fontStyle: 'italic',
              textAlign: 'center',
              padding: '8px'
            }}>
              Guest View
            </span>
          )}
        </div>
      )
    }
  ];

  // Desktop columns
  const getDesktopColumns = () => [
    {
      key: 'name',
      header: 'Organization'
    },
    {
      key: 'contactName',
      header: 'Contact',
      render: (contactName: string | undefined) => contactName || 'Unknown'
    },
    {
      key: 'type',
      header: 'Type'
    },
    {
      key: 'approximateValue',
      header: 'Value'
    },
    {
      key: 'nextAction',
      header: 'Next Action',
      render: (_: any, row: any) => {
        const actionInfo = getNextActionInfo(row);
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ 
                fontSize: '13px', 
                fontWeight: 500,
                color: 'var(--text-primary)'
              }}>
                {actionInfo.actionText}
              </span>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                padding: '3px 8px',
                backgroundColor: actionInfo.color + '20',
                color: actionInfo.color,
                borderRadius: 'var(--radius-pill)',
                fontSize: '11px',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                border: `1px solid ${actionInfo.color}40`
              }}>
                {actionInfo.urgencyText}
              </span>
            </div>
            {actionInfo.description !== 'No specific action noted' && (
              <span style={{ 
                fontSize: '11px', 
                color: 'var(--text-tertiary)',
                fontStyle: 'italic',
                maxWidth: '180px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {actionInfo.description}
              </span>
            )}
          </div>
        );
      }
    },
    {
      key: 'lastMessage',
      header: 'Last Message',
      render: (_: any, row: any) => {
        const { lastMessageFromUser, lastMessageSender, lastMessageSnippet, actualLastMessageDate } = row;
        const messageDate = new Date(actualLastMessageDate);
        const now = new Date();
        const daysSince = Math.floor((now.getTime() - messageDate.getTime()) / (1000 * 60 * 60 * 24));
        
        const getTimeDisplay = () => {
          if (daysSince === 0) return 'Today';
          if (daysSince === 1) return 'Yesterday';
          if (daysSince <= 7) return `${daysSince} days ago`;
          return messageDate.toLocaleDateString();
        };

        return (
          <div style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            gap: '2px',
            maxWidth: '200px'
          }}>
            <div style={{
              fontSize: '12px',
              color: lastMessageFromUser ? 'var(--success)' : 'var(--primary-accent)',
              fontWeight: 500
            }}>
              {lastMessageFromUser ? 'You' : lastMessageSender} • {getTimeDisplay()}
            </div>
            <div style={{ 
              fontSize: '13px', 
              color: 'var(--text-secondary)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2
            }}>
              {lastMessageSnippet || 'No content preview'}
            </div>
          </div>
        );
      }
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (_: any, row: any) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          {!isGuestMode && row.emailChain && (
            <Button
              onClick={() => handleSeeEmail(row)}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                backgroundColor: 'var(--primary-accent)',
                color: 'white',
                borderRadius: 'var(--radius-sm)',
                border: 'none'
              }}
            >
              View
            </Button>
          )}
          {!isGuestMode && (
            <Button
              onClick={() => handleComposeDraft(row)}
              style={{
                fontSize: '12px',
                padding: '6px 12px',
                backgroundColor: 'var(--surface)',
                color: 'var(--text-primary)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)'
              }}
            >
              Draft
            </Button>
          )}
          {isGuestMode && (
            <span style={{
              fontSize: '12px',
              color: 'var(--text-tertiary)',
              fontStyle: 'italic'
            }}>
              Guest View
            </span>
          )}
        </div>
      )
    }
  ];

  const columns = isMobile ? getMobileColumns() : getDesktopColumns();

  return (
    <MainLayout>
      <div className="page-header-container">
        <div className="page-header-content">
          <div className="page-header-text">
            <h1 className="page-title">SPONSORSHIPS</h1>
            <p className="page-subtitle">Current and past sponsorships and reference.</p>
          </div>
          <div className="page-header-actions">
            <div className="access-badge">
              {isGuestMode ? '👁️ Guest Mode' : '🔧 Full Access'}
            </div>
            <Select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              options={periodOptions}
              className="period-select"
            />
          </div>
        </div>
      </div>

      {error && (
        <div 
          className="error-message"
          style={{ 
            padding: '16px',
            marginBottom: '24px',
            backgroundColor: 'var(--error-light)',
            border: '1px solid var(--error)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--error)'
          }}
        >
          {error}
        </div>
      )}

      <div className={`stats-grid ${isMobile ? 'stats-grid-mobile' : ''}`}>
        <StatsCard 
          title="# OF SPONSORS" 
          value={sponsorStats?.totalSponsors.toString() || "0"} 
        />
        <StatsCard 
          title="TOTAL VALUE" 
          value={sponsorStats?.totalValue || "$0"} 
        />
        <StatsCard 
          title="CORPORATE" 
          value={sponsorStats?.monetarySponsors.toString() || "0"} 
        />
        <StatsCard 
          title="IN-KIND" 
          value={sponsorStats?.inKindSponsors.toString() || "0"} 
        />
      </div>

      {loading ? (
        <div className="loading-container" style={{ 
          textAlign: 'center', 
          padding: '48px',
          color: 'var(--text-secondary)'
        }}>
          <div style={{
            width: '32px',
            height: '32px',
            border: '3px solid var(--border)',
            borderTop: '3px solid var(--primary-accent)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          Loading sponsors...
        </div>
      ) : (
        <Table columns={columns} data={sponsors} />
      )}

      {!loading && sponsors.length === 0 && !error && (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          color: 'var(--text-secondary)'
        }}>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>No sponsors found</p>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
            Run the email collector script to import sponsors from Gmail, or add sponsors manually.
          </p>
        </div>
      )}

      {!isGuestMode && (
        <div className="add-sponsor-section">
          <Button
            variant="secondary"
            onClick={() => setIsNewSponsorModalOpen(true)}
          >
            <span className="plus-icon">+</span>
            Add new sponsor manually
          </Button>
        </div>
      )}

      {isGuestMode && (
        <div className="guest-mode-notice">
          <div className="guest-mode-content">
            <p className="guest-mode-title">
              👁️ Guest Mode Active
            </p>
            <p className="guest-mode-description">
              View-only mode. Gmail integration features are disabled.
            </p>
          </div>
        </div>
      )}

      <NewSponsorModal
        isOpen={isNewSponsorModalOpen}
        onClose={() => setIsNewSponsorModalOpen(false)}
        onSubmit={handleNewSponsor}
      />

      <ComposeDraftModal
        isOpen={isComposeDraftModalOpen}
        onClose={() => setIsComposeDraftModalOpen(false)}
        sponsor={selectedSponsor}
      />

      <style jsx>{`
        .page-header-container {
          margin-bottom: 48px;
        }
        
        .page-header-content {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 24px;
        }
        
        .page-header-text {
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
        
        .page-header-actions {
          display: flex;
          gap: 16px;
          align-items: center;
          flex-shrink: 0;
        }
        
        .access-badge {
          font-size: 14px;
          padding: 12px 20px;
          background: ${isGuestMode ? 'var(--warning)' : 'var(--success)'};
          color: white;
          border-radius: var(--radius-button);
          font-weight: 600;
          white-space: nowrap;
          box-shadow: var(--shadow-sm);
        }
        
        :global(.period-select) {
          min-width: 140px;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--grid-gap);
          margin-bottom: 48px;
        }

        .stats-grid-mobile {
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-bottom: 32px;
        }

        .add-sponsor-section {
          display: flex;
          justify-content: center;
          margin-top: 40px;
        }

        .plus-icon {
          font-size: 16px;
          font-weight: bold;
        }
        
        .guest-mode-notice {
          margin-top: 32px;
          display: flex;
          justify-content: center;
        }
        
        .guest-mode-content {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(245, 158, 11, 0.3);
          border-radius: var(--radius-lg);
          padding: 24px 32px;
          text-align: center;
          box-shadow: var(--shadow-sm);
          max-width: 400px;
        }
        
        .guest-mode-title {
          color: var(--warning);
          fontSize: 16px;
          font-weight: 600;
          margin: 0 0 8px 0;
        }
        
        .guest-mode-description {
          color: var(--text-secondary);
          fontSize: 14px;
          margin: 0;
          line-height: 1.5;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Mobile breakpoints */
        @media (max-width: 767px) {
          .page-header-content {
            flex-direction: column;
            gap: 20px;
          }
          
          .page-title {
            font-size: 40px;
          }
          
          .page-subtitle {
            font-size: 16px;
          }
          
          .page-header-actions {
            width: 100%;
            flex-direction: column;
            gap: 12px;
          }
          
          .access-badge {
            width: 100%;
            text-align: center;
          }
          
          :global(.period-select) {
            width: 100%;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          
          .add-sponsor-section {
            margin-top: 24px;
          }
          
          .loading-container {
            padding: 24px !important;
          }
          
          /* Ensure table is horizontally scrollable on mobile */
          :global(.table-container) {
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
          }
          
          :global(.table-wrapper) {
            min-width: fit-content;
          }
        }

        /* Tablet breakpoint */
        @media (max-width: 1024px) and (min-width: 768px) {
          .page-title {
            font-size: 48px;
          }
          
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
            gap: 20px;
          }
        }
      `}</style>
    </MainLayout>
  );
}