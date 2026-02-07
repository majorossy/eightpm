import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import FacebookWidget from './FacebookWidget';

const meta = {
  title: 'Artist/Social/FacebookWidget',
  component: FacebookWidget,
  tags: ['autodocs'],
} satisfies Meta<typeof FacebookWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    artistName: 'Railroad Earth',
    url: 'https://facebook.com/railroadearth',
  },
};

export const NoUrl: Story = {
  args: {
    artistName: 'Railroad Earth',
  },
};
