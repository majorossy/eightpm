import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import TaperNotes from './TaperNotes';
import { mockSong, mockTrack } from '../.storybook/fixtures';

const songWithLineage = {
  ...mockSong,
  taper: 'Charlie Miller',
  source: 'Schoeps MK4V > Lunatec V2 > Sound Devices 744t',
  lineage: 'Soundboard > DAT > CD > FLAC',
  notes: 'Excellent recording quality throughout. Minor crowd noise during encore.',
};

const meta = {
  title: 'Player/TaperNotes',
  component: TaperNotes,
  tags: ['autodocs'],
} satisfies Meta<typeof TaperNotes>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithFullMetadata: Story = {
  args: {
    song: songWithLineage,
    artistName: 'Railroad Earth',
    showVenue: 'Red Rocks Amphitheatre',
    showDate: '2024-01-01',
  },
};

export const AudienceRecording: Story = {
  args: {
    song: {
      ...mockSong,
      taper: 'Rob Daniels',
      source: 'DPA 4023 > Naiant PFA > Tascam DR-680',
      lineage: 'Audience > DAT > FLAC',
    },
    artistName: 'Railroad Earth',
    showVenue: 'The Capitol Theatre',
    showDate: '2023-07-15',
  },
};

export const MinimalMetadata: Story = {
  args: {
    song: {
      ...mockSong,
      taper: undefined,
      source: 'Unknown',
      lineage: undefined,
      notes: undefined,
    },
  },
};

export const WithTrack: Story = {
  args: {
    track: {
      ...mockTrack,
      songs: [songWithLineage],
    },
    albumName: 'Railroad Earth Live at Red Rocks',
  },
};
