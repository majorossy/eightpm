<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model\Resolver;

use ArchiveDotOrg\Core\Model\VenueMapService;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;

class ProductVenueInfo implements ResolverInterface
{
    private VenueMapService $venueMapService;

    public function __construct(VenueMapService $venueMapService)
    {
        $this->venueMapService = $venueMapService;
    }

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        $rawVenue = $value['show_venue'] ?? null;
        if (!$rawVenue || !is_string($rawVenue)) {
            return null;
        }

        return $this->venueMapService->resolve($rawVenue);
    }
}
