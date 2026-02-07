import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import VenueMap from './VenueMap';

const meta = {
  title: 'Venue/VenueMap',
  component: VenueMap,
  tags: ['autodocs'],
  parameters: {
    docs: { disable: true },
    layout: 'fullscreen',
  },
} satisfies Meta<typeof VenueMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
