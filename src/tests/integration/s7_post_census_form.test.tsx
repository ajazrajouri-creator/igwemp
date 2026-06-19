// @vitest-environment jsdom
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import { afterEach } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { PostCensusForm } from '../../pages/posts/PostCensusForm';
import { CensusReviewPanel } from '../../pages/posts/CensusReviewPanel';
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

describe('S7 Post Census Form', () => {
  it('renders correctly with an initial empty row', () => {
    renderWithProviders(<PostCensusForm />);
    expect(screen.getByText('Physical Post Census')).toBeInTheDocument();
    
    // There should be one select for designation and one for nature
    expect(screen.getAllByRole('combobox').length).toBe(2);
    expect(screen.getByPlaceholderText('e.g. Govt Order No. 123')).toBeInTheDocument();
  });

  it('can add a new row', async () => {
    renderWithProviders(<PostCensusForm />);
    const addButton = screen.getAllByRole('button', { name: /Add Row/i })[0];
    fireEvent.click(addButton);
    
    // Now there should be 6 selects
    expect(screen.getAllByRole('combobox').length).toBe(6);
  });

  it('validates empty submissions', async () => {
    renderWithProviders(<PostCensusForm />);
    
    const submitButton = screen.getAllByText('Submit Census')[0];
    
    // Zod validation should disable button initially if values are empty
    expect(submitButton).toBeDisabled();
  });
});
