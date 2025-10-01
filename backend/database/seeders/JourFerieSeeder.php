<?php

namespace Database\Seeders;

use App\Models\JourFerie;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class JourFerieSeeder extends Seeder
{
    public function run()
    {
        $annee = date('Y');
        $joursFeries = [
            ['date' => $annee . '-01-01', 'description' => 'Nouvel An'],
            ['date' => $annee . '-05-01', 'description' => 'Fête du Travail'],
            ['date' => $annee . '-05-08', 'description' => 'Victoire 1945'],
            ['date' => $annee . '-07-14', 'description' => 'Fête Nationale'],
            ['date' => $annee . '-08-15', 'description' => 'Assomption'],
            ['date' => $annee . '-11-01', 'description' => 'Toussaint'],
            ['date' => $annee . '-11-11', 'description' => 'Armistice'],
            ['date' => $annee . '-12-25', 'description' => 'Noël'],
        ];

        foreach ($joursFeries as $jour) {
            JourFerie::create($jour);
        }
    }
}