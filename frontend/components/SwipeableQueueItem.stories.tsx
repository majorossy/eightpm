import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import SwipeableQueueItem from './SwipeableQueueItem';
import { mockQueueItem } from '../.storybook/fixtures';

const meta = {
  title: 'Player/SwipeableQueueItem',
  component: SwipeableQueueItem,
  tags: ['autodocs'],
  args: {
    onDelete: fn(),
  },
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 400 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SwipeableQueueItem>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 4, background: '#3a3632', flexShrink: 0 }} />
        <div>
          <div style={{ color: '#e8e0d4', fontSize: 14, fontWeight: 500 }}>
            {mockQueueItem.trackTitle}
          </div>
          <div style={{ color: '#8a8478', fontSize: 12 }}>
            {mockQueueItem.song.artistName}
          </div>
        </div>
      </div>
    ),
  },
};

export const WithCustomClassName: Story = {
  args: {
    className: 'rounded-lg',
    children: (
      <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 4, background: '#3a3632', flexShrink: 0 }} />
        <div>
          <div style={{ color: '#e8e0d4', fontSize: 14, fontWeight: 500 }}>Elko</div>
          <div style={{ color: '#8a8478', fontSize: 12 }}>Railroad Earth</div>
        </div>
      </div>
    ),
  },
};

export const MultipleItems: Story = {
  render: (args) => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
      {['Bird in a House', 'Elko', 'Warhead Boogie'].map((title) => (
        <SwipeableQueueItem key={title} onDelete={args.onDelete}>
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 4, background: '#3a3632', flexShrink: 0 }} />
            <div>
              <div style={{ color: '#e8e0d4', fontSize: 14, fontWeight: 500 }}>{title}</div>
              <div style={{ color: '#8a8478', fontSize: 12 }}>Railroad Earth</div>
            </div>
          </div>
        </SwipeableQueueItem>
      ))}
    </div>
  ),
};
