import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import VenueStats from './VenueStats';
import { mockVenue, mockVenue3 } from '../../.storybook/fixtures';

const meta = {
  title: 'Venue/VenueStats',
  component: VenueStats,
  tags: ['autodocs'],
} satisfies Meta<typeof VenueStats>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { venue: mockVenue },
};

export const HighNumbers: Story = {
  args: { venue: mockVenue3 },
};

export const SingleShowVenue: Story = {
  args: {
    venue: {
      ...mockVenue,
      total_shows: 1,
      total_artists: 1,
      total_tracks: 8,
    },
  },
};
