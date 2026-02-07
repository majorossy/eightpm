import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { PulsingDot } from './AudioVisualizations';

const meta = {
  title: 'Player/AudioVisualizations/PulsingDot',
  component: PulsingDot,
  tags: ['autodocs'],
} satisfies Meta<typeof PulsingDot>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playing: Story = {
  args: { isPlaying: true },
};

export const Paused: Story = {
  args: { isPlaying: false },
};

export const SmallPlaying: Story = {
  args: { isPlaying: true, size: 'small' },
};

export const CustomColor: Story = {
  args: { isPlaying: true, color: '#5a8a7a' },
};
