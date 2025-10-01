<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('historiques', function (Blueprint $table) {
            $table->id('idHistorique');
            $table->unsignedBigInteger('idUtilisateur');
            $table->string('action');
            $table->text('details')->nullable();
            $table->timestamp('dateAction')->useCurrent();
            $table->timestamps();
            
            // Correction : référence la bonne colonne
            $table->foreign('idUtilisateur')->references('idUtilisateur')->on('users');
        });
    }

    public function down()
    {
        Schema::dropIfExists('historiques');
    }
};