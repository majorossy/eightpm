<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Api;

/**
 * Loads and caches podcast YAML configuration.
 */
interface PodcastConfigLoaderInterface
{
    /**
     * Load podcast configuration from YAML file.
     *
     * @param string $podcastKey Podcast URL key (e.g., "sts9podcast")
     * @return array Parsed and validated configuration
     * @throws \ArchiveDotOrg\Core\Exception\ConfigurationException If YAML invalid
     */
    public function load(string $podcastKey): array;

    /**
     * Get list of all available podcast keys.
     *
     * @return string[]
     */
    public function getAvailablePodcasts(): array;

    /**
     * Clear cached configuration.
     *
     * @param string|null $podcastKey Specific podcast or null for all
     * @return void
     */
    public function clearCache(?string $podcastKey = null): void;
}
