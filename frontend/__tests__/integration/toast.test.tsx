/**
 * Integration test: Toast notifications
 *
 * Tests useToastState hook behavior:
 * - addToast creates toast with correct type and message
 * - removeToast removes by ID
 * - showError / showSuccess / showInfo / showWarning shortcuts
 * - Auto-dismiss after duration (default 5s)
 * - Multiple toasts stack
 * - Duration 0 disables auto-dismiss
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import React from 'react';
import { screen, act } from '@testing-library/react';
import { render } from '@testing-library/react';
import { useToastState, ToastContext } from '@/hooks/useToast';

function ToastDisplay() {
  const toastState = useToastState();

  return (
    <ToastContext.Provider value={toastState}>
      <div>
        <div data-testid="toast-count">{toastState.toasts.length}</div>
        <div data-testid="toast-messages">
          {toastState.toasts.map(t => t.message).join(',')}
        </div>
        <div data-testid="toast-types">
          {toastState.toasts.map(t => t.type).join(',')}
        </div>
        <button data-testid="add-info" onClick={() => toastState.addToast('Hello', 'info')}>
          Add Info
        </button>
        <button data-testid="add-error" onClick={() => toastState.showError('Oops')}>
          Add Error
        </button>
        <button data-testid="add-success" onClick={() => toastState.showSuccess('Done!')}>
          Add Success
        </button>
        <button data-testid="add-warning" onClick={() => toastState.showWarning('Watch out')}>
          Add Warning
        </button>
        <button
          data-testid="add-persistent"
          onClick={() => toastState.addToast('Sticky', 'info', 0)}
        >
          Add Persistent
        </button>
        <button
          data-testid="remove-first"
          onClick={() => {
            if (toastState.toasts[0]) toastState.removeToast(toastState.toasts[0].id);
          }}
        >
          Remove First
        </button>
      </div>
    </ToastContext.Provider>
  );
}

describe('Toast Notifications Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('addToast creates toast with correct type', () => {
    render(<ToastDisplay />);

    act(() => { screen.getByTestId('add-info').click(); });

    expect(screen.getByTestId('toast-count').textContent).toBe('1');
    expect(screen.getByTestId('toast-messages').textContent).toBe('Hello');
    expect(screen.getByTestId('toast-types').textContent).toBe('info');
  });

  it('showError creates error toast', () => {
    render(<ToastDisplay />);

    act(() => { screen.getByTestId('add-error').click(); });

    expect(screen.getByTestId('toast-types').textContent).toBe('error');
    expect(screen.getByTestId('toast-messages').textContent).toBe('Oops');
  });

  it('showSuccess creates success toast', () => {
    render(<ToastDisplay />);

    act(() => { screen.getByTestId('add-success').click(); });

    expect(screen.getByTestId('toast-types').textContent).toBe('success');
    expect(screen.getByTestId('toast-messages').textContent).toBe('Done!');
  });

  it('showWarning creates warning toast', () => {
    render(<ToastDisplay />);

    act(() => { screen.getByTestId('add-warning').click(); });

    expect(screen.getByTestId('toast-types').textContent).toBe('warning');
    expect(screen.getByTestId('toast-messages').textContent).toBe('Watch out');
  });

  it('multiple toasts stack', () => {
    render(<ToastDisplay />);

    act(() => { screen.getByTestId('add-info').click(); });
    act(() => { screen.getByTestId('add-error').click(); });
    act(() => { screen.getByTestId('add-success').click(); });

    expect(screen.getByTestId('toast-count').textContent).toBe('3');
    expect(screen.getByTestId('toast-types').textContent).toBe('info,error,success');
  });

  it('removeToast removes by ID', () => {
    render(<ToastDisplay />);

    act(() => { screen.getByTestId('add-info').click(); });
    act(() => { screen.getByTestId('add-error').click(); });
    expect(screen.getByTestId('toast-count').textContent).toBe('2');

    act(() => { screen.getByTestId('remove-first').click(); });
    expect(screen.getByTestId('toast-count').textContent).toBe('1');
    expect(screen.getByTestId('toast-messages').textContent).toBe('Oops');
  });

  it('auto-dismisses after 5s default duration', () => {
    render(<ToastDisplay />);

    act(() => { screen.getByTestId('add-info').click(); });
    expect(screen.getByTestId('toast-count').textContent).toBe('1');

    // Advance past 5s default
    act(() => { vi.advanceTimersByTime(5100); });
    expect(screen.getByTestId('toast-count').textContent).toBe('0');
  });

  it('duration 0 disables auto-dismiss', () => {
    render(<ToastDisplay />);

    act(() => { screen.getByTestId('add-persistent').click(); });
    expect(screen.getByTestId('toast-count').textContent).toBe('1');

    // Advance well past default duration
    act(() => { vi.advanceTimersByTime(30_000); });
    expect(screen.getByTestId('toast-count').textContent).toBe('1');
    expect(screen.getByTestId('toast-messages').textContent).toBe('Sticky');
  });

  it('each toast auto-dismisses independently', () => {
    render(<ToastDisplay />);

    // Add two toasts with default 5s duration
    act(() => { screen.getByTestId('add-info').click(); });

    // Advance 3s, then add another
    act(() => { vi.advanceTimersByTime(3000); });
    act(() => { screen.getByTestId('add-error').click(); });
    expect(screen.getByTestId('toast-count').textContent).toBe('2');

    // Advance 2.1s — first toast should dismiss (5s total), second still has ~3s
    act(() => { vi.advanceTimersByTime(2100); });
    expect(screen.getByTestId('toast-count').textContent).toBe('1');
    expect(screen.getByTestId('toast-messages').textContent).toBe('Oops');

    // Advance remaining ~3s — second toast dismisses
    act(() => { vi.advanceTimersByTime(3100); });
    expect(screen.getByTestId('toast-count').textContent).toBe('0');
  });
});
