import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import FestivalHero from './FestivalHero';
import { FestivalSortProvider } from '@/context/FestivalSortContext';
import { mockArtist, mockArtist2 } from '../.storybook/fixtures';

// Build LineupArtist[] from mock data
const lineupArtists = [
  {
    name: 'Railroad Earth',
    slug: 'railroadearth',
    songCount: 955,
    albumCount: 120,
    totalShows: 120,
    mostPlayedTrack: 'Bird in a House',
    totalRecordings: 955,
    totalHours: 520,
    totalVenues: 85,
    formationYear: 2001,
  },
  {
    name: 'Grateful Dead',
    slug: 'gratefuldead',
    songCount: 14000,
    albumCount: 1861,
    totalShows: 2300,
    mostPlayedTrack: 'Playing in the Band',
    totalRecordings: 14000,
    totalHours: 8500,
    totalVenues: 350,
    formationYear: 1965,
  },
  {
    name: 'Phish',
    slug: 'phish',
    songCount: 8000,
    albumCount: 1200,
    totalShows: 1800,
    mostPlayedTrack: 'You Enjoy Myself',
    totalRecordings: 8000,
    totalHours: 6000,
    totalVenues: 280,
    formationYear: 1983,
  },
  {
    name: 'moe.',
    slug: 'moe',
    songCount: 1803,
    albumCount: 400,
    totalShows: 600,
    mostPlayedTrack: 'Rebubula',
    totalRecordings: 1803,
    totalHours: 1200,
    totalVenues: 150,
    formationYear: 1989,
  },
  {
    name: 'Goose',
    slug: 'goose',
    songCount: 286,
    albumCount: 80,
    totalShows: 200,
    totalRecordings: 286,
    totalHours: 180,
    totalVenues: 60,
    formationYear: 2014,
  },
  {
    name: 'Billy Strings',
    slug: 'billystrings',
    songCount: 326,
    albumCount: 90,
    totalShows: 250,
    totalRecordings: 326,
    totalHours: 200,
    totalVenues: 70,
    formationYear: 2012,
  },
];

const meta = {
  title: 'Navigation/FestivalHero',
  component: FestivalHero,
  tags: ['autodocs'],
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/' } },
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <FestivalSortProvider artists={lineupArtists}>
        <Story />
      </FestivalSortProvider>
    ),
  ],
} satisfies Meta<typeof FestivalHero>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    artists: lineupArtists,
    onStartListening: fn(),
  },
};

export const FewArtists: Story = {
  args: {
    artists: lineupArtists.slice(0, 3),
    onStartListening: fn(),
  },
};

export const SingleArtist: Story = {
  args: {
    artists: [lineupArtists[0]],
    onStartListening: fn(),
  },
};
