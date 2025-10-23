<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('structures', function (Blueprint $table) {
            $table->id('idStructure');
            $table->string('nom');
            $table->enum('type', ['Direction', 'Département', 'Service']);
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('structures');
    }
};
