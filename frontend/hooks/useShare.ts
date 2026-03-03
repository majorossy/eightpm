import { useState, useCallback } from 'react';
import { Song, Track, Album } from '@/lib/api';
import { trackShare } from '@/lib/analytics';

type ShareableItem = {
  type: 'song' | 'track' | 'artist' | 'album' | 'playlist';
  id: string;
  title: string;
  artistSlug?: string;
  albumIdentifier?: string;
  playlistId?: string;
};

export function useShare() {
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareTitle, setShareTitle] = useState('');
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);

  // Generate shareable URL based on item type
  const generateShareUrl = (item: ShareableItem): string => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

    switch (item.type) {
      case 'song':
      case 'track':
        if (item.artistSlug && item.albumIdentifier) {
          // For now, songs/tracks share the album URL
          // In the future, could add trackSlug to ShareableItem for direct track links
          return `${baseUrl}/artists/${item.artistSlug}/album/${item.albumIdentifier}`;
        }
        return `${baseUrl}/`;

      case 'artist':
        if (item.artistSlug) {
          return `${baseUrl}/artists/${item.artistSlug}`;
        }
        return `${baseUrl}/`;

      case 'album':
        if (item.artistSlug && item.albumIdentifier) {
          return `${baseUrl}/artists/${item.artistSlug}/album/${item.albumIdentifier}`;
        }
        return `${baseUrl}/`;

      case 'playlist':
        if (item.playlistId) {
          return `${baseUrl}/playlists/${item.playlistId}`;
        }
        return `${baseUrl}/`;

      default:
        return `${baseUrl}/`;
    }
  };

  // Copy URL to clipboard
  const copyToClipboard = async (url: string, contentType?: ShareableItem['type'], contentName?: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedToClipboard(true);
      setTimeout(() => setCopiedToClipboard(false), 2000);

      // Track share analytics
      if (contentType && contentName) {
        trackShare(contentType, contentName, 'copy_link');
      }

      return true;
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      return false;
    }
  };

  // Use native Web Share API (mobile)
  const nativeShare = async (url: string, title: string, contentType?: ShareableItem['type']): Promise<boolean> => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title,
          url,
        });

        // Track share analytics
        if (contentType) {
          trackShare(contentType, title, 'native_share');
        }

        return true;
      } catch (err) {
        // User cancelled or share failed
        console.error('Share failed:', err);
        return false;
      }
    }
    return false;
  };

  // Open share modal
  const openShareModal = (item: ShareableItem) => {
    const url = generateShareUrl(item);
    setShareUrl(url);
    setShareTitle(item.title);
    setShowShareModal(true);
  };

  // Close share modal
  const closeShareModal = useCallback(() => {
    setShowShareModal(false);
    setCopiedToClipboard(false);
  }, []);

  // Helper to create shareable item from song
  const shareableSong = (song: Song): ShareableItem => ({
    type: 'song',
    id: song.id,
    title: song.title,
    artistSlug: song.artistSlug,
    albumIdentifier: song.albumIdentifier,
  });

  // Helper to create shareable item from track
  const shareableTrack = (track: Track): ShareableItem => ({
    type: 'track',
    id: track.id,
    title: track.title,
    artistSlug: track.artistSlug,
    albumIdentifier: track.albumIdentifier,
  });

  // Helper to create shareable item from album
  const shareableAlbum = (album: Album): ShareableItem => ({
    type: 'album',
    id: album.id,
    title: album.name,
    artistSlug: album.artistSlug,
    albumIdentifier: album.identifier,
  });

  return {
    showShareModal,
    shareUrl,
    shareTitle,
    copiedToClipboard,
    openShareModal,
    closeShareModal,
    copyToClipboard,
    nativeShare,
    generateShareUrl,
    shareableSong,
    shareableTrack,
    shareableAlbum,
  };
}
