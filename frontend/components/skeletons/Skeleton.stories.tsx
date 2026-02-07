import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  Skeleton,
  SkeletonCard,
  SkeletonTrack,
  SkeletonArtistHeader,
  SkeletonAlbumGrid,
  SkeletonCassette,
  SkeletonAlbumHeader,
  SkeletonTrackRow,
  SkeletonAlbumPage,
  SkeletonFestivalHero,
  SkeletonAlbumGridHome,
  SkeletonHomePage,
  SkeletonPolaroid,
  SkeletonArtistHero,
  SkeletonDiscographyCarousel,
  SkeletonArtistBio,
  SkeletonArtistPage,
  SkeletonSearchPage,
  SkeletonPlaylistsPage,
  SkeletonPlaylistDetail,
} from './Skeleton';

const meta = {
  title: 'Primitives/Skeletons',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

export const Base: StoryObj = {
  render: () => <Skeleton className="h-8 w-48" />,
};

export const Card: StoryObj = {
  render: () => (
    <div style={{ width: 200 }}>
      <SkeletonCard />
    </div>
  ),
};

export const Track: StoryObj = {
  render: () => <SkeletonTrack />,
};

export const ArtistHeader: StoryObj = {
  render: () => <SkeletonArtistHeader />,
};

export const AlbumGrid: StoryObj = {
  render: () => <SkeletonAlbumGrid />,
};

export const Cassette: StoryObj = {
  render: () => <SkeletonCassette />,
};

export const AlbumHeader: StoryObj = {
  render: () => <SkeletonAlbumHeader />,
};

export const TrackRow: StoryObj = {
  render: () => <SkeletonTrackRow />,
};

export const AlbumPage: StoryObj = {
  render: () => <SkeletonAlbumPage />,
};

export const FestivalHero: StoryObj = {
  render: () => <SkeletonFestivalHero />,
};

export const AlbumGridHome: StoryObj = {
  render: () => <SkeletonAlbumGridHome />,
};

export const HomePage: StoryObj = {
  render: () => <SkeletonHomePage />,
};

export const Polaroid: StoryObj = {
  render: () => (
    <div style={{ padding: '2rem' }}>
      <SkeletonPolaroid />
    </div>
  ),
};

export const ArtistHero: StoryObj = {
  render: () => <SkeletonArtistHero />,
};

export const DiscographyCarousel: StoryObj = {
  render: () => <SkeletonDiscographyCarousel />,
};

export const ArtistBio: StoryObj = {
  render: () => <SkeletonArtistBio />,
};

export const ArtistPage: StoryObj = {
  render: () => <SkeletonArtistPage />,
};

export const SearchPage: StoryObj = {
  render: () => <SkeletonSearchPage />,
};

export const PlaylistsPage: StoryObj = {
  render: () => <SkeletonPlaylistsPage />,
};

export const PlaylistDetail: StoryObj = {
  render: () => <SkeletonPlaylistDetail />,
};
