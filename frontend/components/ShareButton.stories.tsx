import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ShareButton from './ShareButton';
import { ToastProvider } from './ToastContainer';

const meta = {
  title: 'Player/ShareButton',
  component: ShareButton,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof ShareButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Small: Story = {
  args: {
    title: 'Bird in a House',
    artistName: 'Railroad Earth',
    size: 'sm',
  },
};

export const Medium: Story = {
  args: {
    title: 'Bird in a House',
    artistName: 'Railroad Earth',
    size: 'md',
  },
};

export const WithCustomUrl: Story = {
  args: {
    title: 'Elko',
    artistName: 'Railroad Earth',
    url: 'https://8pm.me/artists/railroadearth/elko',
  },
};
