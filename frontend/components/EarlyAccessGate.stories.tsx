import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import EarlyAccessGate from './EarlyAccessGate';

const meta = {
  title: 'Primitives/EarlyAccessGate',
  component: EarlyAccessGate,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof EarlyAccessGate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: '2rem', color: 'var(--text)' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>App Content</h1>
        <p>This content is behind the early access gate.</p>
      </div>
    ),
  },
};
