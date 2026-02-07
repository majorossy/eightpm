<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Data;

use ArchiveDotOrg\Core\Api\Data\TrackInterface;

/**
 * Track Data Transfer Object Implementation
 */
class Track implements TrackInterface
{
    private string $name = '';
    private string $title = '';
    private ?int $trackNumber = null;
    private ?string $length = null;
    private ?string $sha1 = null;
    private string $format = 'flac';
    private ?string $source = null;
    private ?int $fileSize = null;
    private ?string $md5 = null;
    private ?string $acoustid = null;
    private ?int $bitrate = null;
    private ?string $original = null;
    private ?string $album = null;

    /**
     * @inheritDoc
     */
    public function getName(): string
    {
        return $this->name;
    }

    /**
     * @inheritDoc
     */
    public function setName(string $name): TrackInterface
    {
        $this->name = $name;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getTitle(): string
    {
        return $this->title;
    }

    /**
     * @inheritDoc
     */
    public function setTitle(string $title): TrackInterface
    {
        $this->title = $title;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getTrackNumber(): ?int
    {
        return $this->trackNumber;
    }

    /**
     * @inheritDoc
     */
    public function setTrackNumber(?int $trackNumber): TrackInterface
    {
        $this->trackNumber = $trackNumber;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getLength(): ?string
    {
        return $this->length;
    }

    /**
     * @inheritDoc
     */
    public function setLength(?string $length): TrackInterface
    {
        $this->length = $length;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getSha1(): ?string
    {
        return $this->sha1;
    }

    /**
     * @inheritDoc
     */
    public function setSha1(?string $sha1): TrackInterface
    {
        $this->sha1 = $sha1;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getFormat(): string
    {
        return $this->format;
    }

    /**
     * @inheritDoc
     */
    public function setFormat(string $format): TrackInterface
    {
        $this->format = $format;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getSource(): ?string
    {
        return $this->source;
    }

    /**
     * @inheritDoc
     */
    public function setSource(?string $source): TrackInterface
    {
        $this->source = $source;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getFileSize(): ?int
    {
        return $this->fileSize;
    }

    /**
     * @inheritDoc
     */
    public function setFileSize(?int $fileSize): TrackInterface
    {
        $this->fileSize = $fileSize;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getMd5(): ?string
    {
        return $this->md5;
    }

    /**
     * @inheritDoc
     */
    public function setMd5(?string $md5): TrackInterface
    {
        $this->md5 = $md5;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getAcoustid(): ?string
    {
        return $this->acoustid;
    }

    /**
     * @inheritDoc
     */
    public function setAcoustid(?string $acoustid): TrackInterface
    {
        $this->acoustid = $acoustid;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getBitrate(): ?int
    {
        return $this->bitrate;
    }

    /**
     * @inheritDoc
     */
    public function setBitrate(?int $bitrate): TrackInterface
    {
        $this->bitrate = $bitrate;
        return $this;
    }

    /**
     * Generate unique product SKU for a track.
     *
     * CURRENT FORMAT: SHA1 hash (Archive.org file identifier)
     * Example: d41d8cd98f00b204e9800998ecf8427e
     *
     * PLANNED FORMAT (after rearchitecture):
     * Format: {artist_code}-{show_identifier}-{track_num}
     * Example: phish-phish2023-07-14-01
     *
     * Components:
     * - artist_code: Lowercase collection ID (e.g., "phish", "lettuce")
     * - show_identifier: Full Archive.org identifier (e.g., "phish2023-07-14")
     * - track_num: 2-digit zero-padded track number (e.g., "01", "12")
     *
     * Uniqueness is guaranteed by:
     * - Archive.org identifiers are globally unique
     * - Track numbers are unique within a show
     *
     * @return string Unique SKU
     * @inheritDoc
     */
    public function generateSku(): string
    {
        // Use SHA1 as SKU (same as legacy implementation)
        return $this->sha1 ?? '';
    }

    /**
     * @inheritDoc
     */
    public function generateUrlKey(): string
    {
        $sku = $this->generateSku();
        // Sanitize to lowercase alphanumeric with hyphens, max 64 chars
        $urlKey = strtolower(preg_replace('#[^0-9a-z]+#i', '-', $sku) ?? '');
        return mb_substr(rtrim($urlKey, '-'), 0, 64);
    }

    /**
     * @inheritDoc
     */
    public function getOriginal(): ?string
    {
        return $this->original;
    }

    /**
     * @inheritDoc
     */
    public function setOriginal(?string $original): TrackInterface
    {
        $this->original = $original;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getAlbum(): ?string
    {
        return $this->album;
    }

    /**
     * @inheritDoc
     */
    public function setAlbum(?string $album): TrackInterface
    {
        $this->album = $album;
        return $this;
    }
}
