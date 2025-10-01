<?php

namespace Database\Seeders;

use App\Models\Employe;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class EmployeSeeder extends Seeder
{
    public function run()
    {
        $employes = [
            // Direction
            [
                'matricule' => 'DG001',
                'nom' => 'Dupont',
                'prenom' => 'Pierre',
                'sexe' => 'M',
                'fonction' => 'Directeur Général',
                'soldeConge' => 30,
                'dateEmbauche' => '2020-01-15',
                'idStructure' => 1,
                'superieur_id' => null,
            ],
            // RH
            [
                'matricule' => 'RH001',
                'nom' => 'Martin',
                'prenom' => 'Sophie',
                'sexe' => 'F',
                'fonction' => 'Responsable RH',
                'soldeConge' => 25,
                'dateEmbauche' => '2021-03-10',
                'idStructure' => 2,
                'superieur_id' => 'DG001',
            ],
            [
                'matricule' => 'RH002',
                'nom' => 'Bernard',
                'prenom' => 'Marie',
                'sexe' => 'F',
                'fonction' => 'Assistant RH',
                'soldeConge' => 25,
                'dateEmbauche' => '2022-06-20',
                'idStructure' => 2,
                'superieur_id' => 'RH001',
            ],
            // Informatique
            [
                'matricule' => 'IT001',
                'nom' => 'Leroy',
                'prenom' => 'Thomas',
                'sexe' => 'M',
                'fonction' => 'Responsable IT',
                'soldeConge' => 25,
                'dateEmbauche' => '2021-02-15',
                'idStructure' => 3,
                'superieur_id' => 'DG001',
            ],
            [
                'matricule' => 'IT002',
                'nom' => 'Moreau',
                'prenom' => 'Julie',
                'sexe' => 'F',
                'fonction' => 'Développeuse',
                'soldeConge' => 25,
                'dateEmbauche' => '2023-01-10',
                'idStructure' => 5,
                'superieur_id' => 'IT001',
            ],
            [
                'matricule' => 'IT003',
                'nom' => 'Petit',
                'prenom' => 'David',
                'sexe' => 'M',
                'fonction' => 'Technicien Support',
                'soldeConge' => 25,
                'dateEmbauche' => '2022-09-05',
                'idStructure' => 6,
                'superieur_id' => 'IT001',
            ],
            // Comptabilité
            [
                'matricule' => 'COMPTA001',
                'nom' => 'Roux',
                'prenom' => 'Nathalie',
                'sexe' => 'F',
                'fonction' => 'Responsable Comptabilité',
                'soldeConge' => 25,
                'dateEmbauche' => '2020-11-12',
                'idStructure' => 4,
                'superieur_id' => 'DG001',
            ],
            [
                'matricule' => 'COMPTA002',
                'nom' => 'Garcia',
                'prenom' => 'Lucas',
                'sexe' => 'M',
                'fonction' => 'Comptable',
                'soldeConge' => 25,
                'dateEmbauche' => '2023-03-18',
                'idStructure' => 7,
                'superieur_id' => 'COMPTA001',
            ],
        ];

        foreach ($employes as $employe) {
            Employe::create($employe);
        }
    }
}