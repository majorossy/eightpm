import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Find',
  description: 'Find live concert recordings by artist, venue, date, or song. Discover thousands of free recordings from Archive.org.',
  alternates: {
    canonical: '/find',
  },
};

export default function FindLayout({ children }: { children: React.ReactNode }) {
  return children;
}
