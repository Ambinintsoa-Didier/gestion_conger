<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run()
    {
        $users = [
            // Admin
            [
                'email' => 'admin@entreprise.com',
                'motDePasse' => Hash::make('admin123'),
                'role' => 'admin',
                'matricule_employe' => 'DG001',
            ],
            // RH
            [
                'email' => 'sophie.martin@entreprise.com',
                'motDePasse' => Hash::make('rh123'),
                'role' => 'rh',
                'matricule_employe' => 'RH001',
            ],
            [
                'email' => 'marie.bernard@entreprise.com',
                'motDePasse' => Hash::make('rh123'),
                'role' => 'rh', 
                'matricule_employe' => 'RH002',
            ],
            // Supérieurs hiérarchiques
            [
                'email' => 'thomas.leroy@entreprise.com',
                'motDePasse' => Hash::make('sup123'),
                'role' => 'superieur',
                'matricule_employe' => 'IT001',
            ],
            [
                'email' => 'nathalie.roux@entreprise.com',
                'motDePasse' => Hash::make('sup123'),
                'role' => 'superieur',
                'matricule_employe' => 'COMPTA001',
            ],
            // Employés
            [
                'email' => 'julie.moreau@entreprise.com',
                'motDePasse' => Hash::make('emp123'),
                'role' => 'employe',
                'matricule_employe' => 'IT002',
            ],
            [
                'email' => 'david.petit@entreprise.com',
                'motDePasse' => Hash::make('emp123'),
                'role' => 'employe',
                'matricule_employe' => 'IT003',
            ],
            [
                'email' => 'lucas.garcia@entreprise.com',
                'motDePasse' => Hash::make('emp123'),
                'role' => 'employe',
                'matricule_employe' => 'COMPTA002',
            ],
        ];

        foreach ($users as $user) {
            User::create($user);
        }
    }
}