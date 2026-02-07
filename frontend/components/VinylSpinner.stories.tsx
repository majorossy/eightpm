import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { VinylSpinner } from './VinylSpinner';

const meta = {
  title: 'Primitives/VinylSpinner',
  component: VinylSpinner,
  tags: ['autodocs'],
} satisfies Meta<typeof VinylSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: { size: 'sm' },
};

export const Medium: Story = {
  args: { size: 'md' },
};

export const Large: Story = {
  args: { size: 'lg' },
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
      <VinylSpinner size="sm" />
      <VinylSpinner size="md" />
      <VinylSpinner size="lg" />
    </div>
  ),
};
