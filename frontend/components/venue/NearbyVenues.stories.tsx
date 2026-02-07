import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import NearbyVenues from './NearbyVenues';

const meta = {
  title: 'Venue/NearbyVenues',
  component: NearbyVenues,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Fetches nearby venues via API on mount. Stories show the loading/empty state since no API is available in Storybook.',
      },
    },
  },
} satisfies Meta<typeof NearbyVenues>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { venueSlug: 'red-rocks-amphitheatre' },
};

export const DifferentVenue: Story = {
  args: { venueSlug: 'the-capitol-theatre' },
};
