<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('type_conges', function (Blueprint $table) {
            $table->id('idType');
            $table->string('nom');
            $table->integer('nombreJour');
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('type_conges');
    }
};
