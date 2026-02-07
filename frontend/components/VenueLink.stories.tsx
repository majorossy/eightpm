import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import VenueLink from './VenueLink';

const meta = {
  title: 'Cards/VenueLink',
  component: VenueLink,
  tags: ['autodocs'],
} satisfies Meta<typeof VenueLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    venueName: 'Red Rocks Amphitheatre',
  },
};

export const Truncated: Story = {
  args: {
    venueName: 'Red Rocks Amphitheatre, Morrison, Colorado',
    truncateLength: 25,
  },
};

export const CustomClass: Story = {
  args: {
    venueName: 'Madison Square Garden',
    className: 'text-[#d4a060] hover:text-[#c08a40] underline',
  },
};

export const Empty: Story = {
  args: {
    venueName: undefined,
  },
};
