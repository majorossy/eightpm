import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ErrorFallback from './ErrorFallback';

const meta = {
  title: 'Primitives/ErrorFallback',
  component: ErrorFallback,
  tags: ['autodocs'],
  args: {
    error: new Error('Something went wrong while loading the artist page'),
    reset: () => {},
  },
} satisfies Meta<typeof ErrorFallback>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomMessages: Story = {
  args: {
    title: 'Artist not found',
    description: 'We couldn\'t find that artist. They may not be in our archive yet.',
    error: new Error('404: Artist not found'),
  },
};

export const NetworkError: Story = {
  args: {
    title: 'Connection lost',
    description: 'Unable to reach the server. Check your internet connection.',
    error: new Error('ERR_NETWORK: Failed to fetch'),
  },
};
