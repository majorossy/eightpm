import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ExpandedBiography from './ExpandedBiography';

const longBio = `Railroad Earth is an American jam band from Stillwater, New Jersey, formed in 2001 by singer-songwriter Todd Sheaffer after the breakup of From Good Homes.

The band blends elements of bluegrass, folk, rock, country, jazz, and Celtic music into a unique sound they describe as "a mixture of Appalachian folk and bluegrass with electric rock."

Their live performances are known for extended improvisational jams that can stretch songs well beyond their studio versions. The band has headlined major festivals including Bonnaroo, Telluride Bluegrass Festival, and Floyd Fest.

Over two decades of touring, Railroad Earth has built a dedicated fanbase through their energetic live shows and a commitment to musical exploration that sets each performance apart.

The loss of founding member Andy Goessling in 2018 marked a significant turning point for the band, but they have continued to perform and record in his memory, honoring his contributions to their sound.`;

const meta = {
  title: 'Artist/ExpandedBiography',
  component: ExpandedBiography,
  tags: ['autodocs'],
} satisfies Meta<typeof ExpandedBiography>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithExtendedBio: Story = {
  args: {
    artistName: 'Railroad Earth',
    extendedBio: longBio,
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Railroad_Earth',
    totalShows: 120,
    yearsActive: '2001-present',
    genres: ['Jam Band', 'Bluegrass', 'Americana'],
    originLocation: 'Stillwater, New Jersey',
    formationDate: '2001',
  },
};

export const ShortBioWithSupplement: Story = {
  args: {
    artistName: 'Railroad Earth',
    wikipediaExtract: 'Railroad Earth is an American jam band from Stillwater, New Jersey.',
    wikipediaUrl: 'https://en.wikipedia.org/wiki/Railroad_Earth',
    totalShows: 120,
    yearsActive: '2001-present',
    genres: ['Jam Band', 'Bluegrass'],
    originLocation: 'Stillwater, New Jersey',
  },
};

export const NoBio: Story = {
  args: {
    artistName: 'Railroad Earth',
    totalShows: 120,
    yearsActive: '2001-present',
    genres: ['Jam Band'],
  },
};
