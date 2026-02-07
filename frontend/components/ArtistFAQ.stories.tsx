import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ArtistFAQ from './ArtistFAQ';

const meta = {
  title: 'Artist/ArtistFAQ',
  component: ArtistFAQ,
  tags: ['autodocs'],
} satisfies Meta<typeof ArtistFAQ>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    artistName: 'Railroad Earth',
    totalShows: 120,
    yearsActive: '2001-present',
    genres: ['Jam Band', 'Bluegrass', 'Americana'],
    originLocation: 'Stillwater, New Jersey',
    mostPlayedTrack: 'Bird in a House',
  },
};

export const MinimalData: Story = {
  args: {
    artistName: 'Grateful Dead',
  },
};

export const WithOriginNoYears: Story = {
  args: {
    artistName: 'Phish',
    totalShows: 2500,
    originLocation: 'Burlington, Vermont',
    genres: ['Jam Band', 'Progressive Rock'],
  },
};
