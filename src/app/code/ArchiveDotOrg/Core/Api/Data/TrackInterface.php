<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Api\Data;

/**
 * Track Data Transfer Object Interface
 *
 * Represents a single track/song from an Archive.org show
 */
interface TrackInterface
{
    public const NAME = 'name';
    public const TITLE = 'title';
    public const TRACK_NUMBER = 'track_number';
    public const LENGTH = 'length';
    public const SHA1 = 'sha1';
    public const FORMAT = 'format';
    public const SOURCE = 'source';
    public const FILE_SIZE = 'file_size';

    /**
     * Get file name
     *
     * @return string
     */
    public function getName(): string;

    /**
     * Set file name
     *
     * @param string $name
     * @return TrackInterface
     */
    public function setName(string $name): TrackInterface;

    /**
     * Get track title
     *
     * @return string
     */
    public function getTitle(): string;

    /**
     * Set track title
     *
     * @param string $title
     * @return TrackInterface
     */
    public function setTitle(string $title): TrackInterface;

    /**
     * Get track number
     *
     * @return int|null
     */
    public function getTrackNumber(): ?int;

    /**
     * Set track number
     *
     * @param int|null $trackNumber
     * @return TrackInterface
     */
    public function setTrackNumber(?int $trackNumber): TrackInterface;

    /**
     * Get track length (duration in seconds or formatted string)
     *
     * @return string|null
     */
    public function getLength(): ?string;

    /**
     * Set track length
     *
     * @param string|null $length
     * @return TrackInterface
     */
    public function setLength(?string $length): TrackInterface;

    /**
     * Get SHA1 hash
     *
     * @return string|null
     */
    public function getSha1(): ?string;

    /**
     * Set SHA1 hash
     *
     * @param string|null $sha1
     * @return TrackInterface
     */
    public function setSha1(?string $sha1): TrackInterface;

    /**
     * Get audio format (flac, mp3, etc.)
     *
     * @return string
     */
    public function getFormat(): string;

    /**
     * Set audio format
     *
     * @param string $format
     * @return TrackInterface
     */
    public function setFormat(string $format): TrackInterface;

    /**
     * Get source description
     *
     * @return string|null
     */
    public function getSource(): ?string;

    /**
     * Set source description
     *
     * @param string|null $source
     * @return TrackInterface
     */
    public function setSource(?string $source): TrackInterface;

    /**
     * Get file size in bytes
     *
     * @return int|null
     */
    public function getFileSize(): ?int;

    /**
     * Set file size in bytes
     *
     * @param int|null $fileSize
     * @return TrackInterface
     */
    public function setFileSize(?int $fileSize): TrackInterface;

    /**
     * Generate unique product SKU from SHA1 hash (Fix #6)
     *
     * SKU Format: archive-{sha1_hash}
     * Example: archive-a1b2c3d4e5f6789012345678901234567890abcd
     *
     * The SHA1 hash is computed from the full Archive.org file path:
     * - Show identifier (e.g., "gd1977-05-08.sbd.miller.32601")
     * - File name (e.g., "gd1977-05-08d1t01.flac")
     * - Combined path: "gd1977-05-08.sbd.miller.32601/gd1977-05-08d1t01.flac"
     *
     * Benefits:
     * - Uniqueness: SHA1 guarantees no collisions across all tracks
     * - Stability: SKU never changes even if metadata updates
     * - Traceability: Can map back to original Archive.org file path
     * - Collision-proof: Same track from same show always gets same SKU
     *
     * @return string SHA1-based SKU (40 character hex + "archive-" prefix)
     * @see \ArchiveDotOrg\Core\Model\Data\Track::generateSku() for implementation
     */
    public function generateSku(): string;

    /**
     * Generate URL key from SKU
     *
     * @return string
     */
    public function generateUrlKey(): string;

    /**
     * Get original source file (for derivatives)
     *
     * @return string|null
     */
    public function getOriginal(): ?string;

    /**
     * Set original source file (for derivatives)
     *
     * @param string|null $original
     * @return TrackInterface
     */
    public function setOriginal(?string $original): TrackInterface;

    /**
     * Get album name from file metadata
     *
     * @return string|null
     */
    public function getAlbum(): ?string;

    /**
     * Set album name from file metadata
     *
     * @param string|null $album
     * @return TrackInterface
     */
    public function setAlbum(?string $album): TrackInterface;
}
