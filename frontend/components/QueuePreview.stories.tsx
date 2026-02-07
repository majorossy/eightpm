import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import QueuePreview from './QueuePreview';
import { QueueProvider } from '@/context/QueueContext';

const meta = {
  title: 'Player/QueuePreview',
  component: QueuePreview,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <QueueProvider>
        <div style={{ maxWidth: 350 }}>
          <Story />
        </div>
      </QueueProvider>
    ),
  ],
} satisfies Meta<typeof QueuePreview>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};
