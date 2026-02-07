import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import AlbumCard from './AlbumCard';
import { mockAlbum } from '../.storybook/fixtures';

const meta = {
  title: 'Cards/AlbumCard',
  component: AlbumCard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ maxWidth: 220 }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AlbumCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { album: mockAlbum },
};

export const ComingSoon: Story = {
  args: {
    album: { ...mockAlbum, totalSongs: 0, totalTracks: 0 },
  },
};

export const NoCoverArt: Story = {
  args: {
    album: { ...mockAlbum, coverArt: undefined },
  },
};

export const LongTitle: Story = {
  args: {
    album: {
      ...mockAlbum,
      name: 'Railroad Earth Live at Red Rocks Amphitheatre Morrison Colorado with Special Guests',
    },
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
      <AlbumCard album={mockAlbum} />
      <AlbumCard album={{ ...mockAlbum, id: '2', name: 'Night Two', showDate: '2024-01-02' }} />
      <AlbumCard album={{ ...mockAlbum, id: '3', coverArt: undefined, name: 'No Art Show' }} />
      <AlbumCard album={{ ...mockAlbum, id: '4', totalSongs: 0, name: 'Coming Soon Show' }} />
    </>
  ),
};
