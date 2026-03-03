import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cassettes',
  description: 'Your saved version selections on 8pm.me. Curated recordings of live concert shows from Archive.org.',
  alternates: {
    canonical: '/cassettes',
  },
};

export default function CassettesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
