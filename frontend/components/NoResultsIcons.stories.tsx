import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import {
  EmptyVinylSleeve,
  BrokenCassette,
  EmptyTurntable,
  StaticRadio,
  EmptyStage,
  EmptyReelToReel,
  MusicNoteQuestion,
  SearchSilence,
  NoResultsIconPreview,
} from './NoResultsIcons';

const meta = {
  title: 'Primitives/NoResultsIcons',
  tags: ['autodocs'],
} satisfies Meta;

export default meta;

export const AllIcons: StoryObj = {
  render: () => <NoResultsIconPreview />,
};

export const VinylSleeve: StoryObj = {
  render: () => <EmptyVinylSleeve size={200} />,
};

export const Cassette: StoryObj = {
  render: () => <BrokenCassette size={200} />,
};

export const Turntable: StoryObj = {
  render: () => <EmptyTurntable size={200} />,
};

export const Radio: StoryObj = {
  render: () => <StaticRadio size={200} />,
};

export const Stage: StoryObj = {
  render: () => <EmptyStage size={200} />,
};

export const ReelToReel: StoryObj = {
  render: () => <EmptyReelToReel size={200} />,
};

export const NoteQuestion: StoryObj = {
  render: () => <MusicNoteQuestion size={200} />,
};

export const Silence: StoryObj = {
  render: () => <SearchSilence size={200} />,
};
