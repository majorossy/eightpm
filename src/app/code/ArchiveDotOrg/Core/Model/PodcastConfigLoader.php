<?php
declare(strict_types=1);

namespace ArchiveDotOrg\Core\Model;

use ArchiveDotOrg\Core\Api\PodcastConfigLoaderInterface;
use ArchiveDotOrg\Core\Api\PodcastConfigValidatorInterface;
use ArchiveDotOrg\Core\Exception\ConfigurationException;
use Magento\Framework\Filesystem\DirectoryList;
use Psr\Log\LoggerInterface;

/**
 * Podcast Configuration Loader
 *
 * Loads and validates podcast YAML configuration files.
 * Supports both yaml_parse_file() and Symfony YAML parser fallback.
 */
class PodcastConfigLoader implements PodcastConfigLoaderInterface
{
    private const YAML_DIR = 'app/code/ArchiveDotOrg/Core/config/podcasts';

    /**
     * Cached configurations
     * @var array<string, array>
     */
    private array $cache = [];

    /**
     * @param DirectoryList $directoryList
     * @param PodcastConfigValidatorInterface $validator
     * @param LoggerInterface $logger
     */
    public function __construct(
        private readonly DirectoryList $directoryList,
        private readonly PodcastConfigValidatorInterface $validator,
        private readonly LoggerInterface $logger
    ) {
    }

    /**
     * @inheritDoc
     */
    public function load(string $podcastKey): array
    {
        if (isset($this->cache[$podcastKey])) {
            return $this->cache[$podcastKey];
        }

        $yamlPath = $this->getYamlPath($podcastKey);

        if (!file_exists($yamlPath)) {
            throw ConfigurationException::missingConfig($yamlPath);
        }

        // Parse YAML if file exists
        if (!function_exists('yaml_parse_file')) {
            // Fallback: try to use Symfony YAML if available
            if (class_exists(\Symfony\Component\Yaml\Yaml::class)) {
                try {
                    $config = \Symfony\Component\Yaml\Yaml::parseFile($yamlPath);
                } catch (\Exception $e) {
                    throw ConfigurationException::invalidValue(
                        'yaml',
                        sprintf('Failed to parse YAML: %s', $e->getMessage())
                    );
                }
            } else {
                throw ConfigurationException::invalidValue(
                    'yaml',
                    'YAML parser not available. Install symfony/yaml or php-yaml extension.'
                );
            }
        } else {
            $config = yaml_parse_file($yamlPath);
            if ($config === false) {
                throw ConfigurationException::invalidValue(
                    'yaml',
                    sprintf('Failed to parse YAML file: %s', $yamlPath)
                );
            }
        }

        // Validate configuration before caching
        $validationResult = $this->validator->validate($config);
        if (!$validationResult['valid']) {
            $errorMessage = sprintf(
                "Invalid YAML configuration for '%s':\n%s",
                $podcastKey,
                implode("\n", $validationResult['errors'])
            );
            throw ConfigurationException::invalidValue('yaml', $errorMessage);
        }

        // Log warnings if present
        if (!empty($validationResult['warnings'])) {
            foreach ($validationResult['warnings'] as $warning) {
                $this->logger->warning(sprintf('[%s] %s', $podcastKey, $warning));
            }
        }

        $this->cache[$podcastKey] = $config;
        return $config;
    }

    /**
     * @inheritDoc
     */
    public function getAvailablePodcasts(): array
    {
        $configDir = $this->getConfigDir();

        if (!is_dir($configDir)) {
            return [];
        }

        $podcasts = [];
        $files = glob($configDir . '/*.yaml') ?: [];

        foreach ($files as $file) {
            $filename = basename($file, '.yaml');
            // Skip template file
            if ($filename !== 'template') {
                $podcasts[] = $filename;
            }
        }

        return $podcasts;
    }

    /**
     * @inheritDoc
     */
    public function clearCache(?string $podcastKey = null): void
    {
        if ($podcastKey === null) {
            $this->cache = [];
        } else {
            unset($this->cache[$podcastKey]);
        }
    }

    /**
     * Get the path to the podcast YAML config file.
     *
     * @param string $podcastKey
     * @return string
     */
    private function getYamlPath(string $podcastKey): string
    {
        return $this->getConfigDir() . '/' . $podcastKey . '.yaml';
    }

    /**
     * Get the configuration directory path.
     *
     * @return string
     */
    private function getConfigDir(): string
    {
        try {
            $rootDir = $this->directoryList->getRoot();
        } catch (\Exception $e) {
            $rootDir = BP;
        }

        return $rootDir . '/' . self::YAML_DIR;
    }
}
