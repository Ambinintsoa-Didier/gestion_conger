<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('statut_demandes', function (Blueprint $table) {
            $table->id('idStatut');
            $table->string('libelle');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('statut_demandes');
    }
};