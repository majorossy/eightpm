'use client';

import Image from 'next/image';

interface DetailedCassetteProps {
  artistName: string;
  artistFullName?: string;
  location?: string;
  year?: string;
  rotation?: number;
  offsetX?: number;
  offsetY?: number;
  isTop?: boolean;
  imageUrl?: string;
  artistImageUrl?: string;
}

export default function DetailedCassette({
  artistName,
  artistFullName,
  location,
  year,
  rotation = 0,
  offsetX = 0,
  offsetY = 0,
  isTop = false,
  imageUrl,
  artistImageUrl,
}: DetailedCassetteProps) {
  return (
    <div
      className="absolute transition-transform duration-500"
      style={{
        transform: `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg)`,
        zIndex: isTop ? 10 : 1,
      }}
    >
      {/* Cassette shell */}
      <div
        className={`relative w-[280px] h-[180px] rounded-lg border-2 ${
          isTop
            ? 'bg-gradient-to-b from-[#3a3632] to-[#2a2622] border-[#5a5652]'
            : 'bg-gradient-to-b from-[#2d2a26] to-[#1f1d1a] border-[#4a4642]'
        }`}
        style={{
          boxShadow: isTop
            ? '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 0 0 1px rgba(255,255,255,0.05)'
            : '0 4px 16px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(255,255,255,0.03)',
        }}
      >
        {/* Corner screws */}
        <div className="absolute top-2 left-2 w-3 h-3 rounded-full bg-[#1a1816] border border-[#4a4642]">
          <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-[#5a5652] to-[#3a3632]">
            <div className="absolute inset-[3px] rounded-full bg-[#2a2622]" />
          </div>
        </div>
        <div className="absolute top-2 right-2 w-3 h-3 rounded-full bg-[#1a1816] border border-[#4a4642]">
          <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-[#5a5652] to-[#3a3632]">
            <div className="absolute inset-[3px] rounded-full bg-[#2a2622]" />
          </div>
        </div>
        <div className="absolute bottom-2 left-2 w-3 h-3 rounded-full bg-[#1a1816] border border-[#4a4642]">
          <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-[#5a5652] to-[#3a3632]">
            <div className="absolute inset-[3px] rounded-full bg-[#2a2622]" />
          </div>
        </div>
        <div className="absolute bottom-2 right-2 w-3 h-3 rounded-full bg-[#1a1816] border border-[#4a4642]">
          <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-[#5a5652] to-[#3a3632]">
            <div className="absolute inset-[3px] rounded-full bg-[#2a2622]" />
          </div>
        </div>

        {/* Polaroid stamp (upper right) — only on top cassette */}
        {isTop && imageUrl && (
          <div
            className="absolute top-[4px] right-[4px] h-14 w-14 z-50"
          >
            {/* Packing tape strip */}
            <div
              className="absolute -top-0.5 h-3 z-10"
              style={{
                left: '73%',
                width: '40%',
                background: 'linear-gradient(180deg, rgba(255, 248, 220, 0.92) 0%, rgba(255, 240, 195, 0.85) 100%)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.15)',
                borderRadius: '1px',
                transform: 'translateX(-50%) rotate(12deg)'
              }}
            />
            <div
              className="absolute inset-0"
              style={{ transform: 'rotate(6deg)' }}
            >
              <Image
                src={imageUrl}
                alt={artistName}
                fill
                sizes="56px"
                className="object-cover rounded-sm"
                style={{
                  border: '2px solid white',
                  boxShadow: '0 4px 16px rgba(0,0,0,0.35), 0 2px 4px rgba(0,0,0,0.2)'
                }}
                onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }}
              />
            </div>
          </div>
        )}

        {/* Artist circle sticker (bottom-left on body) — only on top cassette */}
        {isTop && artistImageUrl && (
          <div
            className="absolute bottom-2 left-14 w-7 h-7 rounded-full overflow-hidden border-2 border-white shadow-lg z-10"
            style={{ transform: 'rotate(-8deg)' }}
          >
            <Image
              src={artistImageUrl}
              alt={artistName}
              fill
              className="object-cover"
            />
          </div>
        )}

        {/* Label area */}
        <div
          className={`absolute top-4 left-6 right-6 h-[72px] rounded ${
            isTop
              ? 'bg-gradient-to-b from-[#f5f0e8] to-[#e8e0d0]'
              : 'bg-gradient-to-b from-[#d8d0c4] to-[#c8c0b4]'
          }`}
          style={{
            boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
          }}
        >
          {/* Label content */}
          <div className="px-3 py-2 h-full flex flex-col justify-between">
            {/* Top row: brand + side indicator */}
            <div className="flex justify-between items-start">
              <span className="text-[8px] font-bold text-[#8a7a68] tracking-wider uppercase">
                {year ? `Est. ${year}` : 'Live Recording'}
              </span>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                  isTop
                    ? 'bg-[#d4a060] text-[#1c1a17]'
                    : 'bg-[#a89080] text-[#2a2420]'
                }`}
              >
                SIDE A
              </span>
            </div>

            {/* Artist name - main label text */}
            <div className="text-center -mt-1">
              <p
                className={`font-bold text-lg tracking-wide ${
                  isTop ? 'text-[#2a2420]' : 'text-[#3a3430]'
                }`}
                style={{ fontFamily: 'Georgia, serif' }}
              >
                {artistName}
              </p>
              {artistFullName && artistFullName !== artistName && (
                <p className="text-[9px] text-[#6a5a48] tracking-wider uppercase">
                  {artistFullName}
                </p>
              )}
            </div>

            {/* Bottom row: location */}
            <div className="flex justify-between items-end">
              <span className="text-[8px] text-[#8a7a68]">
                {location || 'USA'}
              </span>
              <span className="text-[8px] text-[#8a7a68]">90 MIN</span>
            </div>
          </div>
        </div>

        {/* Tape window */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 w-[200px] h-[52px] rounded bg-[#1a1816]"
          style={{
            boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          {/* Tape reels container */}
          <div className="absolute inset-1 flex justify-between items-center px-3">
            {/* Left reel */}
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#4a4642] to-[#2a2622] border-2 border-[#3a3632]">
                {/* Reel spokes */}
                <div className="absolute inset-2 rounded-full bg-[#1a1816]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#3a3632]" />
                  </div>
                  {/* Spoke lines */}
                  <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-[#3a3632] -translate-y-1/2" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#3a3632] -translate-x-1/2" />
                    <div
                      className="absolute top-1/2 left-1/2 h-px bg-[#3a3632]"
                      style={{
                        width: '100%',
                        transform: 'translate(-50%, -50%) rotate(45deg)',
                      }}
                    />
                    <div
                      className="absolute top-1/2 left-1/2 h-px bg-[#3a3632]"
                      style={{
                        width: '100%',
                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Tape path (brown tape visible) */}
            <div className="flex-1 mx-2 h-3 relative">
              <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-[#4a3828] -translate-y-1/2 rounded-sm" />
            </div>

            {/* Right reel */}
            <div className="relative w-10 h-10">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#4a4642] to-[#2a2622] border-2 border-[#3a3632]">
                {/* Reel spokes */}
                <div className="absolute inset-2 rounded-full bg-[#1a1816]">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-[#3a3632]" />
                  </div>
                  {/* Spoke lines */}
                  <div className="absolute inset-0">
                    <div className="absolute top-1/2 left-0 right-0 h-px bg-[#3a3632] -translate-y-1/2" />
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[#3a3632] -translate-x-1/2" />
                    <div
                      className="absolute top-1/2 left-1/2 h-px bg-[#3a3632]"
                      style={{
                        width: '100%',
                        transform: 'translate(-50%, -50%) rotate(45deg)',
                      }}
                    />
                    <div
                      className="absolute top-1/2 left-1/2 h-px bg-[#3a3632]"
                      style={{
                        width: '100%',
                        transform: 'translate(-50%, -50%) rotate(-45deg)',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Guide rollers */}
          <div className="absolute bottom-1 left-12 w-1.5 h-3 bg-[#5a5652] rounded-sm" />
          <div className="absolute bottom-1 right-12 w-1.5 h-3 bg-[#5a5652] rounded-sm" />
        </div>

        {/* Bottom edge detail */}
        <div className="absolute bottom-0 left-8 right-8 h-1 bg-gradient-to-r from-transparent via-[#4a4642] to-transparent opacity-30" />
      </div>
    </div>
  );
}
