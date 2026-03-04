<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Customer\Exception;

use Magento\Framework\Exception\LocalizedException;

class CollectionException extends LocalizedException
{
    public static function limitExceeded(string $type, int $max): self
    {
        return new self(__('Maximum %1 limit of %2 reached.', $type, $max));
    }

    public static function notFound(string $type, string $identifier): self
    {
        return new self(__('%1 with identifier "%2" not found.', $type, $identifier));
    }
}
