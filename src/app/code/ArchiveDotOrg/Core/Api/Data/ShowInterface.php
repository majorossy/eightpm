<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Api\Data;

/**
 * Show Data Transfer Object Interface
 *
 * Represents a single show/recording from Archive.org
 */
interface ShowInterface
{
    public const IDENTIFIER = 'identifier';
    public const TITLE = 'title';
    public const DESCRIPTION = 'description';
    public const DATE = 'date';
    public const YEAR = 'year';
    public const VENUE = 'venue';
    public const COVERAGE = 'coverage';
    public const CREATOR = 'creator';
    public const TAPER = 'taper';
    public const SOURCE = 'source';
    public const TRANSFERER = 'transferer';
    public const LINEAGE = 'lineage';
    public const NOTES = 'notes';
    public const COLLECTION = 'collection';
    public const SERVER_ONE = 'server_one';
    public const SERVER_TWO = 'server_two';
    public const DIR = 'dir';
    public const TRACKS = 'tracks';
    public const PUB_DATE = 'pub_date';
    public const GUID = 'guid';
    public const AVG_RATING = 'avg_rating';
    public const NUM_REVIEWS = 'num_reviews';
    public const DOWNLOADS = 'downloads';
    public const DOWNLOADS_WEEK = 'downloads_week';
    public const DOWNLOADS_MONTH = 'downloads_month';
    public const ACCESS_RESTRICTED = 'access_restricted';
    public const LICENSE_URL = 'license_url';
    public const SUBJECT_TAGS = 'subject_tags';

    /**
     * Get show identifier (unique ID on Archive.org)
     *
     * @return string
     */
    public function getIdentifier(): string;

    /**
     * Set show identifier
     *
     * @param string $identifier
     * @return ShowInterface
     */
    public function setIdentifier(string $identifier): ShowInterface;

    /**
     * Get show title
     *
     * @return string
     */
    public function getTitle(): string;

    /**
     * Set show title
     *
     * @param string $title
     * @return ShowInterface
     */
    public function setTitle(string $title): ShowInterface;

    /**
     * Get show description
     *
     * @return string|null
     */
    public function getDescription(): ?string;

    /**
     * Set show description
     *
     * @param string|null $description
     * @return ShowInterface
     */
    public function setDescription(?string $description): ShowInterface;

    /**
     * Get show date
     *
     * @return string|null
     */
    public function getDate(): ?string;

    /**
     * Set show date
     *
     * @param string|null $date
     * @return ShowInterface
     */
    public function setDate(?string $date): ShowInterface;

    /**
     * Get show year
     *
     * @return string|null
     */
    public function getYear(): ?string;

    /**
     * Set show year
     *
     * @param string|null $year
     * @return ShowInterface
     */
    public function setYear(?string $year): ShowInterface;

    /**
     * Get venue name
     *
     * @return string|null
     */
    public function getVenue(): ?string;

    /**
     * Set venue name
     *
     * @param string|null $venue
     * @return ShowInterface
     */
    public function setVenue(?string $venue): ShowInterface;

    /**
     * Get coverage/location (city, state)
     *
     * @return string|null
     */
    public function getCoverage(): ?string;

    /**
     * Set coverage/location
     *
     * @param string|null $coverage
     * @return ShowInterface
     */
    public function setCoverage(?string $coverage): ShowInterface;

    /**
     * Get creator/artist name
     *
     * @return string|null
     */
    public function getCreator(): ?string;

    /**
     * Set creator/artist name
     *
     * @param string|null $creator
     * @return ShowInterface
     */
    public function setCreator(?string $creator): ShowInterface;

    /**
     * Get taper name
     *
     * @return string|null
     */
    public function getTaper(): ?string;

    /**
     * Set taper name
     *
     * @param string|null $taper
     * @return ShowInterface
     */
    public function setTaper(?string $taper): ShowInterface;

    /**
     * Get recording source/equipment
     *
     * @return string|null
     */
    public function getSource(): ?string;

    /**
     * Set recording source/equipment
     *
     * @param string|null $source
     * @return ShowInterface
     */
    public function setSource(?string $source): ShowInterface;

    /**
     * Get transferer name
     *
     * @return string|null
     */
    public function getTransferer(): ?string;

    /**
     * Set transferer name
     *
     * @param string|null $transferer
     * @return ShowInterface
     */
    public function setTransferer(?string $transferer): ShowInterface;

    /**
     * Get recording lineage
     *
     * @return string|null
     */
    public function getLineage(): ?string;

    /**
     * Set recording lineage
     *
     * @param string|null $lineage
     * @return ShowInterface
     */
    public function setLineage(?string $lineage): ShowInterface;

    /**
     * Get show notes
     *
     * @return string|null
     */
    public function getNotes(): ?string;

    /**
     * Set show notes
     *
     * @param string|null $notes
     * @return ShowInterface
     */
    public function setNotes(?string $notes): ShowInterface;

    /**
     * Get collection identifier
     *
     * @return string|null
     */
    public function getCollection(): ?string;

    /**
     * Set collection identifier
     *
     * @param string|null $collection
     * @return ShowInterface
     */
    public function setCollection(?string $collection): ShowInterface;

    /**
     * Get primary server
     *
     * @return string|null
     */
    public function getServerOne(): ?string;

