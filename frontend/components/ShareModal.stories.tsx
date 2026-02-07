import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import ShareModal from './ShareModal';

const meta = {
  title: 'Modals/ShareModal',
  component: ShareModal,
  tags: ['autodocs'],
  args: {
    onClose: fn(),
    onCopy: fn(async () => true),
    onNativeShare: fn(async () => true),
  },
} satisfies Meta<typeof ShareModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  args: {
    isOpen: true,
    url: 'https://8pm.me/artists/railroadearth/bird-in-a-house',
    title: 'Bird in a House - Railroad Earth',
    copiedToClipboard: false,
  },
};

export const LinkCopied: Story = {
  args: {
    isOpen: true,
    url: 'https://8pm.me/artists/railroadearth/bird-in-a-house',
    title: 'Bird in a House - Railroad Earth',
    copiedToClipboard: true,
  },
};

export const Closed: Story = {
  args: {
    isOpen: false,
    url: 'https://8pm.me/artists/railroadearth',
    title: 'Railroad Earth',
    copiedToClipboard: false,
  },
};
