'use client';

import { useState } from 'react';
import Image from 'next/image';

interface SocialLink {
  icon: React.ReactNode;
  name: string;
  url: string;
}

// Official social media icons as SVGs
const WebsiteIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#3a3430" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="2" y1="12" x2="22" y2="12"/>
    <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="#1877F2">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const TwitterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="#000000">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="url(#instagram-gradient)">
    <defs>
      <linearGradient id="instagram-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#FFDC80"/>
        <stop offset="25%" stopColor="#F77737"/>
        <stop offset="50%" stopColor="#E1306C"/>
        <stop offset="75%" stopColor="#C13584"/>
        <stop offset="100%" stopColor="#833AB4"/>
      </linearGradient>
    </defs>
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const YouTubeIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="#FF0000">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface PolaroidCardProps {
  imageUrl?: string;
  artistName: string;
  caption?: string;
  socialLinks?: {
    website?: string;
    youtube?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  wikipediaThumbnail?: { source: string; width: number; height: number } | null;
  imageAttribution?: { artist: string; license: string; licenseUrl: string } | null;
}

export default function PolaroidCard({ imageUrl, artistName, caption, socialLinks, wikipediaThumbnail, imageAttribution }: PolaroidCardProps) {
  // Prefer Wikipedia thumbnail, fallback to imageUrl
  const displayImageUrl = wikipediaThumbnail?.source || imageUrl;
  const showAttribution = !!wikipediaThumbnail && !!imageAttribution;
  const [isFlipped, setIsFlipped] = useState(false);

  // Build social links array from props
  const socials: SocialLink[] = [];
  if (socialLinks?.website) {
    socials.push({ icon: <WebsiteIcon />, name: 'Website', url: socialLinks.website });
  }
  if (socialLinks?.facebook) {
    socials.push({ icon: <FacebookIcon />, name: 'Facebook', url: socialLinks.facebook });
  }
  if (socialLinks?.twitter) {
    socials.push({ icon: <TwitterIcon />, name: 'Twitter', url: socialLinks.twitter });
  }
  if (socialLinks?.instagram) {
    socials.push({ icon: <InstagramIcon />, name: 'Instagram', url: socialLinks.instagram });
  }
  if (socialLinks?.youtube) {
    socials.push({ icon: <YouTubeIcon />, name: 'YouTube', url: socialLinks.youtube });
  }

  const hasSocials = socials.length > 0;

  // Generate a social handle from artist name
  const socialHandle = '@' + artistName.toLowerCase().replace(/[^a-z0-9]/g, '');

  return (
    <div
      className="relative"
      style={{
        width: 320,
        perspective: '1000px',
        cursor: hasSocials ? 'pointer' : 'default',
      }}
      onClick={() => hasSocials && setIsFlipped(!isFlipped)}
    >
      {/* Push pin */}
      <div
        style={{
          position: 'absolute',
          top: -10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 24,
          height: 24,
          borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 30%, #c86a48, #8a4a28)',
          boxShadow: '0 3px 6px rgba(0,0,0,0.4)',
          zIndex: 10,
        }}
      >
        {/* Pin highlight */}
        <div
          style={{
            position: 'absolute',
            top: 4,
            left: 6,
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.3)',
          }}
        />
      </div>

      {/* The flipping card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: 400,
          transformStyle: 'preserve-3d',
          transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0)',
          transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {/* ============ FRONT - Polaroid Photo ============ */}
        <div
          style={{
            position: 'absolute',
            width: '100%',
            height: '100%',
            backfaceVisibility: 'hidden',
            WebkitBackfaceVisibility: 'hidden',
          }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              background: '#f5f0e8',
              borderRadius: 4,
              padding: 16,
              boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
              transform: 'rotate(2deg)',
            }}
          >
            {/* Photo area */}
            <div
              style={{
                width: '100%',
                height: 290,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                overflow: 'hidden',
                background: displayImageUrl
                  ? undefined
                  : 'linear-gradient(135deg, #2a2825 0%, #1e1c1a 50%, #252220 100%)',
              }}
            >
              {displayImageUrl ? (
                <Image
                  src={displayImageUrl}
                  alt={artistName || 'Artist'}
                  fill
                  sizes="300px"
                  quality={85}
                  priority
                  style={{
                    objectFit: 'cover',
                    objectPosition: 'left center',
                  }}
                />
              ) : (
                <div style={{ textAlign: 'center', zIndex: 1 }}>
                  <div
                    style={{
                      fontSize: 56,
                      marginBottom: 12,
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                    }}
                  >
                    🎸
                  </div>
                </div>
              )}

              {/* Subtle vignette */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.3) 100%)',
                  pointerEvents: 'none',
                }}
              />

              {/* Image attribution overlay */}
              {showAttribution && (
                <a
                  href={imageAttribution.licenseUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    padding: '4px 8px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.7))',
                    fontSize: 9,
                    color: 'rgba(255,255,255,0.7)',
                    fontFamily: 'system-ui',
                    textDecoration: 'none',
                    zIndex: 2,
                  }}
                >
                  Photo: {imageAttribution.artist.length > 25
                    ? imageAttribution.artist.slice(0, 25) + '...'
                    : imageAttribution.artist} · {imageAttribution.license}
                </a>
              )}

              {/* Tap hint */}
              {hasSocials && (
                <div
                  style={{
                    position: 'absolute',
                    bottom: showAttribution ? 24 : 8,
                    right: 8,
                    fontSize: 12,
                    color: '#6a6458',
                    fontFamily: 'system-ui',
                    letterSpacing: 1,
                    background: 'rgba(0,0,0,0.5)',
                    padding: '4px 8px',
                    borderRadius: 4,
                  }}
                >
                  tap to flip →
                </div>
              )}
            </div>

            {/* Handwritten caption */}
            <div
              style={{
                textAlign: 'center',
                color: '#3a3430',
                fontSize: 16,
                fontStyle: 'italic',
                fontFamily: 'Georgia, serif',
              }}
            >
              {caption || artistName}
            </div>
          </div>
        </div>

        {/* ============ BACK - Social Links (Polaroid back style) ============ */}
        {hasSocials && (
          <div
            style={{
              position: 'absolute',
              width: '100%',
              height: '100%',
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: 'linear-gradient(180deg, #f5f0e8 0%, #ebe5d8 100%)',
                borderRadius: 4,
                padding: 24,
                boxShadow: '0 8px 32px rgba(0,0,0,0.35), 0 2px 8px rgba(0,0,0,0.2)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              {/* Handwritten header */}
              <div
                style={{
                  fontSize: 22,
                  color: '#3a3430',
                  textAlign: 'center',
                  marginBottom: 8,
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                }}
              >
                Find us! ✨
              </div>

              <div
                style={{
                  fontSize: 11,
                  color: '#8a7a6a',
                  marginBottom: 24,
                  fontFamily: 'system-ui',
                }}
              >
                {socialHandle}
              </div>

              {/* Social icons in a fun grid */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  gap: 12,
                  marginBottom: 24,
                }}
              >
                {socials.map((social, i) => (
                  <a
                    key={i}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{
                      width: 52,
                      height: 52,
                      borderRadius: '50%',
                      background: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      textDecoration: 'none',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                      border: '2px solid #e8e0d4',
                      transition: 'all 0.2s ease',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.15) rotate(-5deg)';
                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(212,160,96,0.3)';
                      e.currentTarget.style.borderColor = '#d4a060';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1) rotate(0deg)';
                      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                      e.currentTarget.style.borderColor = '#e8e0d4';
                    }}
                    title={social.name}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>

              {/* Flip hint */}
              <div
                style={{
                  fontSize: 11,
                  color: '#a89a88',
                  fontFamily: 'Georgia, serif',
                  fontStyle: 'italic',
                }}
              >
                ← tap to flip back
              </div>

              {/* Corner doodle */}
              <div
                style={{
                  position: 'absolute',
                  bottom: 12,
                  right: 16,
                  fontSize: 10,
                  color: '#c8b8a8',
                  fontFamily: 'Georgia, serif',
                  transform: 'rotate(-8deg)',
                }}
              >
                xoxo ♡
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
