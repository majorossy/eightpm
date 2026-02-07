import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { SearchFilters } from './SearchFilters';

const availableYears = [2024, 2023, 2022, 2021, 2020, 2019, 2018];
const availableArtists = [
  { slug: 'railroadearth', name: 'Railroad Earth' },
  { slug: 'gratefuldead', name: 'Grateful Dead' },
  { slug: 'phish', name: 'Phish' },
  { slug: 'sts9', name: 'STS9' },
];
const availableVenues = [
  'Red Rocks Amphitheatre',
  'The Capitol Theatre',
  'Madison Square Garden',
  'The Fillmore',
  'Telluride Town Park',
  'Bonnaroo Music Festival',
];

const meta = {
  title: 'Forms/SearchFilters',
  component: SearchFilters,
  tags: ['autodocs'],
  args: {
    onFiltersChange: fn(),
  },
} satisfies Meta<typeof SearchFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    filters: {},
    availableYears,
    availableArtists,
    availableVenues,
  },
};

export const WithActiveFilters: Story = {
  args: {
    filters: {
      year: 2023,
      isSoundboard: true,
    },
    availableYears,
    availableArtists,
    availableVenues,
  },
};

export const AllFiltersActive: Story = {
  args: {
    filters: {
      year: 2024,
      artist: 'railroadearth',
      venue: 'Red Rocks Amphitheatre',
      isSoundboard: true,
      minRating: 4,
    },
    availableYears,
    availableArtists,
    availableVenues,
  },
};

export const NoArtists: Story = {
  args: {
    filters: {},
    availableYears,
    availableVenues,
  },
};
