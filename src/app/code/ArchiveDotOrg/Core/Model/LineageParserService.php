<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

/**
 * Parses lineage and source fields from Archive.org metadata to extract
 * structured recording equipment data (medium, microphone, recorder, etc.)
 */
class LineageParserService
{
    /**
     * Parse lineage and source strings into structured recording equipment data
     *
     * @param string|null $lineage
     * @param string|null $source
     * @return array{recording_medium: ?string, microphone_model: ?string, recorder_device: ?string, preamp_model: ?string, ad_converter: ?string, editing_software: ?string, final_format: ?string}
     */
    public function parse(?string $lineage, ?string $source): array
    {
        $combined = trim(($lineage ?? '') . ' ' . ($source ?? ''));

        return [
            'recording_medium' => $this->detectMedium($combined),
            'microphone_model' => $this->detectMicrophone($combined),
            'recorder_device' => $this->detectRecorder($combined),
            'preamp_model' => $this->detectPreamp($combined),
            'ad_converter' => $this->detectAdConverter($combined),
            'editing_software' => $this->detectEditingSoftware($combined),
            'final_format' => $this->detectFinalFormat($lineage),
        ];
    }

    /**
     * Detect recording medium type (priority order)
     */
    private function detectMedium(string $text): ?string
    {
        if (empty($text)) {
            return null;
        }

        // 1. Microcassette
        if (preg_match('/microcassette|micro[\s-]mc|micro-cassette/i', $text)) {
            return 'microcassette';
        }

        // 2. Cassette (but not DAT-related tape references)
        // Check for Nakamichi cassette deck models
        if (preg_match('/Nakamichi\s*(CR|DR|BX|RX)[\w-]*/i', $text)) {
            return 'cassette';
        }
        if (preg_match('/\bcass(?:ette)?\b/i', $text)) {
            return 'cassette';
        }
        // "tape" matches cassette only if DAT is not present
        if (preg_match('/\btape\b/i', $text) && !preg_match('/\btape\s+deck\b/i', $text) && !preg_match('/\bDAT\b/', $text)) {
            return 'cassette';
        }

        // 3. DAT
        if (preg_match('/\bDAT\b/', $text)) {
            return 'dat';
        }
        if (preg_match('/\bDA-(20|30|45|P1)\b/i', $text)) {
            return 'dat';
        }
        if (preg_match('/Fostex\s*D-5/i', $text)) {
            return 'dat';
        }
        if (preg_match('/PCM-M1/i', $text)) {
            return 'dat';
        }
        if (preg_match('/SV-[34]\d+/i', $text)) {
            return 'dat';
        }
        if (preg_match('/DTC-\d+/i', $text)) {
            return 'dat';
        }

        // 4. MiniDisc
        if (preg_match('/minidisc|\bMD\b|Hi-MD|\bMZ-/i', $text)) {
            return 'minidisc';
        }

        // 5. Reel-to-reel
        if (preg_match('/\breel\b|Revox|Nagra|Ampex|Studer|Otari/i', $text)) {
            return 'reel_to_reel';
        }

        // 6. CD
        if (preg_match('/CD-?R\b|\bCD>|\bEAC\b|Exact Audio Copy|\bCDR\b/i', $text)) {
            return 'cd';
        }

        // 7. SD card
        if (preg_match('/\bSD\s*card\b|\bSDHC\b|\bmicroSD\b/i', $text)) {
            return 'sd_card';
        }

        // 8. CompactFlash
        if (preg_match('/CompactFlash/i', $text)) {
            return 'compact_flash';
        }
        if (preg_match('/\bCF\s*card\b/i', $text)) {
            return 'compact_flash';
        }
        if (preg_match('/\bCF>/i', $text)) {
            return 'compact_flash';
        }

        // 9. Flash recorder (specific device models)
        if (preg_match('/\b722\b|\b744[tT]?\b|\b788[tT]?\b|\b833\b/i', $text)) {
            return 'flash_recorder';
        }
        if (preg_match('/DR-680|DR-100|DR-40|DR-05|DR-07/i', $text)) {
            return 'flash_recorder';
        }
        if (preg_match('/iRiver|Nomad|MixPre/i', $text)) {
            return 'flash_recorder';
        }
        if (preg_match('/\bH[1-8n]\b/i', $text)) {
            return 'flash_recorder';
        }
        if (preg_match('/\bR\d+\b/', $text) && preg_match('/Zoom/i', $text)) {
            return 'flash_recorder';
        }
        if (preg_match('/PMD\d+/i', $text)) {
            return 'flash_recorder';
        }
        if (preg_match('/FR-2/i', $text)) {
            return 'flash_recorder';
        }

        // 10. Bandcamp
        if (preg_match('/Bandcamp/i', $text)) {
            return 'flash_recorder';
        }

        return null;
    }

    /**
     * Detect microphone model (return first match)
     */
    private function detectMicrophone(string $text): ?string
    {
        if (empty($text)) {
            return null;
        }

        $patterns = [
            '/Schoeps\s+\w+/i',
            '/AKG\s*[\w-]+/i',
            '/Neumann\s+[\w]+/i',
            '/DPA\s*\d+/i',
            '/Sennheiser\s*[\w]+/i',
            '/Audio[- ]?Technica\s+AT\d+\w*/i',
            '/\bAT\d{3,}\w*/i',
            '/MBHO\s*[\w-]+/i',
            '/Oktava\s*[\w-]+/i',
            '/Gefell\s*[\w-]+/i',
            '/Milab\s*[\w-]+/i',
            '/ADK\s*[\w-]+/i',
            '/BSC\s*[\w-]+/i',
            '/Rode\s*[\w-]+/i',
            '/Shure\s*[\w-]+/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return trim($matches[0]);
            }
        }

