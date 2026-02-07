import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { Waveform } from './AudioVisualizations';

const sineWave = Array.from({ length: 30 }, (_, i) => Math.sin(i * 0.4) * 0.8);
const noiseWave = Array.from({ length: 30 }, () => (Math.random() - 0.5) * 1.5);
const flatLine = Array.from({ length: 30 }, () => 0);

const meta = {
  title: 'Player/AudioVisualizations/Waveform',
  component: Waveform,
  tags: ['autodocs'],
} satisfies Meta<typeof Waveform>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SineWave: Story = {
  args: { waveform: sineWave },
};

export const Noise: Story = {
  args: { waveform: noiseWave },
};

export const FlatLine: Story = {
  args: { waveform: flatLine },
};

export const SmallCustomColor: Story = {
  args: { waveform: sineWave, size: 'small', color: '#d4a060' },
};
