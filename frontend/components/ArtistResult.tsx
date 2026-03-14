'use client';

import Image from 'next/image';
import Link from 'next/link';

interface ArtistResultProps {
  name: string;
  slug: string;
  image?: string;
  subtitle?: string;
  onClick?: (e: React.MouseEvent) => void;
}

export default function ArtistResult({
  name,
  slug,
  image,
  subtitle = 'Artist',
  onClick,
}: ArtistResultProps) {
  return (
    <Link
      href={`/artists/${slug}`}
      onClick={onClick}
      className="flex flex-col items-center p-4 bg-surface-card hover:bg-surface-elevated rounded-lg transition-colors"
    >
      <div className="w-full aspect-square rounded-full overflow-hidden relative mb-3 bg-surface-elevated">
        {image ? (
          <Image
            src={image}
            alt={name}
            fill
            sizes="(max-width: 768px) 50vw, 128px"
            quality={80}
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="font-bold text-4xl text-tertiary">
              {name.charAt(0)}
            </span>
          </div>
        )}
      </div>
      <p className="text-primary font-medium text-center w-full truncate">
        {name}
      </p>
      <p className="text-tertiary text-sm text-center">{subtitle}</p>
    </Link>
  );
}
