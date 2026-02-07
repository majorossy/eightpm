import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import OfflineIndicator from './OfflineIndicator';

const meta = {
  title: 'Primitives/OfflineIndicator',
  component: OfflineIndicator,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'Shows a banner when the browser is offline and a brief "Back online!" message on reconnect. Relies on window online/offline events.',
      },
    },
  },
} satisfies Meta<typeof OfflineIndicator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
