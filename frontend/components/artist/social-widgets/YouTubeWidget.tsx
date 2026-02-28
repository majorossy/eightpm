'use client';

interface YouTubeWidgetProps {
  artistName: string;
  url?: string;
}

export default function YouTubeWidget({ artistName, url }: YouTubeWidgetProps) {
  // Extract channel info from URL patterns
  const channelMatch = url?.match(/youtube\.com\/(channel|c|user|@)\/([^/?]+)/);
  const channelId = channelMatch?.[2];

  if (!channelId) {
    return <p className="info-message">No YouTube channel found</p>;
  }

  // Build embed URL based on channel type
  const embedUrl = channelMatch[1] === 'channel'
    ? `https://www.youtube.com/embed?listType=playlist&list=UU${channelId.substring(2)}`
    : `https://www.youtube-nocookie.com/embed/videoseries?list=UU${channelId}`;

  return (
    <div className="youtube-widget-container">
      <div className="youtube-embed">
        <iframe
          width="100%"
          height="400"
          src={embedUrl}
          title={`${artistName} YouTube channel`}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        ></iframe>
      </div>

      <p className="youtube-note">
        Latest uploads from {artistName}'s YouTube channel
      </p>

      <style jsx>{`
        .youtube-widget-container {
          padding: 0;
        }

        .youtube-embed {
          position: relative;
          width: 100%;
          border-radius: 8px;
          overflow: hidden;
          background: #000;
          border: 1px solid var(--border-default);
        }

        .youtube-embed iframe {
          display: block;
        }

        .youtube-note {
          margin-top: 1rem;
          text-align: center;
          font-size: 0.875rem;
          opacity: 0.7;
          color: var(--text-tertiary);
        }
      `}</style>
    </div>
  );
}
