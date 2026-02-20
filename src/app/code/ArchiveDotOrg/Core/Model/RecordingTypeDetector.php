<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

/**
 * Stateless utility to classify recordings from source/lineage/subject/identifier metadata.
 *
 * Priority order: SBD > MX > FM > WEBCAST > AUD > UNKNOWN
 *
 * Detection categories:
 *  1. Explicit keywords in source/lineage/subject text
 *  2. Identifier patterns (e.g. ".sbd.", ".aud.", ".mtx.")
 *  3. Microphone brands/models → implies AUD
 *  4. Field recorder brands/models → implies AUD
 *  5. Equipment detected + SBD context → MX (matrix blend)
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
     * Explicit keyword patterns (highest confidence)
     */
    private const KEYWORD_PATTERNS = [
        self::TYPE_SOUNDBOARD => '/\b(sbd|soundboard|sound.?board|dsbd|direct.?soundboard)\b/i',
        self::TYPE_MATRIX     => '/\b(matrix|mx|matrixed|sbd[\s\/\+&]+aud|aud[\s\/\+&]+sbd)\b/i',
        self::TYPE_FM_BROADCAST => '/\b(fm\s*broadcast|radio\s*broadcast|fm\s*simulcast|fm\s*recording)\b/i',
        self::TYPE_WEBCAST    => '/\b(webcast|livestream|live[\s._-]?stream)\b/i',
        self::TYPE_AUDIENCE   => '/\b(aud|audience|fob|front[\s._-]?of[\s._-]?board)\b/i',
    ];

    /**
     * Standalone "fm" pattern — only matched if no equipment signals present,
     * to avoid false positives from equipment model names containing "fm".
     */
    private const FM_STANDALONE_PATTERN = '/\bfm\b/i';

    /**
     * Identifier segment patterns (high confidence, parsed from Archive.org identifier)
     * These appear as dot-separated segments like "gd1977-05-08.sbd.miller.32601"
     */
    private const IDENTIFIER_PATTERNS = [
        self::TYPE_SOUNDBOARD => '/\.sbd[.\d]/i',
        self::TYPE_AUDIENCE   => '/\.aud[.\d]/i',
        self::TYPE_MATRIX     => '/\.(mtx|matrix)[.\d]/i',
    ];

    /**
     * Microphone brand names → implies audience recording
     */
    private const MIC_BRANDS_PATTERN = '/\b(schoeps|neumann|dpa|sennheiser|beyerdynamic|gefell|oktava|josephson|audio[\s._-]?technica|rode|shure|earthworks|milab|peluso|mbho|elation|naiant|core[\s._-]?sound|superlux|church[\s._-]?audio|line[\s._-]?audio|akg|at[0-9]{3,4})\b/i';

    /**
     * Specific microphone model numbers → implies audience recording
     */
    private const MIC_MODELS_PATTERN = '/\b(ccm4[1v]?|ccm[56]|mk4[1v]|mk2[12s]|km[\s._-]?1[48][04]|tlm[\s._-]?170|at[48][0-9]{2,3}|sm5[78]|sm81|mc930|m300|m310|ka[245]00|ck6[13]|ck9[12]|cmc[56]|[uc]?414|km[\s._-]?8[46]|mc[\s._-]?[89][0-9]{1,2}|c[0-9]{3,4}e?|u8[78]|cmit|nt[1-5]|ntg[1-5]|4006|4011|4060|kc5)\b/i';

    /**
     * Field recorder brand names → implies audience recording
     */
    private const RECORDER_BRANDS_PATTERN = '/\b(sound[\s._-]?devices|tascam|zoom|edirol|iriver|marantz|sony[\s._-]?pcm|nagra|olympus|fostex|roland|korg)\b/i';

    /**
     * Specific recorder model numbers → implies audience recording
     */
    private const RECORDER_MODELS_PATTERN = '/\b(mix[\s._-]?pre[\s._-]?[36]?[d]?|dr[\s._-]?[0-9]{2,3}[x]?|[fh][2-8n]|r[\s._-]?09|pcm[\s._-]?[md][0-9]{1,3}|sd[\s._-]?7[0-9]{2}|744t?|788t?|833|660|702t?|722|usb[\s._-]?pre|da[\s._-]?p1)\b/i';

    /**
     * DAW/software that typically appears in audience recording chains
     */
    private const DAW_PATTERN = '/\b(audacity|sound[\s._-]?forge|wavelab|adobe[\s._-]?audition|flac(?:16|24)?)\b/i';

    /**
     * Detect recording type from metadata fields.
     *
     * @param string|null $source Recording source text
     * @param string|null $lineage Recording lineage text
     * @param string|string[]|null $subjects Subject tags (string or array)
     * @param string|null $identifier Archive.org identifier (e.g. "gd1977-05-08.sbd.miller.32601")
     * @return string One of the TYPE_* constants
     */
    public function detect(?string $source, ?string $lineage, $subjects = [], ?string $identifier = null): string
    {
        // --- Phase 1: Check identifier patterns (fast, high confidence) ---
        $identifierType = $this->detectFromIdentifier($identifier);

        // --- Phase 2: Build combined text from source/lineage/subjects ---
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

        if ($identifier !== null && $identifier !== '') {
            $parts[] = $identifier;
        }

        if (empty($parts) && $identifierType === null) {
            return self::TYPE_UNKNOWN;
        }

        // If we only have an identifier match and no text, return the identifier result
        if (empty($parts)) {
            return $identifierType ?? self::TYPE_UNKNOWN;
        }

        $text = implode(' ', $parts);

        // --- Phase 3: Check explicit keywords (highest priority) ---
        $keywordType = $this->detectFromKeywords($text);
        if ($keywordType !== null) {
            return $keywordType;
        }

        // --- Phase 4: Check equipment signals ---
        $hasEquipment = $this->hasEquipmentSignals($text);

        // If equipment found, check if SBD context also present → MX
        if ($hasEquipment) {
            $hasSbdContext = (bool) preg_match(self::KEYWORD_PATTERNS[self::TYPE_SOUNDBOARD], $text);
            if ($hasSbdContext) {
                return self::TYPE_MATRIX;
            }
            // Equipment without SBD context → AUD
            return self::TYPE_AUDIENCE;
        }

        // --- Phase 5: Check standalone "fm" (after equipment check to avoid false positives) ---
        if (preg_match(self::FM_STANDALONE_PATTERN, $text)) {
            return self::TYPE_FM_BROADCAST;
        }

        // --- Phase 6: Fall back to identifier result if we have one ---
        if ($identifierType !== null) {
            return $identifierType;
        }

        return self::TYPE_UNKNOWN;
    }

    /**
     * Detect recording type from Archive.org identifier segments.
     *
     * Identifiers like "gd1977-05-08.sbd.miller.32601" contain type hints
     * as dot-separated segments.
     */
    private function detectFromIdentifier(?string $identifier): ?string
    {
        if ($identifier === null || $identifier === '') {
            return null;
        }

        foreach (self::IDENTIFIER_PATTERNS as $type => $pattern) {
            if (preg_match($pattern, $identifier)) {
                return $type;
            }
        }

        return null;
    }

    /**
     * Detect recording type from explicit keywords in text.
     *
     * Returns null if no keywords matched (caller should continue to equipment check).
     */
    private function detectFromKeywords(string $text): ?string
    {
        foreach (self::KEYWORD_PATTERNS as $type => $pattern) {
            if (preg_match($pattern, $text)) {
                return $type;
            }
        }

        return null;
    }

    /**
     * Check if text contains equipment signals (microphones, recorders, DAW software).
     *
     * Equipment in source/lineage strongly implies an audience recording.
     */
    private function hasEquipmentSignals(string $text): bool
    {
        return (bool) preg_match(self::MIC_BRANDS_PATTERN, $text)
            || (bool) preg_match(self::MIC_MODELS_PATTERN, $text)
            || (bool) preg_match(self::RECORDER_BRANDS_PATTERN, $text)
            || (bool) preg_match(self::RECORDER_MODELS_PATTERN, $text)
            || (bool) preg_match(self::DAW_PATTERN, $text);
    }
}
