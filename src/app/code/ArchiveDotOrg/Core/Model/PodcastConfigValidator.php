<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

use ArchiveDotOrg\Core\Api\PodcastConfigValidatorInterface;

/**
 * Podcast Configuration Validator
 *
 * Validates structure and required fields of podcast YAML configs.
 */
class PodcastConfigValidator implements PodcastConfigValidatorInterface
{
    /**
     * @inheritDoc
     */
    public function validate(array $config): array
    {
        $errors = [];
        $warnings = [];

        // Validate podcast section exists
        if (!isset($config['podcast'])) {
            $errors[] = 'Missing required section: podcast';
        } else {
            $errors = array_merge($errors, $this->validatePodcastSection($config['podcast']));
            $warnings = array_merge($warnings, $this->getWarnings($config['podcast']));
        }

        return [
            'valid' => empty($errors),
            'errors' => $errors,
            'warnings' => $warnings,
        ];
    }

    /**
     * Validate podcast section.
     *
     * @param array $podcast
     * @return array Validation errors
     */
    private function validatePodcastSection(array $podcast): array
    {
        $errors = [];

        // Required fields
        if (empty($podcast['name'])) {
            $errors[] = 'podcast.name is required';
        }

        if (empty($podcast['url_key'])) {
            $errors[] = 'podcast.url_key is required';
        }

        return $errors;
    }

    /**
     * Get warnings for optional but recommended fields.
     *
     * @param array $podcast
     * @return array Validation warnings
     */
    private function getWarnings(array $podcast): array
    {
        $warnings = [];

        // Optional but recommended fields
        if (empty($podcast['spotify_url']) && empty($podcast['apple_url']) && empty($podcast['youtube_url'])) {
            $warnings[] = 'No podcast platform URLs provided (spotify_url, apple_url, youtube_url)';
        }

        if (empty($podcast['rss_feed'])) {
            $warnings[] = 'No RSS feed URL provided';
        }

        if (empty($podcast['description'])) {
            $warnings[] = 'No description provided';
        }

        return $warnings;
    }
}
