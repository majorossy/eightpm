import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { SpinningReel } from './AudioVisualizations';

const meta = {
  title: 'Player/AudioVisualizations/SpinningReel',
  component: SpinningReel,
  tags: ['autodocs'],
} satisfies Meta<typeof SpinningReel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Playing: Story = {
  args: { volume: 0.6, isPlaying: true },
};

export const Paused: Story = {
  args: { volume: 0.6, isPlaying: false },
};

export const SmallPlaying: Story = {
  args: { volume: 0.8, size: 'small', isPlaying: true },
};

export const HighVolume: Story = {
  args: { volume: 1.0, isPlaying: true },
};
