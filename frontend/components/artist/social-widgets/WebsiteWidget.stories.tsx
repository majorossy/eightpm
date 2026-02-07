import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import WebsiteWidget from './WebsiteWidget';

const meta = {
  title: 'Artist/Social/WebsiteWidget',
  component: WebsiteWidget,
  tags: ['autodocs'],
} satisfies Meta<typeof WebsiteWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    url: 'https://railroadearth.com',
  },
};

export const WikipediaUrl: Story = {
  args: {
    url: 'https://en.wikipedia.org/wiki/Railroad_Earth',
  },
};

export const NoUrl: Story = {
  args: {},
};
