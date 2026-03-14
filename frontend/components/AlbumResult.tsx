'use client';

import Image from 'next/image';
import Link from 'next/link';

interface AlbumResultProps {
  name: string;
  href: string;
  image?: string;
  subtitle?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default function AlbumResult({
  name,
  href,
  image,
  subtitle,
  onClick,
}: AlbumResultProps) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex flex-col p-4 bg-surface-card hover:bg-surface-elevated rounded-lg transition-colors"
    >
      <div className="w-full aspect-square rounded overflow-hidden relative mb-3 bg-surface-elevated">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, 200px"
            quality={80}
            className="object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, var(--surface-card), var(--surface-elevated))',
            }}
          >
            <svg className="w-12 h-12 text-accent" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z" />
            </svg>
          </div>
        )}
      </div>
      <p className="text-primary font-medium truncate">{name}</p>
      {subtitle && (
        <p className="text-tertiary text-sm truncate">{subtitle}</p>
      )}
    </Link>
  );
}
