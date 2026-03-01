<?php

declare(strict_types=1);

namespace ArchiveDotOrg\Core\Console\Command;

use ArchiveDotOrg\Core\Model\WikipediaClient;
use Magento\Framework\App\ResourceConnection;
use Symfony\Component\Console\Command\Command;
use Symfony\Component\Console\Input\InputArgument;
use Symfony\Component\Console\Input\InputInterface;
use Symfony\Component\Console\Input\InputOption;
use Symfony\Component\Console\Output\OutputInterface;

/**
 * CLI command to populate release years for studio albums from Wikipedia
 *
 * Usage:
 *   bin/magento archive:artwork:populate-years
 *   bin/magento archive:artwork:populate-years "Railroad Earth"
 *   bin/magento archive:artwork:populate-years --force
 */
class PopulateAlbumYearsCommand extends Command
{
    private const ARTIST_ARGUMENT = 'artist';
    private const OPTION_FORCE = 'force';

    private WikipediaClient $wikipediaClient;
    private ResourceConnection $resourceConnection;

    public function __construct(
        WikipediaClient $wikipediaClient,
        ResourceConnection $resourceConnection,
        string $name = null
    ) {
        parent::__construct($name);
        $this->wikipediaClient = $wikipediaClient;
        $this->resourceConnection = $resourceConnection;
    }

    protected function configure(): void
    {
        $this->setName('archive:artwork:populate-years')
            ->setDescription('Populate studio album release years from Wikipedia')
            ->addArgument(
                self::ARTIST_ARGUMENT,
                InputArgument::OPTIONAL,
                'Artist name to populate (omit for all artists)'
            )
            ->addOption(
                self::OPTION_FORCE,
                'f',
                InputOption::VALUE_NONE,
                'Re-fetch years even for albums that already have one'
            );

        parent::configure();
    }

    protected function execute(InputInterface $input, OutputInterface $output): int
    {
        $artistName = $input->getArgument(self::ARTIST_ARGUMENT);
        $force = $input->getOption(self::OPTION_FORCE);

        $connection = $this->resourceConnection->getConnection();
        $tableName = $connection->getTableName('archivedotorg_studio_albums');

        $select = $connection->select()
            ->from($tableName, ['entity_id', 'artist_name', 'album_title', 'release_year']);

        if (!$force) {
            $select->where('release_year IS NULL');
        }

        if ($artistName) {
            $select->where('artist_name = ?', $artistName);
        }

        $select->order(['artist_name ASC', 'album_title ASC']);

        $albums = $connection->fetchAll($select);

        if (empty($albums)) {
            $output->writeln('<info>No albums need year population.</info>');
            return Command::SUCCESS;
        }

        $output->writeln(sprintf('<info>Processing %d albums...</info>', count($albums)));

        $found = 0;
        $notFound = 0;
        $errors = 0;
        $currentArtist = '';

        foreach ($albums as $i => $album) {
            $artist = $album['artist_name'];
            $title = $album['album_title'];

            if ($artist !== $currentArtist) {
                $currentArtist = $artist;
                $output->writeln('');
                $output->writeln("<comment>$artist</comment>");
            }

            try {
                $year = $this->wikipediaClient->getAlbumReleaseYear($artist, $title);

                if ($year !== null) {
                    $connection->update(
                        $tableName,
                        ['release_year' => $year],
                        ['entity_id = ?' => $album['entity_id']]
                    );
                    $output->writeln("  <info>✓</info> $title → $year");
                    $found++;
                } else {
                    $output->writeln("  <comment>–</comment> $title → not found");
                    $notFound++;
                }

                // Rate limit: Wikipedia asks for <200 req/s, but be polite
                usleep(250000); // 250ms between requests

            } catch (\Exception $e) {
                $output->writeln("  <error>✗</error> $title → " . $e->getMessage());
                $errors++;
            }
        }

        $output->writeln('');
        $output->writeln('<info>Summary:</info>');
        $output->writeln("  Total processed: " . count($albums));
        $output->writeln("  Years found: $found");
        $output->writeln("  Not found: $notFound");
        $output->writeln("  Errors: $errors");

        return Command::SUCCESS;
    }
}
