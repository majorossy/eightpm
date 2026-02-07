import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import EightPmTopBar from './EightPmTopBar';

const meta = {
  title: 'Navigation/EightPmTopBar',
  component: EightPmTopBar,
  tags: ['autodocs'],
  parameters: {
    nextjs: { appDirectory: true, navigation: { pathname: '/' } },
    layout: 'fullscreen',
  },
} satisfies Meta<typeof EightPmTopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { transparent: false },
};

export const Transparent: Story = {
  args: { transparent: true },
  decorators: [
    (Story) => (
      <div style={{ background: 'linear-gradient(to bottom, #3a3632, #1c1a17)', minHeight: 200 }}>
        <Story />
      </div>
    ),
  ],
};

export const WithContent: Story = {
  args: { transparent: false },
  decorators: [
    (Story) => (
      <div>
        <Story />
        <div style={{ paddingTop: 80, padding: '80px 2rem 2rem' }}>
          <p style={{ color: 'var(--text-dim)' }}>
            Scroll down to see the top bar with backdrop blur.
          </p>
          {Array.from({ length: 20 }, (_, i) => (
            <p key={i} style={{ color: 'var(--text-dim)', marginTop: '1rem' }}>
              Content line {i + 1}
            </p>
          ))}
        </div>
      </div>
    ),
  ],
};
