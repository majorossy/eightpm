'use client';

// ShareModal - Share content with copy link and native share

import * as Dialog from '@radix-ui/react-dialog';
import { useHaptic } from '@/hooks/useHaptic';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
  onCopy: (url: string) => Promise<boolean>;
  onNativeShare: (url: string, title: string) => Promise<boolean>;
  copiedToClipboard: boolean;
}

export default function ShareModal({
  isOpen,
  onClose,
  url,
  title,
  onCopy,
  onNativeShare,
  copiedToClipboard,
}: ShareModalProps) {
  const { vibrate, BUTTON_PRESS } = useHaptic();

  const hasNativeShare = typeof navigator !== 'undefined' && navigator.share;

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" />

        <Dialog.Content className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
          <div className="bg-[#2d2a26] rounded-t-2xl md:rounded-2xl w-full md:max-w-md p-6 space-y-4 animate-slide-up md:animate-none">
            {/* Header */}
            <div className="flex items-center justify-between">
              <Dialog.Title className="text-xl font-bold text-white">Share</Dialog.Title>
              <Dialog.Close asChild>
                <button
                  onClick={() => vibrate(BUTTON_PRESS)}
                  className="p-2 -mr-2 text-[#8a8478] hover:text-white transition-colors"
                  aria-label="Close share dialog"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </Dialog.Close>
            </div>

            {/* Title */}
            <div className="py-2">
              <p className="text-base text-white font-medium truncate">{title}</p>
              <p className="text-sm text-[#8a8478] truncate mt-1">{url}</p>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {/* Copy Link Button */}
              <button
                onClick={() => {
                  vibrate(BUTTON_PRESS);
                  onCopy(url);
                }}
                className="w-full flex items-center gap-4 p-4 bg-[#252220] hover:bg-[#2a2a2a] rounded-lg transition-colors group"
                aria-label={copiedToClipboard ? 'Link copied to clipboard' : 'Copy link to clipboard'}
              >
                <div className="w-10 h-10 rounded-full bg-[#d4a060] flex items-center justify-center">
                  {copiedToClipboard ? (
                    <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-white font-medium">
                    {copiedToClipboard ? 'Link copied!' : 'Copy link'}
                  </p>
                  <p className="text-sm text-[#8a8478]">
                    {copiedToClipboard ? 'Share anywhere' : 'Copy to clipboard'}
                  </p>
                </div>
              </button>

              {/* Native Share Button (mobile only) */}
              {hasNativeShare && (
                <button
                  onClick={() => {
                    vibrate(BUTTON_PRESS);
                    onNativeShare(url, title);
                  }}
                  className="w-full flex items-center gap-4 p-4 bg-[#252220] hover:bg-[#2a2a2a] rounded-lg transition-colors group"
                  aria-label="Open system share menu"
                >
                  <div className="w-10 h-10 rounded-full bg-[#3a3632] flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-white font-medium">Share via...</p>
                    <p className="text-sm text-[#8a8478]">More options</p>
                  </div>
                </button>
              )}
            </div>

            {/* Social Media Icons (optional) */}
            <div className="pt-4 border-t border-[#3a3632]">
              <p className="text-xs text-[#8a8478] text-center mb-4">Or share on social media</p>
              <div className="flex items-center justify-center gap-4">
                {/* Twitter/X */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => vibrate(BUTTON_PRESS)}
                  className="w-12 h-12 rounded-full bg-[#252220] hover:bg-[#1DA1F2] flex items-center justify-center transition-colors group"
                  aria-label="Share on Twitter"
                >
                  <svg className="w-5 h-5 text-[#8a8478] group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => vibrate(BUTTON_PRESS)}
                  className="w-12 h-12 rounded-full bg-[#252220] hover:bg-[#1877F2] flex items-center justify-center transition-colors group"
                  aria-label="Share on Facebook"
                >
                  <svg className="w-5 h-5 text-[#8a8478] group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </a>

                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(title + ' ' + url)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => vibrate(BUTTON_PRESS)}
                  className="w-12 h-12 rounded-full bg-[#252220] hover:bg-[#25D366] flex items-center justify-center transition-colors group"
                  aria-label="Share on WhatsApp"
                >
                  <svg className="w-5 h-5 text-[#8a8478] group-hover:text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
