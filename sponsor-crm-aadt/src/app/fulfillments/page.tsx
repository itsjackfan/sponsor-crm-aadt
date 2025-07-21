'use client';

import React, { useState } from 'react';
import { MainLayout, PageHeader, Table } from '@/components/layout';
import { Button, Select, Checkbox } from '@/components/ui';
import { Fulfillment } from '@/types';

const mockFulfillments: Fulfillment[] = [
  {
    id: '1',
    sponsorId: '1',
    sponsorName: 'Company 1',
    description: 'In-kind',
    deadline: new Date('2025-07-28'),
    tags: '$500',
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    sponsorId: '2',
    sponsorName: 'Company 1',
    description: 'In-kind',
    deadline: new Date('2025-07-28'),
    tags: '$5,500',
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    sponsorId: '3',
    sponsorName: 'Company 1',
    description: 'Corporate',
    deadline: new Date('2025-07-24'),
    tags: '$4,000',
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    sponsorId: '4',
    sponsorName: 'Company 1',
    description: 'Corporate',
    deadline: new Date('2025-07-30'),
    tags: '$3,600',
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const periodOptions = [
  { value: 'fall-25', label: 'Fall \'25' },
  { value: 'spring-25', label: 'Spring \'25' },
  { value: 'fall-24', label: 'Fall \'24' }
];

export default function FulfillmentsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('fall-25');
  const [fulfillments, setFulfillments] = useState(mockFulfillments);
  const [showCompleted, setShowCompleted] = useState(false);

  const handleToggleFulfillment = (fulfillmentId: string) => {
    setFulfillments(prev =>
      prev.map(fulfillment =>
        fulfillment.id === fulfillmentId
          ? { ...fulfillment, completed: !fulfillment.completed }
          : fulfillment
      )
    );
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const filteredFulfillments = showCompleted 
    ? fulfillments 
    : fulfillments.filter(f => !f.completed);

  const columns = [
    {
      key: 'completed',
      header: '',
      render: (_: any, row: Fulfillment) => (
        <Checkbox
          checked={row.completed}
          onChange={() => handleToggleFulfillment(row.id)}
        />
      )
    },
    {
      key: 'sponsorName',
      header: 'Name'
    },
    {
      key: 'description',
      header: 'Description'
    },
    {
      key: 'deadline',
      header: 'Fulfillment deadline',
      render: (deadline: Date) => formatDate(deadline)
    },
    {
      key: 'tags',
      header: 'Tags'
    }
  ];

  return (
    <MainLayout>
      <PageHeader
        title="FULFILLMENTS"
        subtitle="What we need to do to fulfill sponsorships, etc."
      >
        <Select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          options={periodOptions}
        />
      </PageHeader>

      <Table columns={columns} data={filteredFulfillments} />

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
        .controls-section {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 32px;
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
        }

        .dropdown-icon {
          width: 14px;
          height: 14px;
          transition: transform var(--duration-normal) var(--easing-default);
        }

        .dropdown-icon.rotated {
          transform: rotate(180deg);
        }
      `}</style>
    </MainLayout>
  );
}