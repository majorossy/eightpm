import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import LoadingBar from './LoadingBar';

const meta = {
  title: 'Navigation/LoadingBar',
  component: LoadingBar,
  tags: ['autodocs'],
  parameters: {
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: '/artists/railroadearth',
      },
    },
  },
} satisfies Meta<typeof LoadingBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
