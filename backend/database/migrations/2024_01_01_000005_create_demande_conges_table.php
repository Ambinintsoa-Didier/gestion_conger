<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('demande_conges', function (Blueprint $table) {
            $table->id('idDemande');
            $table->date('dateDebut');
            $table->date('dateFin');
            $table->dateTime('dateEnvoi')->default(now());
            $table->text('motif')->nullable();
            $table->string('idEmploye')->constrained('employes', 'matricule');
            $table->foreignId('idType')->constrained('type_conges', 'idType');
            $table->foreignId('idStatut')->constrained('statut_demandes', 'idStatut');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('demande_conges');
    }
};