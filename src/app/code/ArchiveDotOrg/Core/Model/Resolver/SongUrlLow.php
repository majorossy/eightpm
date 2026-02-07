<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

/**
 * Resolver for song_url_low field
 */
class SongUrlLow implements ResolverInterface
{
    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        if (!isset($value['model'])) {
            return null;
        }

        $product = $value['model'];
        $songUrlsJson = $product->getData('song_urls');

        if (!$songUrlsJson) {
            // No multi-quality URLs available; only SongUrlHigh falls back to legacy song_url
            return null;
        }

        $qualityUrls = json_decode($songUrlsJson, true);
        return $qualityUrls['low']['url'] ?? null;
    }
}
