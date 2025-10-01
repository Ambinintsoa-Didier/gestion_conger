<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('users', function (Blueprint $table) {
            $table->id('idUtilisateur');
            $table->string('email')->unique();
            $table->string('motDePasse');
            $table->enum('role', ['admin', 'rh', 'employe', 'superieur'])->default('employe');
            $table->string('matricule_employe')->nullable()->constrained('employes', 'matricule');
            $table->rememberToken();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('users');
    }
};