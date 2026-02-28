'use client';

interface FacebookWidgetProps {
  artistName: string;
  url?: string;
}

export default function FacebookWidget({ artistName, url }: FacebookWidgetProps) {
  return (
    <div className="facebook-widget-container">
      <p className="info-message">
        Facebook no longer supports public hashtag search or embed widgets.
      </p>

      {url && (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="facebook-link"
        >
          <svg viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span>View {artistName} on Facebook →</span>
        </a>
      )}

      <style jsx>{`
        .facebook-widget-container {
          padding: 2rem 0;
          text-align: center;
        }

        .info-message {
          margin-bottom: 1.5rem;
          opacity: 0.7;
          font-size: 0.875rem;
        }

        .facebook-link {
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

        .facebook-link:hover {
          background: var(--interactive-hover-bg);
          border-color: var(--accent-primary);
          color: var(--accent-primary);
          transform: translateY(-2px);
        }
      `}</style>
    </div>
  );
}
