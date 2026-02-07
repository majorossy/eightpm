import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import VenueMapClient from './VenueMapClient';

const meta = {
  title: 'Venue/VenueMapClient',
  component: VenueMapClient,
  tags: ['autodocs'],
  parameters: {
    docs: { disable: true },
    layout: 'fullscreen',
  },
} satisfies Meta<typeof VenueMapClient>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
