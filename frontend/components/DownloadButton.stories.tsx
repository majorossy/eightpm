import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import DownloadButton from './DownloadButton';
import { ToastProvider } from './ToastContainer';

const meta = {
  title: 'Player/DownloadButton',
  component: DownloadButton,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <ToastProvider>
        <Story />
      </ToastProvider>
    ),
  ],
} satisfies Meta<typeof DownloadButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithUrl: Story = {
  args: {
    archiveUrl: 'https://archive.org/details/RailroadEarth2024-01-01',
    title: 'Bird in a House',
    artistName: 'Railroad Earth',
    size: 'sm',
  },
};

export const NoUrl: Story = {
  args: {
    title: 'Bird in a House',
    artistName: 'Railroad Earth',
    size: 'sm',
  },
};

export const MediumSize: Story = {
  args: {
    archiveUrl: 'https://archive.org/details/RailroadEarth2024-01-01',
    title: 'Elko',
    size: 'md',
  },
};
