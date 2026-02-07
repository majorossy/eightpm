import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { fn } from '@storybook/test';
import ProfileMenu from './ProfileMenu';
import { AuthProvider } from '@/context/AuthContext';

const meta = {
  title: 'Navigation/ProfileMenu',
  component: ProfileMenu,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <AuthProvider>
        <Story />
      </AuthProvider>
    ),
  ],
  args: {
    onSignInClick: fn(),
  },
} satisfies Meta<typeof ProfileMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedOut: Story = {};
