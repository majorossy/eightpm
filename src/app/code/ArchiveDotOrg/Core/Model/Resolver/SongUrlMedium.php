<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

/**
 * Resolver for song_url_medium field — extracts medium-quality URL from song_urls JSON.
 */
class SongUrlMedium extends AbstractSongUrlResolver
{
    protected function extractFromJson(string $songUrlsJson, $product): ?string
    {
        $qualityUrls = json_decode($songUrlsJson, true);
        return $qualityUrls['medium']['url'] ?? null;
    }
}
