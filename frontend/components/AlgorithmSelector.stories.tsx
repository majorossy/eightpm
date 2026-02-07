import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import AlgorithmSelector from './AlgorithmSelector';
import { FestivalSortProvider } from '@/context/FestivalSortContext';

const meta = {
  title: 'Navigation/AlgorithmSelector',
  component: AlgorithmSelector,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <FestivalSortProvider artists={[]}>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
          <Story />
        </div>
      </FestivalSortProvider>
    ),
  ],
} satisfies Meta<typeof AlgorithmSelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const InDarkCard: Story = {
  decorators: [
    (Story) => (
      <div style={{
        background: '#252220',
        borderRadius: 12,
        padding: '2rem',
        border: '1px solid rgba(212, 160, 96, 0.25)',
      }}>
        <Story />
      </div>
    ),
  ],
};
