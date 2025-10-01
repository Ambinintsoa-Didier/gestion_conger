<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('employes', function (Blueprint $table) {
            $table->string('matricule')->primary();
            $table->string('nom');
            $table->string('prenom');
            $table->enum('sexe', ['M', 'F']);
            $table->string('fonction');
            $table->integer('soldeConge')->default(25);
            $table->date('dateEmbauche');
            $table->foreignId('idStructure')->constrained('structures', 'idStructure');
            $table->string('superieur_id')->nullable()->constrained('employes', 'matricule');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('employes');
    }
};