        return null;
    }

    /**
     * Detect recording device
     */
    private function detectRecorder(string $text): ?string
    {
        if (empty($text)) {
            return null;
        }

        $patterns = [
            '/Sound\s*Devices\s*[\w-]+/i',
            '/MixPre[-\s]?\d+/i',
            '/\b(722|744[tT]?|788[tT]?|833)\b/',
            '/Tascam\s*[\w-]+/i',
            '/\b(DR-\d+\w*|DA-\d+\w*|HD-P2)\b/i',
            '/Sony\s*[\w-]+/i',
            '/PCM-[MD]\d+/i',
            '/Zoom\s*[\w]+/i',
            '/Marantz\s*\w+/i',
            '/PMD\d+/i',
            '/Fostex\s*[\w-]+/i',
            '/iRiver\s*\w+/i',
            '/(?:Creative\s+)?Nomad\s*\w*/i',
            '/Nagra\s*\w*/i',
            '/Korg\s*[\w-]+/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return trim($matches[0]);
            }
        }

        return null;
    }

    /**
     * Detect preamplifier model
     */
    private function detectPreamp(string $text): ?string
    {
        if (empty($text)) {
            return null;
        }

        $patterns = [
            '/Aerco\s*[\w-]*/i',
            '/Naiant\s*PFA\s*[\w-]*/i',
            '/Lunatec\s*V[23]\w*/i',
            '/Grace\s*m\d+\w*/i',
            '/Oade\s*[\w-]*/i',
            '/\bSBM1\b/i',
            '/Busman\s*[\w-]*/i',
            '/\bnbob\s*[\w-]*/i',
            '/Portico\s*[\w-]*/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return trim($matches[0]);
            }
        }

        return null;
    }

    /**
     * Detect A/D converter
     */
    private function detectAdConverter(string $text): ?string
    {
        if (empty($text)) {
            return null;
        }

        $patterns = [
            '/\bSBM1\b/i',
            '/Audiophile\s*24\/96/i',
            '/Soundblaster\s*[\w-]*/i',
            '/\bUA-5\b/i',
            '/Apogee\s*[\w-]*/i',
            '/Benchmark\s*[\w-]*/i',
            '/\bRME\s*[\w-]*/i',
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $text, $matches)) {
                return trim($matches[0]);
            }
        }

        return null;
    }

    /**
     * Detect editing software (return normalized name)
     */
    private function detectEditingSoftware(string $text): ?string
    {
        if (empty($text)) {
            return null;
        }

        $softwareMap = [
            '/\bAudacity\b/i' => 'Audacity',
            '/\bSound\s*Forge\b|\bSoundforge\b/i' => 'Sound Forge',
            '/\bSF\d/i' => 'Sound Forge',
            '/\bWavelab\b/i' => 'WaveLab',
            '/\bCool\s*Edit\s*Pro\b|\bCEP\b/i' => 'Cool Edit Pro',
            '/\bAdobe\s*Audition\b/i' => 'Adobe Audition',
            '/\bCD\s*Wave\b|\bCDWave\b|\bCDWAV\b/i' => 'CD Wave',
            '/\bSamplitude\b/i' => 'Samplitude',
            '/\bFission\b/i' => 'Fission',
            '/\bSound\s*Studio\b/i' => 'Sound Studio',
            '/\bxACT\b/' => 'xACT',
            '/\bfoobar2000\b|\bfoobar\b/i' => 'foobar2000',
        ];

        foreach ($softwareMap as $pattern => $name) {
            if (preg_match($pattern, $text)) {
                return $name;
            }
        }

        return null;
    }

    /**
     * Detect final output format (look at end of lineage string)
     */
    private function detectFinalFormat(?string $lineage): ?string
    {
        if ($lineage === null || trim($lineage) === '') {
            return null;
        }

        // Look at the end of the lineage for the final format
        // Check the last ~100 characters for format mentions
        $tail = substr($lineage, -100);

        if (preg_match('/\bFLAC\b/i', $tail)) {
            return 'FLAC';
        }
        if (preg_match('/\bSHN\b|\bShorten\b/i', $tail)) {
            return 'SHN';
        }
        if (preg_match('/\bWAV\b/i', $tail)) {
            return 'WAV';
        }
        if (preg_match('/\bMP3\b/i', $tail)) {
            return 'MP3';
        }

        // If not found at the end, check the whole lineage
        if (preg_match('/\bFLAC\b/i', $lineage)) {
            return 'FLAC';
        }
        if (preg_match('/\bSHN\b|\bShorten\b/i', $lineage)) {
            return 'SHN';
        }
        if (preg_match('/\bWAV\b/i', $lineage)) {
            return 'WAV';
        }
        if (preg_match('/\bMP3\b/i', $lineage)) {
            return 'MP3';
        }

        return null;
    }
}
