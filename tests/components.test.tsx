import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Badge } from '../src/components/common/Badge';
import { Alert } from '../src/components/common/Alert';
import { StatCard } from '../src/components/common/StatCard';
import { ShieldCheck } from 'lucide-react';

describe('Common UI Components', () => {
  it('renders status badges with appropriate styling', () => {
    const { getByText } = render(<Badge status="ACTIVE" />);
    expect(getByText('ACTIVE')).toBeDefined();
  });

  it('renders role badges correctly', () => {
    const { getByText } = render(<Badge role="claims_officer" />);
    expect(getByText('Claims Officer')).toBeDefined();
  });

  it('renders alert boxes with correct content', () => {
    const { getByText } = render(
      <Alert type="warning" title="Waiting Period Alert">
        Policy is in initial 30 days
      </Alert>
    );
    expect(getByText('Waiting Period Alert')).toBeDefined();
    expect(getByText('Policy is in initial 30 days')).toBeDefined();
  });

  it('renders stat cards with metrics and labels', () => {
    const { getByText } = render(
      <StatCard
        title="Total Active Cover"
        value="₹12,00,000"
        icon={ShieldCheck}
      />
    );
    expect(getByText('Total Active Cover')).toBeDefined();
    expect(getByText('₹12,00,000')).toBeDefined();
  });
});
