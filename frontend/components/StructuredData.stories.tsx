import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import StructuredData from './StructuredData';

const meta = {
  title: 'Primitives/StructuredData',
  component: StructuredData,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Renders Schema.org JSON-LD in a script tag for SEO. Not visually rendered.',
      },
    },
  },
} satisfies Meta<typeof StructuredData>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MusicRecording: Story = {
  args: {
    data: {
      '@context': 'https://schema.org',
      '@type': 'MusicRecording',
      name: 'Bird in a House',
      byArtist: { '@type': 'MusicGroup', name: 'Railroad Earth' },
      duration: 'PT5M42S',
      inAlbum: { '@type': 'MusicAlbum', name: 'Railroad Earth Live at Red Rocks' },
    },
  },
};

export const MusicEvent: Story = {
  args: {
    data: {
      '@context': 'https://schema.org',
      '@type': 'MusicEvent',
      name: 'Railroad Earth Live at Red Rocks',
      startDate: '2024-01-01',
      location: { '@type': 'Place', name: 'Red Rocks Amphitheatre', address: 'Morrison, CO' },
      performer: { '@type': 'MusicGroup', name: 'Railroad Earth' },
    },
  },
};
