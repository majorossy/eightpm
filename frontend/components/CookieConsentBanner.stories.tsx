import type { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useEffect } from 'react';
import CookieConsentBanner from './CookieConsentBanner';

const CONSENT_KEY = '8pm_cookie_consent';

/**
 * Wrapper that clears stored consent so the banner always renders in stories.
 */
function ConsentBannerWrapper() {
  useEffect(() => {
    localStorage.removeItem(CONSENT_KEY);
  }, []);
  return <CookieConsentBanner />;
}

const meta = {
  title: 'Navigation/CookieConsentBanner',
  component: CookieConsentBanner,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Cookie consent banner with accept all, essential only, and customize options. Uses localStorage, so stories clear stored consent to ensure the banner is visible.',
      },
    },
  },
  // Use the wrapper as the render function so localStorage is cleared before each story
  render: () => <ConsentBannerWrapper />,
} satisfies Meta<typeof CookieConsentBanner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const AlreadyConsented: Story = {
  render: () => {
    useEffect(() => {
      localStorage.setItem(
        CONSENT_KEY,
        JSON.stringify({
          necessary: true,
          functional: true,
          analytics: true,
          timestamp: Date.now(),
          version: '1.0',
        })
      );
    }, []);
    return <CookieConsentBanner />;
  },
  parameters: {
    docs: {
      description: {
        story: 'When the user has already consented, the banner does not render. This story will appear blank.',
      },
    },
  },
};
