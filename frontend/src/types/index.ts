export interface Sponsor {
  id: string;
  name: string;
  type: 'In-kind' | 'Corporate';
  contents: string;
  status: 'Initial email' | 'See email';
  approximateValue: string;
  emailChain?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Fulfillment {
  id: string;
  sponsorId: string;
  sponsorName: string;
  description: string;
  deadline: Date;
  tags: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Discovery {
  id: string;
  name: string;
  status: 'New' | 'Contacted' | 'Interested' | 'Not Interested';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface DashboardStats {
  totalSponsors: number;
  totalValue: string;
  otherStat: string;
  anotherStat: string;
}

export interface NewSponsorForm {
  name: string;
  type: 'In-kind' | 'Corporate';
  contents: string;
  approximateValue: string;
}

export interface NewFulfillmentForm {
  sponsorId: string;
  description: string;
  deadline: Date;
  tags: string;
}