    /**
     * Set primary server
     *
     * @param string|null $serverOne
     * @return ShowInterface
     */
    public function setServerOne(?string $serverOne): ShowInterface;

    /**
     * Get secondary server
     *
     * @return string|null
     */
    public function getServerTwo(): ?string;

    /**
     * Set secondary server
     *
     * @param string|null $serverTwo
     * @return ShowInterface
     */
    public function setServerTwo(?string $serverTwo): ShowInterface;

    /**
     * Get directory path
     *
     * @return string|null
     */
    public function getDir(): ?string;

    /**
     * Set directory path
     *
     * @param string|null $dir
     * @return ShowInterface
     */
    public function setDir(?string $dir): ShowInterface;

    /**
     * Get tracks array
     *
     * @return TrackInterface[]
     */
    public function getTracks(): array;

    /**
     * Set tracks array
     *
     * @param TrackInterface[] $tracks
     * @return ShowInterface
     */
    public function setTracks(array $tracks): ShowInterface;

    /**
     * Add a track
     *
     * @param TrackInterface $track
     * @return ShowInterface
     */
    public function addTrack(TrackInterface $track): ShowInterface;

    /**
     * Get publication date
     *
     * @return string|null
     */
    public function getPubDate(): ?string;

    /**
     * Set publication date
     *
     * @param string|null $pubDate
     * @return ShowInterface
     */
    public function setPubDate(?string $pubDate): ShowInterface;

    /**
     * Get GUID
     *
     * @return string|null
     */
    public function getGuid(): ?string;

    /**
     * Set GUID
     *
     * @param string|null $guid
     * @return ShowInterface
     */
    public function setGuid(?string $guid): ShowInterface;

    /**
     * Get average rating from Archive.org
     *
     * @return float|null
     */
    public function getAvgRating(): ?float;

    /**
     * Set average rating
     *
     * @param float|null $avgRating
     * @return ShowInterface
     */
    public function setAvgRating(?float $avgRating): ShowInterface;

    /**
     * Get number of reviews from Archive.org
     *
     * @return int|null
     */
    public function getNumReviews(): ?int;

    /**
     * Set number of reviews
     *
     * @param int|null $numReviews
     * @return ShowInterface
     */
    public function setNumReviews(?int $numReviews): ShowInterface;

    /**
     * Get total download count from Archive.org
     *
     * @return int|null
     */
    public function getDownloads(): ?int;

    /**
     * Set total download count
     *
     * @param int|null $downloads
     * @return ShowInterface
     */
    public function setDownloads(?int $downloads): ShowInterface;

    /**
     * Get downloads this week from Archive.org
     *
     * @return int|null
     */
    public function getDownloadsWeek(): ?int;

    /**
     * Set downloads this week
     *
     * @param int|null $downloadsWeek
     * @return ShowInterface
     */
    public function setDownloadsWeek(?int $downloadsWeek): ShowInterface;

    /**
     * Get downloads this month from Archive.org
     *
     * @return int|null
     */
    public function getDownloadsMonth(): ?int;

    /**
     * Set downloads this month
     *
     * @param int|null $downloadsMonth
     * @return ShowInterface
     */
    public function setDownloadsMonth(?int $downloadsMonth): ShowInterface;

    /**
     * Check if access is restricted (e.g., stream_only collection)
     *
     * @return bool
     */
    public function isAccessRestricted(): bool;

    /**
     * Set access restricted flag
     *
     * @param bool $restricted
     * @return ShowInterface
     */
    public function setAccessRestricted(bool $restricted): ShowInterface;

    /**
     * Get license URL (Creative Commons, etc.)
     *
     * @return string|null
     */
    public function getLicenseUrl(): ?string;

    /**
     * Set license URL
     *
     * @param string|null $licenseUrl
     * @return ShowInterface
     */
    public function setLicenseUrl(?string $licenseUrl): ShowInterface;

    /**
     * Get subject tags from Archive.org metadata
     *
     * @return array
     */
    public function getSubjectTags(): array;

    /**
     * Set subject tags
     *
     * @param array $subjectTags
     * @return ShowInterface
     */
    public function setSubjectTags(array $subjectTags): ShowInterface;

    /**
     * Get show runtime (total duration)
     *
     * @return string|null
     */
    public function getRuntime(): ?string;

    /**
     * Set show runtime (total duration)
     *
     * @param string|null $runtime
     * @return ShowInterface
     */
    public function setRuntime(?string $runtime): ShowInterface;

    /**
     * Get Archive.org added date (when uploaded)
     *
     * @return string|null
     */
    public function getAddedDate(): ?string;

    /**
     * Set Archive.org added date (when uploaded)
     *
     * @param string|null $addedDate
     * @return ShowInterface
     */
    public function setAddedDate(?string $addedDate): ShowInterface;

    /**
     * Get Archive.org public date (when made public)
     *
     * @return string|null
     */
    public function getPublicDate(): ?string;

    /**
     * Set Archive.org public date (when made public)
     *
     * @param string|null $publicDate
     * @return ShowInterface
     */
    public function setPublicDate(?string $publicDate): ShowInterface;

    /**
     * Get show subject tags (full string)
     *
     * @return string|null
     */
    public function getSubject(): ?string;

    /**
     * Set show subject tags (full string)
     *
     * @param string|null $subject
     * @return ShowInterface
     */
    public function setSubject(?string $subject): ShowInterface;
}
