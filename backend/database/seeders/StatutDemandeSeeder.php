<?php

namespace Database\Seeders;

use App\Models\StatutDemande;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class StatutDemandeSeeder extends Seeder
{
    public function run()
    {
        $statuts = [
            ['libelle' => 'En attente'],
            ['libelle' => 'Validée'],
            ['libelle' => 'Refusée'],
            ['libelle' => 'Annulée'],
        ];

        foreach ($statuts as $statut) {
            StatutDemande::create($statut);
        }
    }
}