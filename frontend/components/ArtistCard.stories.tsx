import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ArtistCard from './ArtistCard';
import { mockArtist } from '../.storybook/fixtures';

const meta = {
  title: 'Cards/ArtistCard',
  component: ArtistCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 220 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ArtistCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { artist: mockArtist },
};

export const NoImage: Story = {
  args: {
    artist: { ...mockArtist, image: '' },
  },
};

export const DefaultImage: Story = {
  args: {
    artist: { ...mockArtist, image: '/images/default-artist.jpg' },
  },
};

export const LongName: Story = {
  args: {
    artist: { ...mockArtist, name: 'The String Cheese Incident' },
  },
};

export const Grid: Story = {
  decorators: [
    (Story) => (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem', maxWidth: 800 }}>
        <Story />
      </div>
    ),
  ],
  render: () => (
    <>
      <ArtistCard artist={mockArtist} />
      <ArtistCard artist={{ ...mockArtist, id: '2', name: 'Grateful Dead', slug: 'gratefuldead' }} />
      <ArtistCard artist={{ ...mockArtist, id: '3', name: 'Phish', slug: 'phish', image: '' }} />
      <ArtistCard artist={{ ...mockArtist, id: '4', name: 'moe.', slug: 'moe' }} />
    </>
  ),
};
