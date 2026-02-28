<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

/**
 * Resolver for song_url_high field — extracts high-quality URL from song_urls JSON.
 * Falls back to legacy song_url attribute when song_urls is unavailable.
 */
class SongUrlHigh extends AbstractSongUrlResolver
{
    protected function extractFromJson(string $songUrlsJson, $product): ?string
    {
        $qualityUrls = json_decode($songUrlsJson, true);
        return $qualityUrls['high']['url'] ?? $this->getFallback($product);
    }

    protected function getFallback($product): ?string
    {
        return $product->getData('song_url');
    }
}
