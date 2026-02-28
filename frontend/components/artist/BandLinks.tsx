'use client';

import React, { useState } from 'react';
import BandLinksWidget from './BandLinksWidget';

interface BandLinksProps {
  links?: {
    website?: string;
    youtube?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    wikipedia?: string;
  };
  artistName: string;
}

const BandLinks: React.FC<BandLinksProps> = ({ links, artistName }) => {
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  // Return null if no links provided
  if (!links || Object.values(links).every(link => !link)) {
    return null;
  }

  const handleLinkClick = (platform: string) => {
    if (expandedPlatform === platform) {
      setExpandedPlatform(null); // Collapse if already open
    } else {
      setExpandedPlatform(platform); // Expand this platform
    }
  };

  const linkConfigs = [
    {
      key: 'website',
      label: 'Website',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      )
    },
    {
      key: 'wikipedia',
      label: 'Wikipedia',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12.09 13.119c-.936 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.931-1.532.029-1.406-3.321-4.293-9.144-5.651-12.409-.251-.601-.441-.987-.619-1.139-.181-.15-.554-.24-1.122-.271C.103 5.033 0 4.982 0 4.898v-.455c0-.084.103-.135.307-.135.523 0 1.165.066 1.93.066.706 0 1.497-.066 2.365-.066.178 0 .28.051.28.135v.455c0 .084-.102.135-.28.135-.508.015-.885.09-1.133.195-.248.105-.372.3-.372.569 0 .203.046.42.138.649l2.923 6.87c.405-.854.796-1.716 1.168-2.584l-.903-1.94c-.39-.765-.611-1.384-.611-1.934 0-.39.135-.66.406-.81.27-.149.646-.224 1.127-.224h.075v-.455c0-.084-.102-.135-.28-.135-.508 0-1.015.066-1.497.066-.451 0-.932-.066-1.497-.066-.178 0-.28.051-.28.135v.455c0 .084.102.135.28.135.872.03 1.489.18 1.853.45.363.27.754.78 1.172 1.529l1.455 3.09c-.932 1.932-2.217 4.548-2.853 5.728-.616 1.074-1.127.931-1.532.029-1.406-3.321-4.293-9.144-5.651-12.409-.251-.601-.441-.987-.619-1.139-.181-.15-.554-.24-1.122-.271C.103 5.033 0 4.982 0 4.898v-.455c0-.084.103-.135.307-.135.523 0 1.165.066 1.93.066.706 0 1.497-.066 2.365-.066.178 0 .28.051.28.135v.455c0 .084-.102.135-.28.135-.508.015-.885.09-1.133.195-.248.105-.372.3-.372.569 0 .203.046.42.138.649l2.923 6.87 1.168-2.584-.903-1.94c-.39-.765-.611-1.384-.611-1.934 0-.39.135-.66.406-.81.27-.149.646-.224 1.127-.224h.075v-.455c0-.084-.102-.135-.28-.135-.508 0-1.015.066-1.497.066-.451 0-.932-.066-1.497-.066-.178 0-.28.051-.28.135v.455c0 .084.102.135.28.135.872.03 1.489.18 1.853.45.363.27.754.78 1.172 1.529l3.236 6.87 3.385-7.199c.315-.645.555-1.08.721-1.305.165-.225.375-.375.631-.45.255-.074.57-.111.944-.111h.06v.455c0 .084-.102.135-.28.135-.508.015-.885.09-1.133.195-.248.105-.372.3-.372.569 0 .203.046.42.138.649l2.923 6.87c.405-.854.796-1.716 1.168-2.584l-.903-1.94c-.39-.765-.611-1.384-.611-1.934 0-.39.135-.66.406-.81.27-.149.646-.224 1.127-.224h.075v-.455c0-.084-.102-.135-.28-.135-.508 0-1.015.066-1.497.066-.451 0-.932-.066-1.497-.066-.178 0-.28.051-.28.135v.455c0 .084.102.135.28.135.872.03 1.489.18 1.853.45.363.27.754.78 1.172 1.529l1.455 3.09z" />
        </svg>
      )
    },
    {
      key: 'facebook',
      label: 'Facebook',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    },
    {
      key: 'twitter',
      label: 'Twitter',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    },
    {
      key: 'instagram',
      label: 'Instagram',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z" />
        </svg>
      )
    },
    {
      key: 'youtube',
      label: 'YouTube',
      icon: (
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      )
    }
  ];

  const availableLinks = linkConfigs.filter(config => links[config.key as keyof typeof links]);

  if (availableLinks.length === 0) {
    return null;
  }

  return (
    <div className="band-links">
      <div className="band-links-grid">
        {availableLinks.map(config => (
          <button
            key={config.key}
            onClick={() => handleLinkClick(config.key)}
            className={`band-link ${expandedPlatform === config.key ? 'active' : ''}`}
            aria-label={`${expandedPlatform === config.key ? 'Close' : 'Open'} ${artistName} ${config.label} widget`}
            aria-expanded={expandedPlatform === config.key}
          >
            <div className="band-link-icon">
              {config.icon}
            </div>
            <span className="band-link-label">{config.label}</span>
          </button>
        ))}
      </div>

      {/* Widget appears below entire grid */}
      {expandedPlatform && (
        <div className="widget-container">
          <BandLinksWidget
            platform={expandedPlatform}
            artistName={artistName}
            url={links[expandedPlatform as keyof typeof links]}
            onClose={() => setExpandedPlatform(null)}
          />
        </div>
      )}

      <style jsx>{`
        .band-links {
          width: 100%;
        }

        .band-links-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(80px, 1fr));
          gap: 1rem;
          max-width: 600px;
          margin: 0 auto;
          position: relative;
        }

        .band-link {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
          padding: 1rem;
          border-radius: 8px;
          transition: all 0.3s ease;
          cursor: pointer;
          width: 100%;
          background: color-mix(in srgb, var(--surface-elevated) 50%, transparent);
          border: 1px solid var(--border-default);
        }

        .widget-container {
          margin-top: 1rem;
          width: 100%;
        }

        .band-link-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
        }

        .band-link-icon svg {
          width: 100%;
          height: 100%;
          transition: all 0.3s ease;
          color: var(--text-secondary);
        }

        .band-link-label {
          font-size: 0.875rem;
          font-weight: 500;
          text-align: center;
          transition: all 0.3s ease;
          color: var(--text-secondary);
        }

        .band-link:hover {
          background: var(--interactive-hover-bg);
          border-color: var(--accent-primary);
          transform: translateY(-2px);
        }

        .band-link:hover .band-link-icon svg {
          color: var(--accent-primary);
          transform: scale(1.1);
        }

        .band-link:hover .band-link-label {
          color: var(--accent-primary);
        }

        .band-link.active {
          background: var(--accent-primary-muted);
          border-color: var(--accent-primary);
        }

        .band-link.active .band-link-icon svg {
          color: var(--accent-primary);
        }

        .band-link.active .band-link-label {
          color: var(--accent-primary);
        }

        /* Responsive */
        @media (max-width: 640px) {
          .band-links-grid {
            grid-template-columns: repeat(3, 1fr);
            gap: 0.75rem;
          }

          .band-link {
            padding: 0.75rem;
          }

          .band-link-icon {
            width: 32px;
            height: 32px;
          }

          .band-link-label {
            font-size: 0.75rem;
          }
        }

        @media (max-width: 480px) {
          .band-links-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>
    </div>
  );
};

export default BandLinks;
