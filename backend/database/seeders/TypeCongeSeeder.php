<?php

namespace Database\Seeders;

use App\Models\TypeConge;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class TypeCongeSeeder extends Seeder
{
    public function run()
    {
        $types = [
            ['nom' => 'Congé Annuel', 'nombreJour' => 30],
            ['nom' => 'Maladie', 'nombreJour' => 30],
            ['nom' => 'Maternité', 'nombreJour' => 98],
            ['nom' => 'Paternité', 'nombreJour' => 11],
            ['nom' => 'Sans Solde', 'nombreJour' => 0],
            ['nom' => 'Formation', 'nombreJour' => 10],
            ['nom' => 'Exceptionnel', 'nombreJour' => 5],
        ];

        foreach ($types as $type) {
            TypeConge::create($type);
        }
    }
}
