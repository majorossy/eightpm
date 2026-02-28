'use client';

import { useState } from 'react';

interface WebsiteWidgetProps {
  url?: string;
}

export default function WebsiteWidget({ url }: WebsiteWidgetProps) {
  const [iframeError, setIframeError] = useState(false);

  if (!url) {
    return <p className="info-message">No website URL provided</p>;
  }

  // Handle iframe load errors
  const handleIframeError = () => {
    setIframeError(true);
  };

  return (
    <div className="website-widget-container">
      {!iframeError ? (
        <div className="website-iframe-wrapper">
          <iframe
            src={url}
            width="100%"
            height="400"
            title="Artist website"
            sandbox="allow-same-origin allow-scripts allow-popups"
            onError={handleIframeError}
          ></iframe>
        </div>
      ) : (
        <div className="iframe-fallback">
          <p className="info-message">
            Cannot embed this website. Click below to visit directly:
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="website-link"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
              <circle cx="12" cy="12" r="10" />
              <line x1="2" y1="12" x2="22" y2="12" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
            </svg>
            <span>Visit website →</span>
          </a>
        </div>
      )}

      <style jsx>{`
        .website-widget-container {
          padding: 0;
        }

        .website-iframe-wrapper {
          position: relative;
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          border: 1px solid var(--border-default);
        }

        .website-iframe-wrapper iframe {
          display: block;
          border: none;
        }

        .iframe-fallback {
          padding: 2rem 0;
          text-align: center;
        }

        .info-message {
          margin-bottom: 1.5rem;
          opacity: 0.7;
          font-size: 0.875rem;
        }

        .website-link {
          display: inline-flex;
          align-items: center;
          gap: 0.75rem;
          padding: 1rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          transition: all 0.3s ease;
          font-weight: 500;
          background: color-mix(in srgb, var(--surface-elevated) 50%, transparent);
          border: 1px solid var(--border-default);
          color: var(--text-secondary);
        }

        .website-link:hover {
          background: var(--interactive-hover-bg);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
