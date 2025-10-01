<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run()
    {
        $this->call([
            StructureSeeder::class,
            TypeCongeSeeder::class,
            StatutDemandeSeeder::class,
            JourFerieSeeder::class,
            EmployeSeeder::class,
            UserSeeder::class,
            DemandeCongeSeeder::class,
        ]);
    }
}