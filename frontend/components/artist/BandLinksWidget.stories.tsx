import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import BandLinksWidget from './BandLinksWidget';

const meta = {
  title: 'Artist/BandLinksWidget',
  component: BandLinksWidget,
  tags: ['autodocs'],
  args: {
    onClose: fn(),
  },
} satisfies Meta<typeof BandLinksWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const YouTube: Story = {
  args: {
    platform: 'youtube',
    artistName: 'Railroad Earth',
    url: 'https://youtube.com/channel/UCrailroadearth',
  },
};

export const Twitter: Story = {
  args: {
    platform: 'twitter',
    artistName: 'Railroad Earth',
    url: 'https://twitter.com/railroadearth',
  },
};

export const Facebook: Story = {
  args: {
    platform: 'facebook',
    artistName: 'Railroad Earth',
    url: 'https://facebook.com/railroadearth',
  },
};

export const Instagram: Story = {
  args: {
    platform: 'instagram',
    artistName: 'Railroad Earth',
    url: 'https://instagram.com/railroadearth',
  },
};

export const Website: Story = {
  args: {
    platform: 'website',
    artistName: 'Railroad Earth',
    url: 'https://railroadearth.com',
  },
};

export const Wikipedia: Story = {
  args: {
    platform: 'wikipedia',
    artistName: 'Railroad Earth',
    url: 'https://en.wikipedia.org/wiki/Railroad_Earth',
  },
};
