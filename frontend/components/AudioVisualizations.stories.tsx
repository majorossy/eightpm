import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { VUMeter, SpinningReel, Waveform, EQBars, PulsingDot } from './AudioVisualizations';

// -- VUMeter --

const vuMeterMeta = {
  title: 'Player/AudioVisualizations/VUMeter',
  component: VUMeter,
  tags: ['autodocs'],
} satisfies Meta<typeof VUMeter>;

export default vuMeterMeta;
type VUStory = StoryObj<typeof vuMeterMeta>;

export const VUMeterLow: VUStory = {
  args: { volume: 0.2 },
};

export const VUMeterMid: VUStory = {
  args: { volume: 0.5 },
};

export const VUMeterHigh: VUStory = {
  args: { volume: 0.9 },
};

export const VUMeterSmall: VUStory = {
  args: { volume: 0.6, size: 'small' },
};
