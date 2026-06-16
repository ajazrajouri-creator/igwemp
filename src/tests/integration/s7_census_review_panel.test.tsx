// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { PostCensusForm } from '../../pages/posts/PostCensusForm';
import { CensusReviewPanel } from '../../pages/posts/CensusReviewPanel';

vi.mock('../../hooks/queries/useCensusReview', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual as any,
    useApproveCensusSubmission: () => ({
      mutate: (args: any, { onSuccess }: { onSuccess?: (data: any) => void }) => {
        if (onSuccess) onSuccess({ success: true, message: 'MOCK: Approved' });
      },
      isPending: false,
      error: null
    })
  };
});
import { AuthContext } from '../../core/auth/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const mockUser = {
  id: 'user-123',
  email: 'test@example.com',
  tenant_id: 'SED',
  permissions: []
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false }
  }
});

function renderWithProviders(ui: React.ReactElement) {
  return render(
    <QueryClientProvider client={queryClient}>
      <AuthContext.Provider value={{
        user: mockUser as any,
        session: null,
        isLoading: false,
        signIn: vi.fn(),
        signOut: vi.fn()
      } as any}>
        <BrowserRouter>
          {ui}
        </BrowserRouter>
      </AuthContext.Provider>
    </QueryClientProvider>
  );
}

afterEach(() => {
  cleanup();
});

describe('S7 Census Review Panel - Abolition flow', () => {
  it('opens abolition modal when discrepancies exist', async () => {
    renderWithProviders(<CensusReviewPanel />);
    const approveButtons = screen.getAllByRole('button', { name: /Approve/i });
    // Index 0: Bulk Approve
    // Index 1: BHS Peeri (discrepancies: 0)
    // Index 2: GHS Koteranka (discrepancies: 2)
    fireEvent.click(approveButtons[3]);
    
    expect(await screen.findByText(/Resolution Required: Abolish Posts/)).toBeInTheDocument();
  });

  it('disables confirm button until required count selected', async () => {
    renderWithProviders(<CensusReviewPanel />);
    const approveButtons = screen.getAllByRole('button', { name: /Approve/i });
    fireEvent.click(approveButtons[3]);
    
    const confirmBtn = await screen.findByRole('button', { name: /Confirm & Approve/i });
    expect(confirmBtn).toBeDisabled();

    // Select 2 checkboxes
    const checkboxes = screen.getAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    expect(confirmBtn).toBeDisabled();
    
    fireEvent.click(checkboxes[1]);
    expect(confirmBtn).not.toBeDisabled();
  });

  it('handles atomic RPC success gracefully', async () => {
    renderWithProviders(<CensusReviewPanel />);
    const approveButtons = screen.getAllByRole('button', { name: /Approve/i });
    fireEvent.click(approveButtons[3]);
    
    const checkboxes = await screen.findAllByRole('checkbox');
    fireEvent.click(checkboxes[0]);
    fireEvent.click(checkboxes[1]);
    
    const confirmBtn = screen.getByRole('button', { name: /Confirm & Approve/i });
    fireEvent.click(confirmBtn);
    
    // DEV_MODE mocked atomic RPC delay is 800ms, modal should eventually close
    await waitFor(() => {
      expect(screen.queryByText(/Resolution Required: Abolish Posts/)).not.toBeInTheDocument();
    }, { timeout: 4000 });
  });
});
