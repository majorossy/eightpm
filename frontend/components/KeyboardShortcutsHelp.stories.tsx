import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';

const meta = {
  title: 'Modals/KeyboardShortcutsHelp',
  component: KeyboardShortcutsHelp,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    onClose: () => {},
  },
} satisfies Meta<typeof KeyboardShortcutsHelp>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {};

export const Closed: Story = {
  args: { isOpen: false },
};
