<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Api;

/**
 * Validates podcast YAML configuration structure.
 */
interface PodcastConfigValidatorInterface
{
    /**
     * Validate podcast configuration array.
     *
     * @param array $config Raw parsed YAML configuration
     * @return array {valid: bool, errors: string[], warnings: string[]}
     */
    public function validate(array $config): array;
}
