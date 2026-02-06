<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Data;

use ArchiveDotOrg\Core\Api\Data\ShowInterface;
use ArchiveDotOrg\Core\Api\Data\TrackInterface;

/**
 * Show Data Transfer Object Implementation
 */
class Show implements ShowInterface
{
    private string $identifier = '';
    private string $title = '';
    private ?string $description = null;
    private ?string $date = null;
    private ?string $year = null;
    private ?string $venue = null;
    private ?string $coverage = null;
    private ?string $creator = null;
    private ?string $taper = null;
    private ?string $source = null;
    private ?string $transferer = null;
    private ?string $lineage = null;
    private ?string $notes = null;
    private ?string $collection = null;
    private ?string $serverOne = null;
    private ?string $serverTwo = null;
    private ?string $dir = null;
    private ?string $pubDate = null;
    private ?string $guid = null;
    private ?float $avgRating = null;
    private ?int $numReviews = null;
    private ?int $downloads = null;
    private ?int $downloadsWeek = null;
    private ?int $downloadsMonth = null;
    private ?int $filesCount = null;
    private ?int $itemSize = null;
    private ?string $uploader = null;
    private ?int $createdTimestamp = null;
    private ?int $lastUpdatedTimestamp = null;
    private bool $accessRestricted = false;
    private ?string $licenseUrl = null;
    /** @var string[] */
    private array $subjectTags = [];

    /** @var TrackInterface[] */
    private array $tracks = [];

    /**
     * @inheritDoc
     */
    public function getIdentifier(): string
    {
        return $this->identifier;
    }

