import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ArtistCloud from './ArtistCloud';
import { mockVenueArtists } from '../../.storybook/fixtures';

const meta = {
  title: 'Venue/ArtistCloud',
  component: ArtistCloud,
  tags: ['autodocs'],
} satisfies Meta<typeof ArtistCloud>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { artists: mockVenueArtists },
};

export const Empty: Story = {
  args: { artists: [] },
};

export const SingleArtist: Story = {
  args: { artists: [{ name: 'Railroad Earth', slug: 'railroadearth', show_count: 10 }] },
};

export const ManyArtists: Story = {
  args: {
    artists: [
      ...mockVenueArtists,
      { name: 'moe.', slug: 'moe', show_count: 4 },
      { name: 'Leftover Salmon', slug: 'leftoversalmon', show_count: 3 },
      { name: 'Keller Williams', slug: 'kellerwilliams', show_count: 14 },
      { name: 'Goose', slug: 'goose', show_count: 2 },
      { name: 'Billy Strings', slug: 'billystrings', show_count: 9 },
      { name: 'Lettuce', slug: 'lettuce', show_count: 1 },
      { name: 'My Morning Jacket', slug: 'mymorningjacket', show_count: 7 },
      { name: 'Disco Biscuits', slug: 'discobiscuits', show_count: 11 },
      { name: 'STS9', slug: 'sts9', show_count: 6 },
      { name: 'Umphrey\'s McGee', slug: 'umphreysmcgee', show_count: 13 },
    ],
  },
};

export const EqualCounts: Story = {
  args: {
    artists: [
      { name: 'Railroad Earth', slug: 'railroadearth', show_count: 5 },
      { name: 'Grateful Dead', slug: 'gratefuldead', show_count: 5 },
      { name: 'Phish', slug: 'phish', show_count: 5 },
    ],
  },
};
