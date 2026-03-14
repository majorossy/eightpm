// Artwork override mutations — client-side only (uses /api/graphql proxy)

interface ArtworkOverrideResult {
  success: boolean;
  artwork_url: string | null;
  is_locked: boolean;
  message: string | null;
}

export async function setArtworkOverride(input: {
  category_id: number;
  artwork_url: string;
  type: 'album_artwork' | 'band_image';
  notes?: string;
}): Promise<ArtworkOverrideResult> {
  const res = await fetch('/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation SetArtworkOverride($input: ArtworkOverrideInput!) {
        setArtworkOverride(input: $input) {
          success
          artwork_url
          is_locked
          message
        }
      }`,
      variables: { input },
    }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data.setArtworkOverride;
}

export async function removeArtworkOverride(
  categoryId: number,
  type: 'album_artwork' | 'band_image'
): Promise<ArtworkOverrideResult> {
  const res = await fetch('/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation RemoveArtworkOverride($categoryId: Int!, $type: String!) {
        removeArtworkOverride(category_id: $categoryId, type: $type) {
          success
          is_locked
          message
        }
      }`,
      variables: { categoryId, type },
    }),
  });
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors[0].message);
  }
  return json.data.removeArtworkOverride;
}

export async function fetchStudioAlbumsLockStatus(
  artistName: string
): Promise<Map<number, boolean>> {
  const res = await fetch('/api/graphql', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `query StudioAlbumLocks($artistName: String!) {
        studioAlbums(artistName: $artistName) {
          items { category_id is_locked }
        }
      }`,
      variables: { artistName },
    }),
  });
  const json = await res.json();
  const lockMap = new Map<number, boolean>();
  for (const item of json.data?.studioAlbums?.items ?? []) {
    if (item.category_id) {
      lockMap.set(item.category_id, item.is_locked ?? false);
    }
  }
  return lockMap;
}
