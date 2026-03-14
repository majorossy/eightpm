import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Your Library',
  description: 'Your personal music library on 8pm.me. View liked versions, followed artists, albums, and recently played tracks.',
  alternates: {
    canonical: '/my-library',
  },
};

export default function LibraryLayout({ children }: { children: React.ReactNode }) {
  return children;
}
