import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import TicketStubCard from './TicketStubCard';
import { mockQueueItem, mockQueueItem2, mockQueueItem3, mockSong, mockSong2, mockSong3 } from '../.storybook/fixtures';

const meta = {
  title: 'Cards/TicketStubCard',
  component: TicketStubCard,
  tags: ['autodocs'],
  args: {
    onPlay: fn(),
    onSelectVersion: fn(),
    onRemove: fn(),
  },
} satisfies Meta<typeof TicketStubCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Horizontal: Story = {
  args: {
    item: mockQueueItem,
    index: 1,
    absoluteIndex: 0,
    variant: 'horizontal',
  },
};

export const Vertical: Story = {
  args: {
    item: mockQueueItem2,
    index: 2,
    absoluteIndex: 1,
    variant: 'vertical',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400 }}>
        <Story />
      </div>
    ),
  ],
};

export const VerticalCompact: Story = {
  args: {
    item: mockQueueItem3,
    index: 3,
    absoluteIndex: 2,
    variant: 'vertical-compact',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400 }}>
        <Story />
      </div>
    ),
  ],
};

export const WithMultipleVersions: Story = {
  args: {
    item: {
      ...mockQueueItem,
      availableVersions: [mockSong, mockSong2, mockSong3],
      played: false,
    },
    index: 1,
    absoluteIndex: 0,
    variant: 'vertical',
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400 }}>
        <Story />
      </div>
    ),
  ],
};
