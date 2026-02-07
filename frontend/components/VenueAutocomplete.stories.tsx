import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { VenueAutocomplete } from './VenueAutocomplete';

const venueSuggestions = [
  'Red Rocks Amphitheatre',
  'The Capitol Theatre',
  'Madison Square Garden',
  'The Fillmore',
  'Telluride Town Park',
  'Bonnaroo Music Festival',
  'Radio City Music Hall',
  'Red Butte Garden',
  'The Regal Theatre',
];

const meta = {
  title: 'Forms/VenueAutocomplete',
  component: VenueAutocomplete,
  tags: ['autodocs'],
  args: {
    onChange: fn(),
    suggestions: venueSuggestions,
  },
} satisfies Meta<typeof VenueAutocomplete>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    value: '',
    placeholder: 'Search venue...',
  },
};

export const WithValue: Story = {
  args: {
    value: 'Red Rocks Amphitheatre',
  },
};

export const Disabled: Story = {
  args: {
    value: '',
    disabled: true,
    placeholder: 'Venue search disabled',
  },
};

export const NoSuggestions: Story = {
  args: {
    value: '',
    suggestions: [],
    placeholder: 'No venues available',
  },
};
