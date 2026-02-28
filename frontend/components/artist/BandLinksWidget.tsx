'use client';

import TwitterWidget from './social-widgets/TwitterWidget';
import InstagramWidget from './social-widgets/InstagramWidget';
import YouTubeWidget from './social-widgets/YouTubeWidget';
import FacebookWidget from './social-widgets/FacebookWidget';
import WebsiteWidget from './social-widgets/WebsiteWidget';

interface BandLinksWidgetProps {
  platform: string;
  artistName: string;
  url?: string;
  onClose: () => void;
}

export default function BandLinksWidget({
  platform,
  artistName,
  url,
  onClose
}: BandLinksWidgetProps) {
  // Render platform-specific widget
  const renderWidget = () => {
    switch (platform) {
      case 'twitter':
        return <TwitterWidget artistName={artistName} url={url} />;
      case 'instagram':
        return <InstagramWidget artistName={artistName} url={url} />;
      case 'youtube':
        return <YouTubeWidget artistName={artistName} url={url} />;
      case 'facebook':
        return <FacebookWidget artistName={artistName} url={url} />;
      case 'website':
        return <WebsiteWidget url={url} />;
      case 'wikipedia':
        return <WebsiteWidget url={url} />;
      default:
        return null;
    }
  };

  // Platform display names
  const platformNames: Record<string, string> = {
    twitter: 'Twitter',
    instagram: 'Instagram',
    youtube: 'YouTube',
    facebook: 'Facebook',
    website: 'Website',
    wikipedia: 'Wikipedia'
  };

  return (
    <div className="band-links-widget">
      {/* Header with close button and "Open in [Platform]" */}
      <div className="widget-header">
        <h3 className="widget-title">
          #{artistName} on {platformNames[platform] || platform}
        </h3>
        <div className="widget-actions">
          {url && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="open-external-btn"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Open in {platformNames[platform]}</span>
            </a>
          )}
          <button onClick={onClose} className="close-btn" aria-label="Close widget">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* Widget content */}
      <div className="widget-content">
        {renderWidget()}
      </div>

      <style jsx>{`
        .band-links-widget {
          margin-top: 1rem;
          border-radius: 8px;
          overflow: hidden;
          animation: slideDown 0.3s ease-out;
          background: var(--surface-card);
          border: 1px solid var(--border-default);
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .widget-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          gap: 1rem;
          border-bottom: 1px solid var(--border-default);
        }

        .widget-title {
          margin: 0;
          font-size: 1rem;
          font-weight: 600;
          flex: 1;
          color: var(--text-primary);
        }

        .widget-actions {
          display: flex;
          gap: 0.5rem;
          align-items: center;
        }

        .open-external-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem 1rem;
          border-radius: 6px;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          transition: all 0.2s ease;
          white-space: nowrap;
          background: var(--accent-primary-muted);
          border: 1px solid color-mix(in srgb, var(--accent-primary) 30%, transparent);
          color: var(--accent-primary);
        }

        .open-external-btn:hover {
          background: color-mix(in srgb, var(--accent-primary) 20%, transparent);
          border-color: var(--accent-primary);
        }

        .close-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.5rem;
          border: none;
          border-radius: 6px;
          background: transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          color: var(--text-tertiary);
        }

        .close-btn:hover {
          background: var(--interactive-hover-bg);
          color: var(--text-primary);
        }

        .widget-content {
          padding: 1rem;
          max-height: 500px;
          overflow-y: auto;
        }

        .widget-content::-webkit-scrollbar {
          width: 8px;
        }

        .widget-content::-webkit-scrollbar-track {
          background: var(--surface-sunken);
        }

        .widget-content::-webkit-scrollbar-thumb {
          background: var(--border-default);
          border-radius: 4px;
        }

        .widget-content::-webkit-scrollbar-thumb:hover {
          background: var(--text-tertiary);
        }

        /* Responsive */
        @media (max-width: 640px) {
          .widget-header {
            flex-direction: column;
            align-items: flex-start;
          }

          .widget-actions {
            width: 100%;
            justify-content: space-between;
          }

          .open-external-btn span {
            display: none;
          }

          .open-external-btn {
            padding: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
}
