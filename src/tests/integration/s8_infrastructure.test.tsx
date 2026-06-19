/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import InfrastructureCensusForm from '../../pages/infrastructure/InfrastructureCensusForm';
import InfrastructureReviewPanel from '../../pages/infrastructure/InfrastructureReviewPanel';
import DeficiencyDashboard from '../../pages/reports/DeficiencyDashboard';

// Mock dependencies
vi.mock('../../hooks/queries/useInfrastructure', () => ({
  useInfrastructureSubmissions: vi.fn(() => ({
    data: [
      { id: '1', office_name: 'School A', status: 'SUBMITTED', reviewer_remarks: null }
    ],
    isLoading: false
  })),
  useApproveInfrastructureSubmission: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true })
  })),
  useReturnInfrastructureSubmission: vi.fn(() => ({
    mutateAsync: vi.fn().mockResolvedValue({ success: true })
  })),
  useDeficiencies: vi.fn(() => ({
    data: [
      { office_name: 'School B', deficiency_type: 'NO_GIRLS_TOILET', severity: 'CRITICAL', last_updated: new Date().toISOString() },
      { office_name: 'School C', deficiency_type: 'NO_LAND_STATUS', severity: 'HIGH', last_updated: new Date().toISOString() },
      { office_name: 'School D', deficiency_type: 'NO_BUILDING', severity: 'CRITICAL', last_updated: new Date().toISOString() }
    ],
    isLoading: false
  }))
}));

vi.mock('../../lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    rpc: vi.fn(),
  },
  isSupabaseConfigured: false
}));

const queryClient = new QueryClient();

const Wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

describe('S8: Infrastructure Census Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe('InfrastructureCensusForm', () => {
    it('renders dev mode label and initial land tab', () => {
      render(<InfrastructureCensusForm />, { wrapper: Wrapper });
      expect(screen.getAllByText(/UI REVIEW MOCK DATA MODE/i)[0]).toBeTruthy();
      expect(screen.getAllByText(/Land Details/i)[0]).toBeTruthy();
    });

    it('renders building dynamic array', async () => {
      render(<InfrastructureCensusForm />, { wrapper: Wrapper });
      // Go to Buildings Tab
      fireEvent.click(screen.getByRole('button', { name: /Buildings/i }));
      expect(screen.getByText(/Building Information/i)).toBeTruthy();

      // Check Building Available
      const checkbox = screen.getByLabelText(/School Building is Available/i);
      fireEvent.click(checkbox);

      // Add Building
      const addBtn = await screen.findByText('+ Add Building');
      fireEvent.click(addBtn);

      // Should show Building #1
      expect(await screen.findByText('Building #1')).toBeTruthy();
      
      // Remove Building
      const removeBtn = screen.getByText('× Remove');
      fireEvent.click(removeBtn);
      
      expect(await screen.findByText(/No buildings added yet./i)).toBeTruthy();
    });

    it('conditionally renders HS/HSS special rooms based on school level selection', async () => {
      render(<InfrastructureCensusForm />, { wrapper: Wrapper });
      // Default level is HS, so it should be visible in Facilities tab
      fireEvent.click(screen.getByRole('button', { name: /Special Facilities/i }));
      expect(await screen.findByTestId('hs-hss-special-rooms')).toBeTruthy();
      expect(screen.getByText('Computer Room')).toBeTruthy();

      // Change school level to PS
      const select = screen.getByDisplayValue('High School (HS)');
      fireEvent.change(select, { target: { value: 'PS' } });

      // Special rooms section should disappear
      await waitFor(() => {
        expect(screen.queryByTestId('hs-hss-special-rooms')).toBeNull();
      });
    });

    it('validates toilet fields in WASH tab', () => {
      render(<InfrastructureCensusForm />, { wrapper: Wrapper });
      fireEvent.click(screen.getByRole('button', { name: /WASH/i }));
      
      // Should find Total/Functional Boys Toilets
      expect(screen.getByText('Total Boys Toilets')).toBeTruthy();
      expect(screen.getByText('Functional Boys Toilets')).toBeTruthy();
      
      // Should find Total/Functional Staff Toilets
      expect(screen.getByText('Total Staff Toilets')).toBeTruthy();
      expect(screen.getByText('Functional Staff Toilets')).toBeTruthy();
    });

    it('validates evidence required logic', async () => {
      render(<InfrastructureCensusForm />, { wrapper: Wrapper });
      fireEvent.click(screen.getByRole('button', { name: /WASH/i }));
      
      // Check Drinking Water Available
      const waterCheckbox = screen.getByLabelText(/Drinking Water Available/i);
      fireEvent.click(waterCheckbox);

      fireEvent.click(screen.getByRole('button', { name: /Evidence/i }));
      
      // Should require drinking water evidence
      expect(await screen.findByText('Drinking Water Facility')).toBeTruthy();

      // Check form submission is disabled if evidence is missing
      const submitBtn = screen.getByRole('button', { name: /Submit Census/i });
      expect((submitBtn as HTMLButtonElement).disabled).toBe(true);

      // Click mock upload
      const uploadBtns = screen.getAllByRole('button').filter(btn => btn.className.includes('rounded-full'));
      // Find the one inside the Drinking Water Facility card
      const waterCard = screen.getByText('Drinking Water Facility').closest('div')?.parentElement;
      const uploadBtn = waterCard?.querySelector('button');
      if (uploadBtn) fireEvent.click(uploadBtn);

      // Evidence missing should be gone, submit button enabled
      await waitFor(() => {
        expect((submitBtn as HTMLButtonElement).disabled).toBe(false);
      });
    });
  });

  describe('InfrastructureReviewPanel', () => {
    it('renders submissions and new review summary logic', () => {
      render(<InfrastructureReviewPanel />, { wrapper: Wrapper });
      expect(screen.getAllByText(/School A/i)[0]).toBeTruthy();
      expect(screen.getByText('Approve')).toBeTruthy();
      expect(screen.getByText('Return')).toBeTruthy();
    });
  });

  describe('DeficiencyDashboard', () => {
    it('renders new deficiency cards and charts', () => {
      render(<DeficiencyDashboard />, { wrapper: Wrapper });
      expect(screen.getAllByText(/Infrastructure Deficiency Dashboard/i)[0]).toBeTruthy();
      expect(screen.getAllByText(/School B/i)[0]).toBeTruthy();
      expect(screen.getAllByText(/School C/i)[0]).toBeTruthy(); // new rule
      expect(screen.getAllByText(/School D/i)[0]).toBeTruthy(); // new rule
    });
  });
});
