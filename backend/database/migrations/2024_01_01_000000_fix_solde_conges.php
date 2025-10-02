<?php
// database/migrations/2024_01_01_000000_fix_solde_conges.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

class FixSoldeConges extends Migration
{
    public function up()
    {
        // Met à jour tous les employés avec 30 jours de congé
        DB::table('employes')->update(['soldeConge' => 30]);
        
        // Optionnel : Met à jour le type de congé annuel
        DB::table('type_conges')
            ->where('nom', 'Congé Annuel')
            ->update(['nombreJour' => 30]);
    }

    public function down()
    {
        // Remet les valeurs précédentes si besoin
        DB::table('employes')->update(['soldeConge' => 25]);
    }
}