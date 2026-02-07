import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { EQBars } from './AudioVisualizations';

const activeFrequency = [0.3, 0.7, 0.5, 0.9, 0.4, 0.6, 0.8, 0.2];
const lowFrequency = [0.1, 0.15, 0.1, 0.2, 0.1, 0.05, 0.1, 0.15];

const meta = {
  title: 'Player/AudioVisualizations/EQBars',
  component: EQBars,
  tags: ['autodocs'],
} satisfies Meta<typeof EQBars>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  args: { frequencyData: activeFrequency },
};

export const Quiet: Story = {
  args: { frequencyData: lowFrequency },
};

export const FiveBars: Story = {
  args: { frequencyData: activeFrequency, barCount: 5 },
};

export const SmallGreen: Story = {
  args: { frequencyData: activeFrequency, size: 'small', color: '#5a8a7a' },
};
