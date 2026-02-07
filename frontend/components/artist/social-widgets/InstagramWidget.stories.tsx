import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import InstagramWidget from './InstagramWidget';

const meta = {
  title: 'Artist/Social/InstagramWidget',
  component: InstagramWidget,
  tags: ['autodocs'],
} satisfies Meta<typeof InstagramWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    artistName: 'Railroad Earth',
    url: 'https://instagram.com/railroadearth',
  },
};

export const NoUsername: Story = {
  args: {
    artistName: 'Railroad Earth',
    url: 'https://example.com',
  },
};

export const NoUrl: Story = {
  args: {
    artistName: 'Railroad Earth',
  },
};
