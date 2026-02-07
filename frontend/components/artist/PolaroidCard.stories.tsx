import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import PolaroidCard from './PolaroidCard';

const meta = {
  title: 'Artist/PolaroidCard',
  component: PolaroidCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ display: 'flex', justifyContent: 'center', paddingTop: '2rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PolaroidCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    artistName: 'Railroad Earth',
    caption: 'Railroad Earth',
  },
};

export const NoImage: Story = {
  args: {
    artistName: 'Railroad Earth',
  },
};

export const WithSocialLinks: Story = {
  args: {
    artistName: 'Railroad Earth',
    socialLinks: {
      website: 'https://railroadearth.com',
      facebook: 'https://facebook.com/railroadearth',
      instagram: 'https://instagram.com/railroadearth',
      twitter: 'https://twitter.com/railroadearth',
      youtube: 'https://youtube.com/railroadearth',
    },
  },
};

export const WithAttribution: Story = {
  args: {
    artistName: 'Railroad Earth',
    wikipediaThumbnail: {
      source: '/images/default-artist.jpg',
      width: 300,
      height: 400,
    },
    imageAttribution: {
      artist: 'Photographer Name',
      license: 'CC BY-SA 4.0',
      licenseUrl: 'https://creativecommons.org/licenses/by-sa/4.0/',
    },
  },
};
