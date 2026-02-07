import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import BandStatistics from './BandStatistics';

const meta = {
  title: 'Artist/BandStatistics',
  component: BandStatistics,
  tags: ['autodocs'],
} satisfies Meta<typeof BandStatistics>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    statistics: {
      totalShows: 120,
      totalVenues: 85,
      mostPlayedTrack: { title: 'Bird in a House', playCount: 245 },
      recordingStats: { total: 955, sources: { SBD: 210, AUD: 745 } },
      yearsActive: { first: 2001, last: 2024 },
      totalHours: 520,
    },
  },
};

export const MinimalStats: Story = {
  args: {
    statistics: {
      totalShows: 45,
      recordingStats: { total: 200 },
    },
  },
};

export const LargeCatalog: Story = {
  args: {
    statistics: {
      totalShows: 2500,
      totalVenues: 450,
      mostPlayedTrack: { title: 'Scarlet Begonias', playCount: 1200 },
      recordingStats: { total: 14000, sources: { SBD: 3500, AUD: 10500 } },
      yearsActive: { first: 1965, last: 1995 },
      totalHours: 8500,
    },
  },
};

export const NoStatistics: Story = {
  args: {},
};
