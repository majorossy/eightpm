import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import VenueArtistsGrid from './VenueArtistsGrid';
import { mockVenueArtists } from '../../.storybook/fixtures';

const meta = {
  title: 'Venue/VenueArtistsGrid',
  component: VenueArtistsGrid,
  tags: ['autodocs'],
} satisfies Meta<typeof VenueArtistsGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { artists: mockVenueArtists },
};

export const SingleArtist: Story = {
  args: { artists: [mockVenueArtists[0]] },
};

export const Empty: Story = {
  args: { artists: [] },
};

export const ManyArtists: Story = {
  args: {
    artists: [
      ...mockVenueArtists,
      { name: 'moe.', slug: 'moe', show_count: 4 },
      { name: 'Leftover Salmon', slug: 'leftoversalmon', show_count: 3 },
      { name: 'Keller Williams', slug: 'kellerwilliams', show_count: 3 },
      { name: 'Goose', slug: 'goose', show_count: 2 },
      { name: 'Billy Strings', slug: 'billystrings', show_count: 2 },
      { name: 'Lettuce', slug: 'lettuce', show_count: 1 },
      { name: 'My Morning Jacket', slug: 'mymorningjacket', show_count: 1 },
      { name: 'Disco Biscuits', slug: 'discobiscuits', show_count: 1 },
    ],
  },
};
