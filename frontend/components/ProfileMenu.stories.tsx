import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from 'storybook/test';
import ProfileMenu from './ProfileMenu';
import { MagentoAuthProvider } from '@/context/MagentoAuthContext';

const meta = {
  title: 'Navigation/ProfileMenu',
  component: ProfileMenu,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MagentoAuthProvider>
        <Story />
      </MagentoAuthProvider>
    ),
  ],
  args: {
    onSignInClick: fn(),
  },
} satisfies Meta<typeof ProfileMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {};
