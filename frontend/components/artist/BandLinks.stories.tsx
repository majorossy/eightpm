import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import BandLinks from './BandLinks';

const meta = {
  title: 'Artist/BandLinks',
  component: BandLinks,
  tags: ['autodocs'],
} satisfies Meta<typeof BandLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    artistName: 'Railroad Earth',
    links: {
      website: 'https://railroadearth.com',
      youtube: 'https://youtube.com/railroadearth',
      facebook: 'https://facebook.com/railroadearth',
      instagram: 'https://instagram.com/railroadearth',
      twitter: 'https://twitter.com/railroadearth',
      wikipedia: 'https://en.wikipedia.org/wiki/Railroad_Earth',
    },
  },
};

export const FewLinks: Story = {
  args: {
    artistName: 'Railroad Earth',
    links: {
      website: 'https://railroadearth.com',
      facebook: 'https://facebook.com/railroadearth',
    },
  },
};

export const SingleLink: Story = {
  args: {
    artistName: 'Railroad Earth',
    links: {
      website: 'https://railroadearth.com',
    },
  },
};

export const NoLinks: Story = {
  args: {
    artistName: 'Railroad Earth',
    links: {},
  },
};
