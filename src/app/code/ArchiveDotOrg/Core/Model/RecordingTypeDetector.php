<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

/**
 * Stateless utility to classify recordings from source/lineage/subject metadata.
 *
 * Priority order: SBD > MX > FM > WEBCAST > AUD > UNKNOWN
 */
class RecordingTypeDetector
{
    public const TYPE_SOUNDBOARD = 'SBD';
    public const TYPE_AUDIENCE = 'AUD';
    public const TYPE_MATRIX = 'MX';
    public const TYPE_FM_BROADCAST = 'FM';
    public const TYPE_WEBCAST = 'WEBCAST';
    public const TYPE_UNKNOWN = 'UNKNOWN';

    /**
     * Patterns in priority order (highest priority first)
     */
    private const PATTERNS = [
        self::TYPE_SOUNDBOARD => '/\b(sbd|soundboard|sound board)\b/',
        self::TYPE_MATRIX => '/\b(matrix|mx|matrixed)\b/',
        self::TYPE_FM_BROADCAST => '/\b(fm broadcast|radio broadcast)\b/',
        self::TYPE_WEBCAST => '/\b(webcast|livestream|live stream)\b/',
        self::TYPE_AUDIENCE => '/\b(aud|audience)\b/',
    ];

    /**
     * Detect recording type from metadata fields.
     *
     * @param string|null $source Recording source text
     * @param string|null $lineage Recording lineage text
     * @param string|string[]|null $subjects Subject tags (string or array)
     * @return string One of the TYPE_* constants
     */
    public function detect(?string $source, ?string $lineage, $subjects = []): string
    {
        $parts = [];

        if ($source !== null && $source !== '') {
            $parts[] = $source;
        }

        if ($lineage !== null && $lineage !== '') {
            $parts[] = $lineage;
        }

        if (is_array($subjects)) {
            foreach ($subjects as $subject) {
                if (is_string($subject) && $subject !== '') {
                    $parts[] = $subject;
                }
            }
        } elseif (is_string($subjects) && $subjects !== '') {
            $parts[] = $subjects;
        }

        if (empty($parts)) {
            return self::TYPE_UNKNOWN;
        }

        $text = strtolower(implode(' ', $parts));

        foreach (self::PATTERNS as $type => $pattern) {
            if (preg_match($pattern, $text)) {
                return $type;
            }
        }

        return self::TYPE_UNKNOWN;
    }
}
