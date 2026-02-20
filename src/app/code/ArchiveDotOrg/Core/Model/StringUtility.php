<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

/**
 * Shared string utilities for the ArchiveDotOrg module.
 */
class StringUtility
{
    /**
     * Truncate string to maximum length without breaking words
     *
     * @param string $text
     * @param int $maxLength
     * @return string
     */
    public static function truncateToLength(string $text, int $maxLength): string
    {
        if (mb_strlen($text) <= $maxLength) {
            return $text;
        }

        $truncated = mb_substr($text, 0, $maxLength);
        $lastSpace = mb_strrpos($truncated, ' ');

        // Only break at space if it's not too far back (>75% of max length)
        if ($lastSpace !== false && $lastSpace > $maxLength * 0.75) {
            return mb_substr($truncated, 0, $lastSpace) . '...';
        }

        return $truncated . '...';
    }
}
