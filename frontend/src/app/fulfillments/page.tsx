'use client';

import React, { useState, useEffect } from 'react';
import { MainLayout, PageHeader, Table } from '@/components/layout';
import { Button, Select, Checkbox } from '@/components/ui';
import { Fulfillment } from '@/types';

interface FulfillmentTask {
  id: string;
  thread_id: string;
  title: string;
  description: string | null;
  task_type: string;
  priority: 'high' | 'medium' | 'low';
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  assigned_to: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  email_threads: {
    subject: string;
    sponsor_org_name: string;
    sponsor_poc_name: string;
  } | null;
}

const periodOptions = [
  { value: 'fall-25', label: 'Fall \'25' },
  { value: 'spring-25', label: 'Spring \'25' },
  { value: 'fall-24', label: 'Fall \'24' }
];

export default function FulfillmentsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('fall-25');
  const [fulfillmentTasks, setFulfillmentTasks] = useState<FulfillmentTask[]>([]);
  const [showCompleted, setShowCompleted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFulfillmentTasks();
  }, []);

  const loadFulfillmentTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/fulfillment-tasks');
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to load fulfillment tasks');
      }
      const data = await response.json();
      setFulfillmentTasks(data);
    } catch (err) {
      console.error('Error loading fulfillment tasks:', err);
      setError(err instanceof Error ? err.message : 'Failed to load fulfillment tasks');
      setFulfillmentTasks([]);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFulfillment = async (fulfillmentId: string) => {
    try {
      const task = fulfillmentTasks.find(t => t.id === fulfillmentId);
      if (!task) return;

      const response = await fetch(`/api/fulfillment-tasks/${fulfillmentId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          completed: !task.completed,
          completed_at: !task.completed ? new Date().toISOString() : null
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      const updatedTask = await response.json();
      setFulfillmentTasks(prev =>
        prev.map(fulfillment =>
          fulfillment.id === fulfillmentId ? updatedTask : fulfillment
        )
      );
    } catch (err) {
      console.error('Error updating fulfillment task:', err);
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const filteredFulfillmentTasks = showCompleted 
    ? fulfillmentTasks 
    : fulfillmentTasks.filter(f => !f.completed);

  const columns = [
    {
      key: 'completed',
      header: '',
      render: (_: any, row: FulfillmentTask) => (
        <Checkbox
          checked={row.completed}
          onChange={() => handleToggleFulfillment(row.id)}
        />
      )
    },
    {
      key: 'sponsorName',
      header: 'Sponsor',
      render: (_: any, row: FulfillmentTask) => (
        row.email_threads?.sponsor_org_name || 'Unknown Sponsor'
      )
    },
    {
      key: 'title',
      header: 'Task'
    },
    {
      key: 'description',
      header: 'Description'
    },
    {
      key: 'due_date',
      header: 'Due Date',
      render: (dueDate: string | null) => dueDate ? formatDate(dueDate) : 'No deadline'
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (priority: string) => (
        <span style={{ 
          color: priority === 'high' ? 'var(--error)' : 
                 priority === 'medium' ? 'var(--warning)' : 'var(--success)',
          fontWeight: 500,
          textTransform: 'capitalize'
        }}>
          {priority}
        </span>
      )
    }
  ];

  return (
    <MainLayout>
      <div className="page-header-container">
        <div className="page-header-content">
          <div className="page-header-text">
            <h1 className="page-title">FULFILLMENTS</h1>
            <p className="page-subtitle">What we need to do to fulfill sponsorships, etc.</p>
          </div>
          <div className="page-header-actions">
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
          Loading fulfillment tasks...
        </div>
      ) : (
        <Table columns={columns} data={filteredFulfillmentTasks} />
      )}

      {!loading && filteredFulfillmentTasks.length === 0 && !error && (
        <div style={{
          textAlign: 'center',
          padding: '48px',
          color: 'var(--text-secondary)'
        }}>
          <p style={{ fontSize: '18px', marginBottom: '8px' }}>No fulfillment tasks found</p>
          <p style={{ fontSize: '14px', color: 'var(--text-tertiary)' }}>
            {showCompleted ? 'No completed tasks found.' : 'No pending tasks found. Create tasks or toggle to view completed ones.'}
          </p>
        </div>
      )}

      <div className="controls-section">
        <Button
          variant="secondary"
          className="add-stuff-button"
        >
          <span className="plus-icon">+</span>
          Add new stuff...
        </Button>

        <div className="show-completed-section">
          <Button
            variant="ghost"
            onClick={() => setShowCompleted(!showCompleted)}
            className="show-completed-button"
          >
            Show completed
            <svg 
              className={`dropdown-icon ${showCompleted ? 'rotated' : ''}`} 
              viewBox="0 0 16 16" 
              fill="currentColor"
            >
              <path d="M4.22 6.22a.75.75 0 0 1 1.06 0L8 8.94l2.72-2.72a.75.75 0 1 1 1.06 1.06l-3.25 3.25a.75.75 0 0 1-1.06 0L4.22 7.28a.75.75 0 0 1 0-1.06Z"/>
            </svg>
          </Button>
        </div>
      </div>

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
          align-items: center;
          flex-shrink: 0;
        }
        
        :global(.period-select) {
          min-width: 140px;
        }

        .controls-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 40px;
          padding: 32px;
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(226, 232, 240, 0.8);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-glass);
        }

        .add-stuff-button {
          margin: 0;
        }

        .plus-icon {
          font-size: 16px;
          font-weight: bold;
        }

        .show-completed-section {
          display: flex;
          align-items: center;
        }

        .show-completed-button {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px 16px;
          background: transparent;
          border: 1px solid var(--border);
          border-radius: var(--radius-button);
          transition: all var(--duration-normal) var(--easing-default);
        }
        
        .show-completed-button:hover {
          background: rgba(14, 165, 233, 0.05);
          border-color: var(--primary-accent);
          color: var(--primary-accent);
        }

        .dropdown-icon {
          width: 14px;
          height: 14px;
          transition: transform var(--duration-normal) var(--easing-default);
        }

        .dropdown-icon.rotated {
          transform: rotate(180deg);
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
          }
          
          :global(.period-select) {
            width: 100%;
          }
          
          .controls-section {
            flex-direction: column;
            gap: 16px;
            padding: 24px;
            margin-top: 24px;
          }
          
          .show-completed-section {
            width: 100%;
          }
          
          .show-completed-button {
            width: 100%;
            justify-content: center;
          }
        }
        
        /* Tablet breakpoint */
        @media (max-width: 1024px) and (min-width: 768px) {
          .page-title {
            font-size: 48px;
          }
        }
      `}</style>
    </MainLayout>
  );
}