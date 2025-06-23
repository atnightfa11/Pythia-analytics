import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import CohortAnalysis from '../components/CohortAnalysis'

// Mock fetch
global.fetch = vi.fn()

describe('CohortAnalysis', () => {
  it('renders loading state initially', () => {
    render(<CohortAnalysis />)
    expect(screen.getByText('30-Day Retention Cohorts')).toBeInTheDocument()
  })

  it('renders error state when fetch fails', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'))
    
    render(<CohortAnalysis />)
    
    await waitFor(() => {
      expect(screen.getByText('Failed to load cohort data')).toBeInTheDocument()
    })
  })

  it('renders cohort data when fetch succeeds', async () => {
    const mockData = [
      { cohort_day: '2024-01-01', day_offset: 0, sessions: 100 },
      { cohort_day: '2024-01-01', day_offset: 1, sessions: 80 },
    ]

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true, data: mockData })
    } as Response)

    render(<CohortAnalysis />)
    
    await waitFor(() => {
      expect(screen.getByText('2 cohorts')).toBeInTheDocument()
    })
  })
})