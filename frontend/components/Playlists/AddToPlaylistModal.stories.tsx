import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import { AddToPlaylistModal } from './AddToPlaylistModal';
import { AuthProvider } from '@/context/AuthContext';
import { PlaylistProvider } from '@/context/PlaylistContext';
import { mockSong } from '../../.storybook/fixtures';

const meta = {
  title: 'Modals/AddToPlaylistModal',
  component: AddToPlaylistModal,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AuthProvider>
        <PlaylistProvider>
          <Story />
        </PlaylistProvider>
      </AuthProvider>
    ),
  ],
  args: {
    onClose: fn(),
  },
} satisfies Meta<typeof AddToPlaylistModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    isOpen: true,
    song: mockSong,
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    song: null,
  },
};

export const NoSong: Story = {
  args: {
    isOpen: true,
    song: null,
  },
};
