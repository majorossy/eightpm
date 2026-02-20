<?php
/**
 * ArchiveDotOrg Core Module
 */

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Setup\Patch\Data;

use Magento\Catalog\Model\Category;
use Magento\Eav\Model\Entity\Attribute\ScopedAttributeInterface;
use Magento\Eav\Setup\EavSetupFactory;
use Magento\Framework\Setup\ModuleDataSetupInterface;
use Magento\Framework\Setup\Patch\DataPatchInterface;

/**
 * Create Podcast Category Attributes Data Patch
 *
 * Creates category attributes for podcast classification and metadata.
 * Podcasts will reuse existing band_* attributes (band_extended_bio, band_image_url,
 * band_official_website, band_facebook, band_instagram, band_twitter, band_genres)
 * for shared metadata fields.
 */
class CreatePodcastCategoryAttributes implements DataPatchInterface
{
    /**
     * Podcast-specific category attributes to create
     */
    private const ATTRIBUTES = [
        'is_podcast' => [
            'type' => 'int',
            'label' => 'Is a Podcast?',
            'input' => 'select',
            'source' => \Magento\Eav\Model\Entity\Attribute\Source\Boolean::class,
            'required' => false,
            'sort_order' => 125,
            'global' => ScopedAttributeInterface::SCOPE_GLOBAL,
            'group' => 'General Information',
            'note' => 'Marks category as podcast container',
        ],
        'podcast_spotify_url' => [
            'type' => 'varchar',
            'label' => 'Spotify Podcast URL',
            'input' => 'text',
            'required' => false,
            'sort_order' => 250,
            'global' => ScopedAttributeInterface::SCOPE_GLOBAL,
            'group' => 'Social Media',
            'note' => 'Full Spotify podcast URL',
        ],
        'podcast_apple_url' => [
            'type' => 'varchar',
            'label' => 'Apple Podcasts URL',
            'input' => 'text',
            'required' => false,
            'sort_order' => 260,
            'global' => ScopedAttributeInterface::SCOPE_GLOBAL,
            'group' => 'Social Media',
            'note' => 'Full Apple Podcasts URL',
        ],
        'podcast_youtube_url' => [
            'type' => 'varchar',
            'label' => 'YouTube Podcast URL',
            'input' => 'text',
            'required' => false,
            'sort_order' => 270,
            'global' => ScopedAttributeInterface::SCOPE_GLOBAL,
            'group' => 'Social Media',
            'note' => 'Full YouTube channel/playlist URL',
        ],
        'podcast_rss_feed' => [
            'type' => 'varchar',
            'label' => 'Podcast RSS Feed',
            'input' => 'text',
            'required' => false,
            'sort_order' => 280,
            'global' => ScopedAttributeInterface::SCOPE_GLOBAL,
            'group' => 'Social Media',
            'note' => 'Full RSS feed URL',
        ],
    ];

    private ModuleDataSetupInterface $moduleDataSetup;
    private EavSetupFactory $eavSetupFactory;

    public function __construct(
        ModuleDataSetupInterface $moduleDataSetup,
        EavSetupFactory $eavSetupFactory
    ) {
        $this->moduleDataSetup = $moduleDataSetup;
        $this->eavSetupFactory = $eavSetupFactory;
    }

    /**
     * @inheritDoc
     */
    public function apply(): self
    {
        $eavSetup = $this->eavSetupFactory->create(['setup' => $this->moduleDataSetup]);

        $this->moduleDataSetup->getConnection()->startSetup();

        // Add all attributes to category entity
        foreach (self::ATTRIBUTES as $attributeCode => $config) {
            $eavSetup->addAttribute(
                Category::ENTITY,
                $attributeCode,
                [
                    'type' => $config['type'],
                    'label' => $config['label'],
                    'input' => $config['input'],
                    'source' => $config['source'] ?? '',
                    'required' => $config['required'],
                    'sort_order' => $config['sort_order'],
                    'global' => $config['global'],
                    'group' => $config['group'],
                    'note' => $config['note'] ?? '',
                    'visible' => true,
                    'user_defined' => true,
                    'searchable' => false,
                    'filterable' => false,
                    'comparable' => false,
                    'visible_on_front' => true,
                    'used_in_product_listing' => false,
                    'unique' => false,
                ]
            );
        }

        $this->moduleDataSetup->getConnection()->endSetup();

        return $this;
    }

    /**
     * @inheritDoc
     */
    public static function getDependencies(): array
    {
        // Depends on band_* attributes already existing
        return [
            AddArtistBandDataAttributes::class,
        ];
    }

    /**
     * @inheritDoc
     */
    public function getAliases(): array
    {
        return [];
    }
}
