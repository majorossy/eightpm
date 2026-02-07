import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import BandBiography from './BandBiography';
import { mockWikipediaSummary } from '../../.storybook/fixtures';

const meta = {
  title: 'Artist/BandBiography',
  component: BandBiography,
  tags: ['autodocs'],
} satisfies Meta<typeof BandBiography>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    biography: 'Railroad Earth is an American jam band from Stillwater, New Jersey, formed in 2001.',
    wikipediaSummary: mockWikipediaSummary,
    extendedBio:
      'Railroad Earth is an American jam band from Stillwater, New Jersey, formed in 2001 by singer-songwriter Todd Sheaffer after the breakup of From Good Homes.\n\nThe band blends elements of bluegrass, folk, rock, country, jazz, and Celtic music into a unique sound they describe as "a mixture of Appalachian folk and bluegrass with electric rock."',
  },
};

export const WikipediaOnly: Story = {
  args: {
    wikipediaSummary: mockWikipediaSummary,
  },
};

export const ShortBioOnly: Story = {
  args: {
    biography: 'Railroad Earth is an American jam band from Stillwater, New Jersey, formed in 2001.',
  },
};

export const WithImages: Story = {
  args: {
    biography: 'Railroad Earth is an American jam band from Stillwater, New Jersey.',
    wikipediaSummary: mockWikipediaSummary,
    images: [
      {
        url: '/images/default-album.jpg',
        caption: 'Live at Red Rocks 2024',
        credit: 'Festival Photographer',
      },
      {
        url: '/images/default-artist.jpg',
        caption: 'Backstage at Bonnaroo',
        credit: 'Tour Photography',
      },
    ],
  },
};

export const NoData: Story = {
  args: {},
};
