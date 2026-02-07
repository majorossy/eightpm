import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { ToastProvider } from './ToastContainer';
import { useToast } from '@/hooks/useToast';

// Helper component that renders buttons to trigger toasts
function ToastDemo() {
  const { showSuccess, showError, showInfo, showWarning } = useToast();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 300 }}>
      <button
        onClick={() => showSuccess('Message sent successfully!')}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#22c55e',
          color: '#000',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Show Success Toast
      </button>
      <button
        onClick={() => showError('Something went wrong. Please try again.')}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#ef4444',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Show Error Toast
      </button>
      <button
        onClick={() => showInfo('Your library has been synced.')}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#3b82f6',
          color: '#fff',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Show Info Toast
      </button>
      <button
        onClick={() => showWarning('You are about to delete your playlist.')}
        style={{
          padding: '0.75rem 1.5rem',
          background: '#eab308',
          color: '#000',
          border: 'none',
          borderRadius: 8,
          cursor: 'pointer',
          fontWeight: 600,
        }}
      >
        Show Warning Toast
      </button>
    </div>
  );
}

const meta = {
  title: 'Primitives/ToastContainer',
  component: ToastProvider,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ToastProvider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  render: () => (
    <ToastProvider>
      <div style={{ padding: '2rem', minHeight: 400 }}>
        <h3 style={{ color: 'var(--text)', marginBottom: '1rem' }}>Click buttons to show toasts</h3>
        <ToastDemo />
      </div>
    </ToastProvider>
  ),
};
