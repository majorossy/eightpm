<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

/**
 * Resolver for song_url_low field — extracts low-quality URL from song_urls JSON.
 */
class SongUrlLow extends AbstractSongUrlResolver
{
    protected function extractFromJson(string $songUrlsJson, $product): ?string
    {
        $qualityUrls = json_decode($songUrlsJson, true);
        return $qualityUrls['low']['url'] ?? null;
    }
}
