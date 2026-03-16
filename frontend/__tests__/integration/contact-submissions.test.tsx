/**
 * Integration test: Contact form submissions
 *
 * Tests useContactSubmissions hook:
 * - addSubmission creates entry with generated ID and timestamp
 * - Submissions ordered newest-first
 * - markAsRead updates read flag
 * - deleteSubmission removes by ID
 * - clearAll removes everything
 * - localStorage persistence
 * - Restores from localStorage on mount
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { screen, act, waitFor } from '@testing-library/react';
import { render } from '@testing-library/react';
import { useContactSubmissions } from '@/hooks/useContactSubmissions';

function SubmissionsDisplay() {
  const subs = useContactSubmissions();

  return (
    <div>
      <div data-testid="count">{subs.submissions.length}</div>
      <div data-testid="is-loaded">{String(subs.isLoaded)}</div>
      <div data-testid="names">
        {subs.submissions.map(s => s.name).join(',')}
      </div>
      <div data-testid="first-read">
        {subs.submissions[0]?.read !== undefined ? String(subs.submissions[0].read) : 'none'}
      </div>
      <button
        data-testid="add-alice"
        onClick={() => subs.addSubmission({
          name: 'Alice',
          email: 'alice@example.com',
          subject: 'Hello',
          message: 'First message',
        })}
      >Add Alice</button>
      <button
        data-testid="add-bob"
        onClick={() => subs.addSubmission({
          name: 'Bob',
          email: 'bob@example.com',
          subject: 'Question',
          message: 'Second message',
        })}
      >Add Bob</button>
      <button
        data-testid="mark-first-read"
        onClick={() => {
          if (subs.submissions[0]) subs.markAsRead(subs.submissions[0].id);
        }}
      >Mark First Read</button>
      <button
        data-testid="delete-first"
        onClick={() => {
          if (subs.submissions[0]) subs.deleteSubmission(subs.submissions[0].id);
        }}
      >Delete First</button>
      <button data-testid="clear-all" onClick={() => subs.clearAll()}>
        Clear All
      </button>
    </div>
  );
}

describe('Contact Submissions Integration', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts empty', async () => {
    render(<SubmissionsDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loaded').textContent).toBe('true');
    });

    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('addSubmission creates entry', async () => {
    render(<SubmissionsDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loaded').textContent).toBe('true');
    });

    act(() => { screen.getByTestId('add-alice').click(); });

    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('names').textContent).toBe('Alice');
    expect(screen.getByTestId('first-read').textContent).toBe('false');
  });

  it('submissions ordered newest-first', async () => {
    render(<SubmissionsDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loaded').textContent).toBe('true');
    });

    act(() => { screen.getByTestId('add-alice').click(); });
    act(() => { screen.getByTestId('add-bob').click(); });

    expect(screen.getByTestId('count').textContent).toBe('2');
    // Bob added last, should be first (newest-first)
    expect(screen.getByTestId('names').textContent).toBe('Bob,Alice');
  });

  it('markAsRead updates read flag', async () => {
    render(<SubmissionsDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loaded').textContent).toBe('true');
    });

    act(() => { screen.getByTestId('add-alice').click(); });
    expect(screen.getByTestId('first-read').textContent).toBe('false');

    act(() => { screen.getByTestId('mark-first-read').click(); });
    expect(screen.getByTestId('first-read').textContent).toBe('true');
  });

  it('deleteSubmission removes by ID', async () => {
    render(<SubmissionsDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loaded').textContent).toBe('true');
    });

    act(() => { screen.getByTestId('add-alice').click(); });
    act(() => { screen.getByTestId('add-bob').click(); });
    expect(screen.getByTestId('count').textContent).toBe('2');

    // Delete first (Bob, newest)
    act(() => { screen.getByTestId('delete-first').click(); });
    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('names').textContent).toBe('Alice');
  });

  it('clearAll removes everything', async () => {
    render(<SubmissionsDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loaded').textContent).toBe('true');
    });

    act(() => { screen.getByTestId('add-alice').click(); });
    act(() => { screen.getByTestId('add-bob').click(); });
    expect(screen.getByTestId('count').textContent).toBe('2');

    act(() => { screen.getByTestId('clear-all').click(); });
    expect(screen.getByTestId('count').textContent).toBe('0');
  });

  it('persists to localStorage', async () => {
    render(<SubmissionsDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loaded').textContent).toBe('true');
    });

    act(() => { screen.getByTestId('add-alice').click(); });

    const stored = localStorage.getItem('8pm-contact-submissions');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.submissions).toHaveLength(1);
    expect(parsed.submissions[0].name).toBe('Alice');
    expect(parsed.submissions[0].email).toBe('alice@example.com');
  });

  it('restores from localStorage on mount', async () => {
    localStorage.setItem('8pm-contact-submissions', JSON.stringify({
      submissions: [
        {
          id: 'contact-1',
          name: 'Restored',
          email: 'test@test.com',
          subject: 'Test',
          message: 'Stored message',
          timestamp: Date.now(),
          read: true,
        },
      ],
    }));

    render(<SubmissionsDisplay />);

    await waitFor(() => {
      expect(screen.getByTestId('is-loaded').textContent).toBe('true');
    });

    expect(screen.getByTestId('count').textContent).toBe('1');
    expect(screen.getByTestId('names').textContent).toBe('Restored');
    expect(screen.getByTestId('first-read').textContent).toBe('true');
  });
});
