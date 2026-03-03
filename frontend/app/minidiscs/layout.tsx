import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'MiniDiscs',
  description: 'Your MiniDisc collections on 8pm.me. Custom mixes of live concert recordings from Archive.org.',
  alternates: {
    canonical: '/minidiscs',
  },
};

export default function MiniDiscsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
