'use client';

import Link from 'next/link';
import { useCassettes } from '@/context/CollectionContext';
import MiniCassette from '@/components/MiniCassette';
import { resolveCassetteTint } from '@/lib/cassetteColors';
import { getCassetteBrand } from '@/lib/cassetteBrands';
import SectionHeader from './SectionHeader';

export default function CassettesSection() {
  const { cassettes } = useCassettes();

  const displayed = cassettes.slice(0, 5);

  return (
    <section>
      <SectionHeader
        dotColor="var(--secondary)"
        name="CASSETTES"
        count={cassettes.length}
        seeAllHref={cassettes.length > 0 ? '/my-library/cassettes' : undefined}
      />
      {cassettes.length === 0 ? (
        <p className="text-[10px] text-tertiary tracking-[0.04em]">Save a cassette from any show to see it here.</p>
      ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {displayed.map((cassette) => (
          <Link
            key={cassette.id}
            href={`/artists/${cassette.artistSlug}/album/${cassette.albumIdentifier}?cassette=${cassette.id}`}
            className="transition-transform duration-150 hover:-translate-y-[2px]"
          >
            <MiniCassette
              name={cassette.name}
              albumName={cassette.albumName}
              artistName={cassette.artistName}
              showDate={cassette.showDate}
              coverArt={cassette.coverArt}
              tintStyle={resolveCassetteTint(cassette)}
              headerLabel={cassette.colorBrand ? getCassetteBrand(cassette.colorBrand)?.headerLabel : undefined}
              pickCount={Object.keys(cassette.versionOverrides).length}
            />
          </Link>
        ))}
      </div>
      )}
    </section>
  );
}
