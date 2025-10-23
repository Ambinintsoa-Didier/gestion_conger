<?php
// database/migrations/2024_01_15_000000_create_notifications_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('notifications', function (Blueprint $table) {
            $table->id('idNotification');
            $table->foreignId('idUtilisateur')->constrained('users', 'idUtilisateur');
            $table->string('titre');
            $table->text('message');
            $table->enum('type', ['info', 'success', 'warning', 'error'])->default('info');
            $table->enum('entite_liee', ['conges', 'employes', 'systeme'])->nullable();
            $table->unsignedBigInteger('entite_id')->nullable();
            $table->boolean('est_lu')->default(false);
            $table->timestamp('lu_at')->nullable();
            $table->timestamps();

            // Index pour les performances
            $table->index(['idUtilisateur', 'est_lu']);
            $table->index(['entite_liee', 'entite_id']);
        });
    }

    public function down()
    {
        Schema::dropIfExists('notifications');
    }
};