import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import RelatedArtists from './RelatedArtists';
import type { RelatedArtist } from './RelatedArtists';

const relatedArtists: RelatedArtist[] = [
  { slug: 'gratefuldead', name: 'Grateful Dead', showCount: 1861, genres: ['Psychedelic Rock', 'Jam Band'] },
  { slug: 'phish', name: 'Phish', showCount: 2500, genres: ['Jam Band', 'Progressive Rock'] },
  { slug: 'widespreadpanic', name: 'Widespread Panic', showCount: 800, genres: ['Southern Rock', 'Jam Band'] },
  { slug: 'sts9', name: 'STS9', showCount: 450, genres: ['Jam Band', 'Electronic'] },
];

const meta = {
  title: 'Artist/RelatedArtists',
  component: RelatedArtists,
  tags: ['autodocs'],
} satisfies Meta<typeof RelatedArtists>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    currentArtistName: 'Railroad Earth',
    relatedArtists,
  },
};

export const TwoArtists: Story = {
  args: {
    currentArtistName: 'Railroad Earth',
    relatedArtists: relatedArtists.slice(0, 2),
  },
};

export const Empty: Story = {
  args: {
    currentArtistName: 'Railroad Earth',
    relatedArtists: [],
  },
};
