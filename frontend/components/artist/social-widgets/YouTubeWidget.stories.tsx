import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import YouTubeWidget from './YouTubeWidget';

const meta = {
  title: 'Artist/Social/YouTubeWidget',
  component: YouTubeWidget,
  tags: ['autodocs'],
} satisfies Meta<typeof YouTubeWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ChannelUrl: Story = {
  args: {
    artistName: 'Railroad Earth',
    url: 'https://youtube.com/channel/UCrailroadearth',
  },
};

export const AtHandleUrl: Story = {
  args: {
    artistName: 'Railroad Earth',
    url: 'https://youtube.com/@railroadearth',
  },
};

export const NoChannel: Story = {
  args: {
    artistName: 'Railroad Earth',
    url: 'https://youtube.com/watch?v=abc123',
  },
};

export const NoUrl: Story = {
  args: {
    artistName: 'Railroad Earth',
  },
};
