<?php

namespace Database\Seeders;

use App\Models\DemandeConge;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DemandeCongeSeeder extends Seeder
{
    public function run()
    {
        $demandes = [
            [
                'dateDebut' => now()->addDays(10)->format('Y-m-d'),
                'dateFin' => now()->addDays(17)->format('Y-m-d'),
                'motif' => 'Vacances en famille',
                'idEmploye' => 'IT002',
                'idType' => 1, // Congé Annuel
                'idStatut' => 1, // En attente
            ],
            [
                'dateDebut' => now()->addDays(5)->format('Y-m-d'),
                'dateFin' => now()->addDays(7)->format('Y-m-d'),
                'motif' => 'Formation professionnelle',
                'idEmploye' => 'IT003',
                'idType' => 6, // Formation
                'idStatut' => 2, // Validée
            ],
            [
                'dateDebut' => now()->subDays(2)->format('Y-m-d'),
                'dateFin' => now()->addDays(3)->format('Y-m-d'),
                'motif' => 'Grippe',
                'idEmploye' => 'COMPTA002',
                'idType' => 2, // Maladie
                'idStatut' => 2, // Validée
            ],
            [
                'dateDebut' => now()->addDays(20)->format('Y-m-d'),
                'dateFin' => now()->addDays(25)->format('Y-m-d'),
                'motif' => 'Mariage',
                'idEmploye' => 'RH002',
                'idType' => 7, // Exceptionnel
                'idStatut' => 3, // Refusée
            ],
        ];

        foreach ($demandes as $demande) {
            DemandeConge::create($demande);
        }
    }
}