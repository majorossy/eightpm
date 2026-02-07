import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import VersionCarousel from './VersionCarousel';
import { mockSong, mockSong2, mockSong3 } from '../.storybook/fixtures';
import type { Song } from '../lib/types';

const moreSongs: Song[] = [
  { ...mockSong, id: 'v-1', showDate: '2022-06-15', showVenue: 'The Fillmore', showLocation: 'San Francisco, CA', avgRating: 4.2, numReviews: 8 },
  { ...mockSong, id: 'v-2', showDate: '2023-08-20', showVenue: 'Red Rocks Amphitheatre', showLocation: 'Morrison, CO', avgRating: 4.8, numReviews: 22 },
  { ...mockSong, id: 'v-3', showDate: '2024-01-01', showVenue: 'The Capitol Theatre', showLocation: 'Port Chester, NY', avgRating: 4.5, numReviews: 14 },
  { ...mockSong, id: 'v-4', showDate: '2021-03-10', showVenue: 'Madison Square Garden', showLocation: 'New York, NY', avgRating: 3.9, numReviews: 6 },
];

const meta = {
  title: 'Cards/VersionCarousel',
  component: VersionCarousel,
  tags: ['autodocs'],
  args: {
    onSelect: fn(),
    onPlay: fn(),
    onAddToQueue: fn(),
    isPlaying: false,
  },
} satisfies Meta<typeof VersionCarousel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    songs: moreSongs,
    selectedIndex: 0,
  },
};

export const SingleVersion: Story = {
  args: {
    songs: [mockSong],
    selectedIndex: 0,
  },
};

export const WithPlayingTrack: Story = {
  args: {
    songs: moreSongs,
    selectedIndex: 1,
    currentSongId: moreSongs[1].id,
    isPlaying: true,
  },
};

export const WithQueuedItem: Story = {
  args: {
    songs: moreSongs,
    selectedIndex: 0,
    isInQueue: (id: string) => id === moreSongs[2].id,
  },
};
