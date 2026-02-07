import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import VenueHeader from './VenueHeader';
import { mockVenue, mockVenue2 } from '../../.storybook/fixtures';

const meta = {
  title: 'Venue/VenueHeader',
  component: VenueHeader,
  tags: ['autodocs'],
} satisfies Meta<typeof VenueHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { venue: mockVenue },
};

export const DifferentVenue: Story = {
  args: { venue: mockVenue2 },
};

export const NoDateRange: Story = {
  args: {
    venue: {
      ...mockVenue,
      first_show_date: undefined,
      last_show_date: undefined,
    },
  },
};

export const NoLocation: Story = {
  args: {
    venue: {
      ...mockVenue,
      city: undefined,
      state: undefined,
      country: undefined,
    },
  },
};

export const CityOnly: Story = {
  args: {
    venue: {
      ...mockVenue,
      state: undefined,
      country: undefined,
    },
  },
};
