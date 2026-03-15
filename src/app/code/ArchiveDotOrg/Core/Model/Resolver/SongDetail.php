<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Framework\GraphQl\Exception\GraphQlInputException;
use Magento\Framework\GraphQl\Exception\GraphQlNoSuchEntityException;
use Magento\Framework\App\ResourceConnection;

/**
 * Resolver for songDetail() GraphQL query — single-song stats page.
 *
 * Looks up a song category by (artistSlug, songSlug) and computes
 * aggregate stats across all product versions assigned to that category.
 */
class SongDetail implements ResolverInterface
{
    private ResourceConnection $resourceConnection;

    public function __construct(ResourceConnection $resourceConnection)
    {
        $this->resourceConnection = $resourceConnection;
    }

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        $artistSlug = $args['artistSlug'] ?? '';
        $songSlug = $args['songSlug'] ?? '';

        if (!$artistSlug || !$songSlug) {
            throw new GraphQlInputException(__('Both artistSlug and songSlug are required.'));
        }

        $connection = $this->resourceConnection->getConnection();

        // Load required EAV attribute IDs for category entity (type 3)
        $eavTable = $connection->getTableName('eav_attribute');
        $catAttrRows = $connection->fetchPairs(
            $connection->select()
                ->from($eavTable, ['attribute_code', 'attribute_id'])
                ->where('entity_type_id = 3')
                ->where('attribute_code IN (?)', ['is_song', 'name', 'url_key'])
        );
        $catAttrs = array_map('intval', $catAttrRows);

        $catTable = $connection->getTableName('catalog_category_entity');
        $catIntTable = $connection->getTableName('catalog_category_entity_int');
        $catVarcharTable = $connection->getTableName('catalog_category_entity_varchar');
        $catProductTable = $connection->getTableName('catalog_category_product');
        $prodVarcharTable = $connection->getTableName('catalog_product_entity_varchar');
        $prodDatetimeTable = $connection->getTableName('catalog_product_entity_datetime');
        $prodDecimalTable = $connection->getTableName('catalog_product_entity_decimal');
        $prodIntTable = $connection->getTableName('catalog_product_entity_int');

        // Find song category: level 5, is_song=1, matching slugs
        $select = $connection->select()
            ->from(['song' => $catTable], ['entity_id'])
            ->join(
                ['is_song' => $catIntTable],
                sprintf(
                    'is_song.entity_id = song.entity_id AND is_song.attribute_id = %d AND is_song.store_id = 0 AND is_song.value = 1',
                    $catAttrs['is_song']
                ),
                []
            )
            ->join(
                ['song_url' => $catVarcharTable],
                sprintf(
                    'song_url.entity_id = song.entity_id AND song_url.attribute_id = %d AND song_url.store_id = 0',
                    $catAttrs['url_key']
                ),
                []
            )
            ->join(
                ['song_name' => $catVarcharTable],
                sprintf(
                    'song_name.entity_id = song.entity_id AND song_name.attribute_id = %d AND song_name.store_id = 0',
                    $catAttrs['name']
                ),
                ['title' => 'song_name.value']
            )
            ->join(
                ['album' => $catTable],
                'album.entity_id = song.parent_id AND album.level = 4',
                []
            )
            ->join(
                ['artist' => $catTable],
                'artist.entity_id = album.parent_id AND artist.level = 3',
                []
            )
            ->join(
                ['artist_url' => $catVarcharTable],
                sprintf(
                    'artist_url.entity_id = artist.entity_id AND artist_url.attribute_id = %d AND artist_url.store_id = 0',
                    $catAttrs['url_key']
                ),
                ['artist_slug' => 'artist_url.value']
            )
            ->join(
                ['artist_name' => $catVarcharTable],
                sprintf(
                    'artist_name.entity_id = artist.entity_id AND artist_name.attribute_id = %d AND artist_name.store_id = 0',
                    $catAttrs['name']
                ),
                ['artist_name' => 'artist_name.value']
            )
            ->where('song.level = 5')
            ->where('song_url.value = ?', $songSlug)
            ->where('artist_url.value = ?', $artistSlug)
            ->limit(1);

        $row = $connection->fetchRow($select);

        if (!$row) {
            throw new GraphQlNoSuchEntityException(
                __('Song "%1" not found for artist "%2".', $songSlug, $artistSlug)
            );
        }

        $categoryId = (int)$row['entity_id'];

