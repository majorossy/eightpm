import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ThemeToggle from './ThemeToggle';
import { ThemeProvider } from '@/context/ThemeContext';

const meta = {
  title: 'Primitives/ThemeToggle',
  component: ThemeToggle,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ThemeProvider>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <Story />
          <span style={{ color: 'var(--text-dim)', fontSize: 14 }}>
            Click to toggle theme
          </span>
        </div>
      </ThemeProvider>
    ),
  ],
} satisfies Meta<typeof ThemeToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InTopBar: Story = {
  decorators: [
    (Story) => (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0.5rem 1rem',
        background: 'var(--bg)',
        borderBottom: '1px solid var(--bg-elevated)',
      }}>
        <Story />
      </div>
    ),
  ],
};
