import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import QualitySelector from './QualitySelector';
import { QualityProvider } from '@/context/QualityContext';

const meta = {
  title: 'Player/QualitySelector',
  component: QualitySelector,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QualityProvider>
        <Story />
      </QualityProvider>
    ),
  ],
} satisfies Meta<typeof QualitySelector>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
