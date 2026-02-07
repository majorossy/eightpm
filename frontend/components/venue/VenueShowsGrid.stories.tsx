import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import VenueShowsGrid from './VenueShowsGrid';
import { mockVenueShows } from '../../.storybook/fixtures';

const meta = {
  title: 'Venue/VenueShowsGrid',
  component: VenueShowsGrid,
  tags: ['autodocs'],
} satisfies Meta<typeof VenueShowsGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithInitialShows: Story = {
  args: {
    venueSlug: 'red-rocks-amphitheatre',
    initialShows: mockVenueShows,
    initialTotalCount: mockVenueShows.length,
  },
};

export const Empty: Story = {
  args: {
    venueSlug: 'empty-venue',
    initialShows: [],
    initialTotalCount: 0,
  },
};

export const SingleShow: Story = {
  args: {
    venueSlug: 'red-rocks-amphitheatre',
    initialShows: [mockVenueShows[0]],
    initialTotalCount: 1,
  },
};

export const ManyShows: Story = {
  args: {
    venueSlug: 'red-rocks-amphitheatre',
    initialShows: [
      ...mockVenueShows,
      {
        identifier: 'moe2022-06-15',
        name: 'moe. Live at Red Rocks',
        show_date: '2022-06-15',
        artist_name: 'moe.',
        artist_slug: 'moe',
        track_count: 14,
        recording_types: ['SBD'],
      },
      {
        identifier: 'SCI2019-07-20',
        name: 'String Cheese Incident at Red Rocks',
        show_date: '2019-07-20',
        artist_name: 'String Cheese Incident',
        artist_slug: 'thestringcheeseincident',
        track_count: 20,
        recording_types: ['MX'],
      },
      {
        identifier: 'WSP2018-04-14',
        name: 'Widespread Panic at Red Rocks',
        show_date: '2018-04-14',
        artist_name: 'Widespread Panic',
        artist_slug: 'widespreadpanic',
        track_count: 16,
        recording_types: ['AUD'],
      },
    ],
    initialTotalCount: 6,
  },
};

export const NoRecordingType: Story = {
  args: {
    venueSlug: 'red-rocks-amphitheatre',
    initialShows: [
      {
        identifier: 'UnknownBand2020-01-01',
        name: 'Unknown Band at Red Rocks',
        show_date: '2020-01-01',
        artist_name: 'Unknown Band',
        artist_slug: 'unknownband',
        track_count: 10,
        recording_types: [],
      },
    ],
    initialTotalCount: 1,
  },
};
