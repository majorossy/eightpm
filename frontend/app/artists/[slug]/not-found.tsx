import Link from 'next/link';

export default function ArtistNotFound() {
  return (
    <div className="min-h-screen bg-surface-base flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-surface-elevated flex items-center justify-center">
          <svg className="w-10 h-10 text-accent" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Artist not found</h1>
        <p className="text-secondary mb-6">We couldn't find this artist. They may have been removed or the link is incorrect.</p>
        <Link
          href="/artists"
          className="inline-block px-6 py-3 rounded-full bg-accent text-black font-medium hover:bg-accent-hover transition-colors"
        >
          Browse artists
        </Link>
      </div>
    </div>
  );
}
