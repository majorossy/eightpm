import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import TwitterWidget from './TwitterWidget';

const meta = {
  title: 'Artist/Social/TwitterWidget',
  component: TwitterWidget,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'Embeds a Twitter timeline. In Storybook the external Twitter widget script may not load, so you will see the loading/fallback state.',
      },
    },
  },
} satisfies Meta<typeof TwitterWidget>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    artistName: 'Railroad Earth',
    url: 'https://twitter.com/railroadearth',
  },
};

export const XDotComUrl: Story = {
  args: {
    artistName: 'Railroad Earth',
    url: 'https://x.com/railroadearth',
  },
};

export const NoUsername: Story = {
  args: {
    artistName: 'Railroad Earth',
    url: 'https://example.com',
  },
};
