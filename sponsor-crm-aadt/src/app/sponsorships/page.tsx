'use client';

import React, { useState } from 'react';
import { MainLayout, PageHeader, StatsCard, Table } from '@/components/layout';
import { Button, Badge, Select, Modal } from '@/components/ui';
import { Sponsor } from '@/types';
import { NewSponsorModal } from '@/components/modals/NewSponsorModal';

const mockSponsors: Sponsor[] = [
  {
    id: '1',
    name: 'Company 1',
    type: 'In-kind',
    contents: 'Food',
    status: 'Initial email',
    approximateValue: '$XXX',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '2',
    name: 'Company 1',
    type: 'In-kind',
    contents: 'Catering',
    status: 'Initial email',
    approximateValue: '$XXX',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '3',
    name: 'Company 1',
    type: 'Corporate',
    contents: 'Money',
    status: 'Initial email',
    approximateValue: '$XXX',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '4',
    name: 'Company 1',
    type: 'Corporate',
    contents: 'Money',
    status: 'Initial email',
    approximateValue: '$XXX',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '5',
    name: 'Company 1',
    type: 'Corporate',
    contents: 'Money',
    status: 'Initial email',
    approximateValue: '$XXX',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '6',
    name: 'Company 1',
    type: 'Corporate',
    contents: 'Money',
    status: 'Initial email',
    approximateValue: '$XXX',
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    id: '7',
    name: 'Company 1',
    type: 'Corporate',
    contents: 'Money',
    status: 'Initial email',
    approximateValue: '$XXX',
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

const periodOptions = [
  { value: 'fall-25', label: 'Fall \'25' },
  { value: 'spring-25', label: 'Spring \'25' },
  { value: 'fall-24', label: 'Fall \'24' }
];

export default function SponsorshipsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState('fall-25');
  const [isNewSponsorModalOpen, setIsNewSponsorModalOpen] = useState(false);

  const handleSeeEmail = (sponsorId: string) => {
    console.log('View email chain for sponsor:', sponsorId);
  };

  const handleNewSponsor = (data: any) => {
    console.log('New sponsor data:', data);
    setIsNewSponsorModalOpen(false);
  };

  const columns = [
    {
      key: 'name',
      header: 'Name'
    },
    {
      key: 'type',
      header: 'Type'
    },
    {
      key: 'contents',
      header: 'Contents'
    },
    {
      key: 'status',
      header: 'Status',
      render: (status: string) => (
        <Badge variant={status === 'See email' ? 'see-email' : 'initial-email'}>
          {status}
        </Badge>
      )
    },
    {
      key: 'approximateValue',
      header: 'Approximate value'
    },
    {
      key: 'emailChain',
      header: 'Email chain',
      render: (_: any, row: Sponsor) => (
        <Badge 
          variant="see-email" 
          onClick={() => handleSeeEmail(row.id)}
        >
          See email
        </Badge>
      )
    }
  ];

  return (
    <MainLayout>
      <PageHeader
        title="SPONSORSHIPS"
        subtitle="Current and past sponsorships and reference."
      >
        <Select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          options={periodOptions}
        />
      </PageHeader>

      <div className="stats-grid">
        <StatsCard title="# OF SPONSORS" value="7" />
        <StatsCard title="TOTAL VALUE" value="$0" />
        <StatsCard title="OTHER STAT" value="0" />
        <StatsCard title="ANOTHER STAT" value="0" />
      </div>

      <Table columns={columns} data={mockSponsors} />

      <div className="add-sponsor-section">
        <Button
          variant="secondary"
          onClick={() => setIsNewSponsorModalOpen(true)}
        >
          <span className="plus-icon">+</span>
          Add new sponsor manually
        </Button>
      </div>

      <NewSponsorModal
        isOpen={isNewSponsorModalOpen}
        onClose={() => setIsNewSponsorModalOpen(false)}
        onSubmit={handleNewSponsor}
      />

      <style jsx>{`
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--grid-gap);
          margin-bottom: 48px;
        }

        .add-sponsor-section {
          display: flex;
          justify-content: center;
          margin-top: 32px;
        }

        .plus-icon {
          font-size: 16px;
          font-weight: bold;
        }
      `}</style>
    </MainLayout>
  );
}