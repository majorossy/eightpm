<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Admin\Ui\Component\Listing;

use Magento\Framework\View\Element\UiComponent\DataProvider\DataProvider;
use Magento\Framework\App\ResourceConnection;

class VenueDataProvider extends DataProvider
{
    /**
     * @var ResourceConnection
     */
    private $resourceConnection;

    public function __construct(
        $name,
        $primaryFieldName,
        $requestFieldName,
        \Magento\Framework\Api\Search\ReportingInterface $reporting,
        \Magento\Framework\Api\Search\SearchCriteriaBuilder $searchCriteriaBuilder,
        \Magento\Framework\App\RequestInterface $request,
        \Magento\Framework\Api\FilterBuilder $filterBuilder,
        ResourceConnection $resourceConnection,
        array $meta = [],
        array $data = []
    ) {
        parent::__construct($name, $primaryFieldName, $requestFieldName, $reporting, $searchCriteriaBuilder, $request, $filterBuilder, $meta, $data);
        $this->resourceConnection = $resourceConnection;
    }

    public function getData()
    {
        $data = parent::getData();

        if (isset($data['items'])) {
            $connection = $this->resourceConnection->getConnection();
            $aliasTable = $connection->getTableName('archivedotorg_venue_alias');

            foreach ($data['items'] as &$item) {
                $aliasCount = (int) $connection->fetchOne(
                    $connection->select()
                        ->from($aliasTable, [new \Zend_Db_Expr('COUNT(*)')])
                        ->where('venue_id = ?', $item['venue_id'])
                );
                $item['alias_count'] = $aliasCount;
            }
        }

        return $data;
    }
}
