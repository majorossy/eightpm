import React from 'react';
import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import ErrorBoundary from './ErrorBoundary';

// A component that throws to trigger the error boundary
function ThrowingComponent(): React.ReactNode {
  throw new Error('Test error: Something went wrong in rendering');
}

const meta = {
  title: 'Primitives/ErrorBoundary',
  component: ErrorBoundary,
  tags: ['autodocs'],
} satisfies Meta<typeof ErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithError: Story = {
  args: {
    children: <ThrowingComponent />,
  },
};

export const WithCustomFallback: Story = {
  args: {
    children: <ThrowingComponent />,
    fallback: (
      <div className="p-8 bg-[#1c1a17] text-center">
        <p className="text-[#d4a060] text-lg font-bold">Custom Error Message</p>
        <p className="text-[#8a8478] text-sm mt-2">Something went wrong, but we have a custom fallback.</p>
      </div>
    ),
  },
};

export const NoError: Story = {
  args: {
    children: (
      <div className="p-8 bg-[#1c1a17] text-center">
        <p className="text-white">Everything is working fine.</p>
      </div>
    ),
  },
};
