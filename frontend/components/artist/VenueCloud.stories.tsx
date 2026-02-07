import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import VenueCloud from './VenueCloud';
import { mockArtistVenues } from '../../.storybook/fixtures';

// VenueCloud fetches data internally via getArtistVenues.
// In Storybook, the API call will fail so we mock the module.
const meta = {
  title: 'Artist/VenueCloud',
  component: VenueCloud,
  tags: ['autodocs'],
  parameters: {
    // Stories will show loading/empty state since API is not available
    docs: {
      description: {
        component:
          'Word cloud of venues an artist has played at. Fetches data via API, so stories show the loading/empty state. Use the mock loader below for a visual preview.',
      },
    },
  },
} satisfies Meta<typeof VenueCloud>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    artistId: 'cat-rre',
    artistName: 'Railroad Earth',
  },
};

/**
 * Since VenueCloud fetches internally, we render a visual approximation
 * using the same styling to show what the cloud looks like with data.
 */
export const VisualPreview: Story = {
  args: {
    artistId: 'cat-rre',
    artistName: 'Railroad Earth',
  },
  render: () => {
    const venues = mockArtistVenues;
    const counts = venues.map(v => v.recording_count);
    const minCount = Math.min(...counts);
    const maxCount = Math.max(...counts);

    function getFontSize(count: number): number {
      if (maxCount === minCount) return 24;
      const ratio = (count - minCount) / (maxCount - minCount);
      return 12 + ratio * 24;
    }

    function getColor(count: number): string {
      if (maxCount === minCount) return '#d4a060';
      const ratio = (count - minCount) / (maxCount - minCount);
      const r = Math.round(138 + ratio * (232 - 138));
      const g = Math.round(122 + ratio * (160 - 122));
      const b = Math.round(104 + ratio * (80 - 104));
      return `rgb(${r}, ${g}, ${b})`;
    }

    return (
      <div className="mt-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(168,128,96,0.25))' }} />
          <h2 className="text-[#8a7a68] text-[11px] tracking-[4px] uppercase">Venues Played</h2>
          <div className="flex-1 h-px" style={{ background: 'linear-gradient(90deg, rgba(168,128,96,0.25), transparent)' }} />
        </div>
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 py-4">
          {venues.map(venue => (
            <span
              key={venue.venue_slug}
              className="hover:underline transition-all hover:scale-110 inline-block cursor-pointer"
              style={{ fontSize: `${getFontSize(venue.recording_count)}px`, color: getColor(venue.recording_count) }}
              title={`${venue.venue_name} - ${venue.city}, ${venue.state} - ${venue.recording_count} recordings`}
            >
              {venue.venue_name}
            </span>
          ))}
        </div>
      </div>
    );
  },
};
