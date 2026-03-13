<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Admin\Model;

use Magento\Framework\Model\AbstractModel;

class Venue extends AbstractModel
{
    protected function _construct(): void
    {
        $this->_init(ResourceModel\Venue::class);
    }

    public function getVenueId(): ?int
    {
        return $this->getData('venue_id') ? (int) $this->getData('venue_id') : null;
    }

    public function getSlug(): ?string
    {
        return $this->getData('slug');
    }

    public function setSlug(string $slug): self
    {
        return $this->setData('slug', $slug);
    }

    public function getNormalizedName(): ?string
    {
        return $this->getData('normalized_name');
    }

    public function setNormalizedName(string $name): self
    {
        return $this->setData('normalized_name', $name);
    }

    public function getCity(): ?string
    {
        return $this->getData('city');
    }

    public function setCity(?string $city): self
    {
        return $this->setData('city', $city);
    }

    public function getState(): ?string
    {
        return $this->getData('state');
    }

    public function setState(?string $state): self
    {
        return $this->setData('state', $state);
    }

    public function getCountry(): ?string
    {
        return $this->getData('country');
    }

    public function setCountry(?string $country): self
    {
        return $this->setData('country', $country);
    }

    public function getTotalShows(): int
    {
        return (int) ($this->getData('total_shows') ?? 0);
    }

    public function getTotalArtists(): int
    {
        return (int) ($this->getData('total_artists') ?? 0);
    }

    public function getTotalTracks(): int
    {
        return (int) ($this->getData('total_tracks') ?? 0);
    }
}
