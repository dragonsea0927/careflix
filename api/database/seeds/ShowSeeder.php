<?php

use Illuminate\Database\Seeder;

class ShowSeeder extends Seeder
{
    /**
     * Run the database seeds.
     *
     * @return void
     */
    public function run()
    {
        $faker = Faker::create();

        $movies = [
            [
                'title' => 'Bumblebee',
                'title_type' => 'movie',
                'synopsis' => $faker->text,
                'language' => 'English',
                'air_start' => Carbon::create(2018),
                'preview_image' => '',
                'age_rating' => '',
                //
                'duration' => Helper::getDurationInSecondsFromReadableFormat('1:53:52')
            ],
            [
                'title' => 'How To Train Your Dragon 2',
                'title_type' => 'movie',
                'synopsis' => $faker->text,
                'language' => 'English',
                'air_start' => Carbon::create(2014),
                'preview_image' => '',
                'age_rating' => '',
                //
                'duration' => Helper::getDurationInSecondsFromReadableFormat('1:41:55')
            ],
            [
                'title' => 'How To Train Your Dragon: The Hidden World',
                'title_type' => 'movie',
                'synopsis' => $faker->text,
                'language' => 'English',
                'air_start' => Carbon::create(2019),
                'preview_image' => '',
                'age_rating' => '',
                //
                'duration' => Helper::getDurationInSecondsFromReadableFormat('1:41:23')
            ],
            [
                'title' => 'Spider-Man: Into The Spider-Verse',
                'title_type' => 'movie',
                'synopsis' => $faker->text,
                'language' => 'English',
                'air_start' => Carbon::create(2018),
                'preview_image' => '',
                'age_rating' => '',
                //
                'duration' => Helper::getDurationInSecondsFromReadableFormat('1:56:48')
            ]
        ];

        foreach($movies as $movie) {
            $show = App\Show::create(Arr::except($movie, ['duration']));

            App\ShowVideo::create([
                'show_id' => $show->id,
                'video_url' => Helper::getVideoUrlFromMovieTitle($show->title),
                'duration' => $movie['duration'],
                'synopsis' => $faker->text,
            ]);
        }

        $series = [
            [
                'title' => 'We Bare Bears',
                'title_type' => 'series',
                'synopsis' => $faker->text,
                'language' => 'English',
                'air_start' => Carbon::create(2018),
                'preview_image' => '',
                'age_rating' => 'G',
                //
                'seasons' => [
                    [
                        'title' => 'Season 1',
                        'episodes' => 1
                    ]
                ]
            ]
        ];

        foreach($series as $series) {
            $show = App\Show::create(Arr::except($series, ['seasons']));

            foreach($show['seasons'] as $i => $season) {
                $group = App\ShowGroup::create([
                    'title' => $season['title']
                ]);

                for($j = 0; $j < $season['episodes']; $j++) {
                    App\ShowVideo::create([
                        'show_group_id' => $group->id,
                        'show_id' => $show->id,
                        'title' => "Episode {$j}",
                        'video_url' => \App\Support\Helper::getVideoUrlFromEpisode([
                            'title' => $show->title,
                            'season' => $i + 1,
                            'episode' => $j + 1
                        ]),
                        'duration' => Helper::getDurationInSecondsFromReadableFormat('11:09'),
                        'synopsis' => $faker->text,
                    ]);
                }
            }
        }
    }
}