        // Compute aggregate stats via correlated queries on products in this category
        $statsSelect = $connection->select()
            ->from(['cp' => $catProductTable], [
                'version_count' => new \Zend_Db_Expr('COUNT(cp.product_id)'),
            ])
            // avg_duration from length varchar (format "M:SS")
            ->columns([
                'avg_duration' => new \Zend_Db_Expr(sprintf(
                    'AVG(CASE WHEN pv_len.value LIKE \'%%:%%\' THEN '
                    . 'SUBSTRING_INDEX(pv_len.value, \':\', 1) * 60 + SUBSTRING_INDEX(pv_len.value, \':\', -1) '
                    . 'ELSE NULL END)',
                )),
                'longest_duration' => new \Zend_Db_Expr(
                    'MAX(CASE WHEN pv_len.value LIKE \'%:%\' THEN '
                    . 'SUBSTRING_INDEX(pv_len.value, \':\', 1) * 60 + SUBSTRING_INDEX(pv_len.value, \':\', -1) '
                    . 'ELSE NULL END)',
                ),
                'shortest_duration' => new \Zend_Db_Expr(
                    'MIN(CASE WHEN pv_len.value LIKE \'%:%\' THEN '
                    . 'SUBSTRING_INDEX(pv_len.value, \':\', 1) * 60 + SUBSTRING_INDEX(pv_len.value, \':\', -1) '
                    . 'ELSE NULL END)',
                ),
            ])
            ->joinLeft(
                ['pv_len' => $prodVarcharTable],
                'pv_len.entity_id = cp.product_id AND pv_len.attribute_id = 238 AND pv_len.store_id = 0',
                []
            )
            // show_date (attribute 248, datetime)
            ->joinLeft(
                ['pd_date' => $prodDatetimeTable],
                'pd_date.entity_id = cp.product_id AND pd_date.attribute_id = 248 AND pd_date.store_id = 0',
                [
                    'first_played' => new \Zend_Db_Expr('MIN(pd_date.value)'),
                    'last_played' => new \Zend_Db_Expr('MAX(pd_date.value)'),
                ]
            )
            // archive_avg_rating (attribute 260, decimal)
            ->joinLeft(
                ['pdc_rat' => $prodDecimalTable],
                'pdc_rat.entity_id = cp.product_id AND pdc_rat.attribute_id = 260 AND pdc_rat.store_id = 0',
                [
                    'avg_rating' => new \Zend_Db_Expr('AVG(CASE WHEN pdc_rat.value > 0 THEN pdc_rat.value ELSE NULL END)'),
                ]
            )
            // archive_downloads (attribute 262, int)
            ->joinLeft(
                ['pi_dl' => $prodIntTable],
                'pi_dl.entity_id = cp.product_id AND pi_dl.attribute_id = 262 AND pi_dl.store_id = 0',
                [
                    'total_downloads' => new \Zend_Db_Expr('SUM(pi_dl.value)'),
                ]
            )
            ->where('cp.category_id = ?', $categoryId);

        $stats = $connection->fetchRow($statsSelect);

        // Get distinct years played
        $yearsSelect = $connection->select()
            ->from(['cp' => $catProductTable], [])
            ->joinLeft(
                ['pd' => $prodDatetimeTable],
                'pd.entity_id = cp.product_id AND pd.attribute_id = 248 AND pd.store_id = 0',
                ['year' => new \Zend_Db_Expr('DISTINCT YEAR(pd.value)')]
            )
            ->where('cp.category_id = ?', $categoryId)
            ->where('pd.value IS NOT NULL')
            ->order('year ASC');

        $years = $connection->fetchCol($yearsSelect);
        $yearsPlayed = array_filter(array_map('strval', $years), fn($y) => $y !== '' && $y !== '0');

        return [
            'category_id' => $categoryId,
            'title' => $row['title'],
            'url_key' => $songSlug,
            'artist_name' => $row['artist_name'],
            'artist_slug' => $row['artist_slug'],
            'version_count' => (int)($stats['version_count'] ?? 0),
            'avg_duration' => $stats['avg_duration'] !== null ? (float)$stats['avg_duration'] : null,
            'first_played' => !empty($stats['first_played']) ? substr($stats['first_played'], 0, 10) : null,
            'last_played' => !empty($stats['last_played']) ? substr($stats['last_played'], 0, 10) : null,
            'avg_rating' => $stats['avg_rating'] !== null ? round((float)$stats['avg_rating'], 2) : null,
            'total_downloads' => $stats['total_downloads'] !== null ? (int)$stats['total_downloads'] : null,
            'longest_duration' => $stats['longest_duration'] !== null ? (float)$stats['longest_duration'] : null,
            'shortest_duration' => $stats['shortest_duration'] !== null ? (float)$stats['shortest_duration'] : null,
            'years_played' => array_values($yearsPlayed),
        ];
    }
}
