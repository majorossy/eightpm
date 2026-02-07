import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import AlbumCarousel from './AlbumCarousel';
import { mockAlbum, mockAlbum2, mockAlbums } from '../.storybook/fixtures';
import type { Album } from '../lib/types';

const manyAlbums: Album[] = [
  mockAlbum,
  mockAlbum2,
  { ...mockAlbum, id: 'a3', slug: 'a3', name: 'Live at The Fillmore', showDate: '2022-03-10', showVenue: 'The Fillmore', totalTracks: 14 },
  { ...mockAlbum, id: 'a4', slug: 'a4', name: 'Live at Telluride', showDate: '2023-06-20', showVenue: 'Telluride Town Park', totalTracks: 11, coverArt: undefined },
  { ...mockAlbum, id: 'a5', slug: 'a5', name: 'Live at MSG', showDate: '2024-12-31', showVenue: 'Madison Square Garden', totalTracks: 18 },
];

const meta = {
  title: 'Cards/AlbumCarousel',
  component: AlbumCarousel,
  tags: ['autodocs'],
} satisfies Meta<typeof AlbumCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    albums: manyAlbums,
    artistSlug: 'railroadearth',
  },
};

export const TwoAlbums: Story = {
  args: {
    albums: mockAlbums,
    artistSlug: 'railroadearth',
  },
};

export const Empty: Story = {
  args: {
    albums: [],
    artistSlug: 'railroadearth',
  },
};
