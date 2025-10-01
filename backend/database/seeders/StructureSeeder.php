<?php

namespace Database\Seeders;

use App\Models\Structure;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class StructureSeeder extends Seeder
{
    public function run()
    {
        $structures = [
            ['nom' => 'Direction Générale', 'type' => 'Direction'],
            ['nom' => 'Ressources Humaines', 'type' => 'Département'],
            ['nom' => 'Informatique', 'type' => 'Département'],
            ['nom' => 'Comptabilité', 'type' => 'Département'],
            ['nom' => 'Service Développement', 'type' => 'Service'],
            ['nom' => 'Service Support', 'type' => 'Service'],
            ['nom' => 'Service Paie', 'type' => 'Service'],
        ];

        foreach ($structures as $structure) {
            Structure::create($structure);
        }
    }
}