    /**
     * @inheritDoc
     */
    public function setIdentifier(string $identifier): ShowInterface
    {
        $this->identifier = $identifier;
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
    public function setTitle(string $title): ShowInterface
    {
        $this->title = $title;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getDescription(): ?string
    {
        return $this->description;
    }

    /**
     * @inheritDoc
     */
    public function setDescription(?string $description): ShowInterface
    {
        $this->description = $description;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getDate(): ?string
    {
        return $this->date;
    }

    /**
     * @inheritDoc
     */
    public function setDate(?string $date): ShowInterface
    {
        $this->date = $date;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getYear(): ?string
    {
        return $this->year;
    }

    /**
     * @inheritDoc
     */
    public function setYear(?string $year): ShowInterface
    {
        $this->year = $year;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getVenue(): ?string
    {
        return $this->venue;
    }

    /**
     * @inheritDoc
     */
    public function setVenue(?string $venue): ShowInterface
    {
        $this->venue = $venue;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getCoverage(): ?string
    {
        return $this->coverage;
    }

    /**
     * @inheritDoc
     */
    public function setCoverage(?string $coverage): ShowInterface
    {
        $this->coverage = $coverage;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getCreator(): ?string
    {
        return $this->creator;
    }

    /**
     * @inheritDoc
     */
    public function setCreator(?string $creator): ShowInterface
    {
        $this->creator = $creator;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getTaper(): ?string
    {
        return $this->taper;
    }

    /**
     * @inheritDoc
     */
    public function setTaper(?string $taper): ShowInterface
    {
        $this->taper = $taper;
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
    public function setSource(?string $source): ShowInterface
    {
        $this->source = $source;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getTransferer(): ?string
    {
        return $this->transferer;
    }

    /**
     * @inheritDoc
     */
    public function setTransferer(?string $transferer): ShowInterface
    {
        $this->transferer = $transferer;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getLineage(): ?string
    {
        return $this->lineage;
    }

    /**
     * @inheritDoc
     */
    public function setLineage(?string $lineage): ShowInterface
    {
        $this->lineage = $lineage;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getNotes(): ?string
    {
        return $this->notes;
    }

    /**
     * @inheritDoc
     */
    public function setNotes(?string $notes): ShowInterface
    {
        $this->notes = $notes;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getCollection(): ?string
    {
        return $this->collection;
    }

    /**
     * @inheritDoc
     */
    public function setCollection(?string $collection): ShowInterface
    {
        $this->collection = $collection;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getServerOne(): ?string
    {
        return $this->serverOne;
    }

    /**
     * @inheritDoc
     */
    public function setServerOne(?string $serverOne): ShowInterface
    {
        $this->serverOne = $serverOne;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getServerTwo(): ?string
    {
        return $this->serverTwo;
    }

    /**
     * @inheritDoc
     */
    public function setServerTwo(?string $serverTwo): ShowInterface
    {
        $this->serverTwo = $serverTwo;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getDir(): ?string
    {
        return $this->dir;
    }

    /**
     * @inheritDoc
     */
    public function setDir(?string $dir): ShowInterface
    {
        $this->dir = $dir;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getTracks(): array
    {
        return $this->tracks;
    }

    /**
     * @inheritDoc
     */
    public function setTracks(array $tracks): ShowInterface
    {
        $this->tracks = $tracks;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function addTrack(TrackInterface $track): ShowInterface
    {
        $this->tracks[] = $track;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getPubDate(): ?string
    {
        return $this->pubDate;
    }

    /**
     * @inheritDoc
     */
    public function setPubDate(?string $pubDate): ShowInterface
    {
        $this->pubDate = $pubDate;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getGuid(): ?string
    {
        return $this->guid;
    }

    /**
     * @inheritDoc
     */
    public function setGuid(?string $guid): ShowInterface
    {
        $this->guid = $guid;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getAvgRating(): ?float
    {
        return $this->avgRating;
    }

    /**
     * @inheritDoc
     */
    public function setAvgRating(?float $avgRating): ShowInterface
    {
        $this->avgRating = $avgRating;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getNumReviews(): ?int
    {
        return $this->numReviews;
    }

    /**
     * @inheritDoc
     */
    public function setNumReviews(?int $numReviews): ShowInterface
    {
        $this->numReviews = $numReviews;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getDownloads(): ?int
    {
        return $this->downloads;
    }

    /**
     * @inheritDoc
     */
    public function setDownloads(?int $downloads): ShowInterface
    {
        $this->downloads = $downloads;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getDownloadsWeek(): ?int
    {
        return $this->downloadsWeek;
    }

    /**
     * @inheritDoc
     */
    public function setDownloadsWeek(?int $downloadsWeek): ShowInterface
    {
        $this->downloadsWeek = $downloadsWeek;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getDownloadsMonth(): ?int
    {
        return $this->downloadsMonth;
    }

    /**
     * @inheritDoc
     */
    public function setDownloadsMonth(?int $downloadsMonth): ShowInterface
    {
        $this->downloadsMonth = $downloadsMonth;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getFilesCount(): ?int
    {
        return $this->filesCount;
    }

    /**
     * @inheritDoc
     */
    public function setFilesCount(?int $filesCount): ShowInterface
    {
        $this->filesCount = $filesCount;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getItemSize(): ?int
    {
        return $this->itemSize;
    }

    /**
     * @inheritDoc
     */
    public function setItemSize(?int $itemSize): ShowInterface
    {
        $this->itemSize = $itemSize;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getUploader(): ?string
    {
        return $this->uploader;
    }

    /**
     * @inheritDoc
     */
    public function setUploader(?string $uploader): ShowInterface
    {
        $this->uploader = $uploader;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getCreatedTimestamp(): ?int
    {
        return $this->createdTimestamp;
    }

    /**
     * @inheritDoc
     */
    public function setCreatedTimestamp(?int $createdTimestamp): ShowInterface
    {
        $this->createdTimestamp = $createdTimestamp;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getLastUpdatedTimestamp(): ?int
    {
        return $this->lastUpdatedTimestamp;
    }

    /**
     * @inheritDoc
     */
    public function setLastUpdatedTimestamp(?int $lastUpdatedTimestamp): ShowInterface
    {
        $this->lastUpdatedTimestamp = $lastUpdatedTimestamp;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function isAccessRestricted(): bool
    {
        return $this->accessRestricted;
    }

    /**
     * @inheritDoc
     */
    public function setAccessRestricted(bool $restricted): ShowInterface
    {
        $this->accessRestricted = $restricted;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getLicenseUrl(): ?string
    {
        return $this->licenseUrl;
    }

    /**
     * @inheritDoc
     */
    public function setLicenseUrl(?string $licenseUrl): ShowInterface
    {
        $this->licenseUrl = $licenseUrl;
        return $this;
    }

    /**
     * @inheritDoc
     */
    public function getSubjectTags(): array
    {
        return $this->subjectTags;
    }

    /**
     * @inheritDoc
     */
    public function setSubjectTags(array $subjectTags): ShowInterface
    {
        $this->subjectTags = $subjectTags;
        return $this;
    }
}
