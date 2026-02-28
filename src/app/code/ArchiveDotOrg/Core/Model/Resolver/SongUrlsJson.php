<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

/**
 * Resolver for song_urls_json field — returns the raw JSON string.
 */
class SongUrlsJson extends AbstractSongUrlResolver
{
    protected function extractFromJson(string $songUrlsJson, $product): ?string
    {
        return $songUrlsJson;
    }
}
