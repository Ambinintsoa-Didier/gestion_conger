<?php
// routes/api.php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ValidationCongeController;
use App\Http\Controllers\DemandeCongeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CalendrierController;
use App\Http\Controllers\RhController;  
use App\Http\Controllers\RH\EmployeController;
use App\Http\Controllers\RH\StructureController;
use App\Http\Controllers\RH\TypeCongeController;
use App\Http\Controllers\RH\JourFerieController;
use App\Http\Controllers\RH\StatistiqueController;

Route::get('/test', function () {
    return response()->json(['message' => 'API Laravel 12 fonctionne !']);
});

Route::post('/login', [AuthController::class, 'login']);

// Routes protégées
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // Routes pour les congés
    Route::prefix('conges')->group(function () {
        Route::get('/', [DemandeCongeController::class, 'index']);
        Route::get('/types', [DemandeCongeController::class, 'getTypesConge']);
        Route::get('/solde', [DemandeCongeController::class, 'getSolde']);
        Route::post('/', [DemandeCongeController::class, 'store']);
    });

    // Routes dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);

    // Routes pour la validation des congés (supérieurs hiérarchiques)
    Route::prefix('validation')->group(function () {
        Route::get('/demandes', [ValidationCongeController::class, 'demandesAValider']);
        Route::get('/historique', [ValidationCongeController::class, 'historiqueValidations']);
        Route::post('/valider/{idDemande}', [ValidationCongeController::class, 'validerDemande']);
        Route::post('/refuser/{idDemande}', [ValidationCongeController::class, 'refuserDemande']);
    });

    // Calendrier
    Route::prefix('calendrier')->group(function () {
        Route::get('/conges', [CalendrierController::class, 'getCongesCalendrier']);
        Route::post('/filter', [CalendrierController::class, 'filterConges']);
        Route::get('/stats', [CalendrierController::class, 'getStatsCalendrier']);
    });

    // Routes RH/Admin - Avec vérification des rôles
    Route::prefix('rh')->middleware(['check.role:rh,admin'])->group(function () {
        // Employés avec le nouveau contrôleur
        Route::get('/employes', [EmployeController::class, 'index']);
        Route::post('/employes', [EmployeController::class, 'store']);
        Route::put('/employes/{matricule}', [EmployeController::class, 'update']);
        Route::delete('/employes/{matricule}', [EmployeController::class, 'destroy']);
        Route::post('/employes/{matricule}/reset-password', [EmployeController::class, 'resetPassword']);
        
        // Structures - CRUD complet
        Route::get('/structures', [StructureController::class, 'index']);
        Route::post('/structures', [StructureController::class, 'store']);
        Route::put('/structures/{id}', [StructureController::class, 'update']);
        Route::delete('/structures/{id}', [StructureController::class, 'destroy']);
        Route::get('/structures/{id}', [StructureController::class, 'show']);
        Route::get('/structures/{id}/stats', [StructureController::class, 'getStats']);
        
        // Types de congés
        Route::get('/types-conges', [TypeCongeController::class, 'index']);
        Route::post('/types-conges', [TypeCongeController::class, 'store']);
        Route::put('/types-conges/{id}', [TypeCongeController::class, 'update']);
        Route::delete('/types-conges/{id}', [TypeCongeController::class, 'destroy']);
        
        // Jours fériés
        Route::get('/jours-feries', [JourFerieController::class, 'index']);
        Route::post('/jours-feries', [JourFerieController::class, 'store']);
        Route::put('/jours-feries/{id}', [JourFerieController::class, 'update']);
        Route::delete('/jours-feries/{id}', [JourFerieController::class, 'destroy']);
        Route::post('/jours-feries/importer', [JourFerieController::class, 'importerJoursFeries']);
        
        // Stats RH (garder l'ancien contrôleur pour la compatibilité)
        Route::get('/stats', [RhController::class, 'getStats']);

        // NOUVELLES ROUTES POUR LES STATISTIQUES ET SUIVI DES DEMANDES
        Route::get('/statistiques', [StatistiqueController::class, 'getStatistiques']);
        
        // ✅ ROUTES POUR LE SUIVI DES DEMANDES (CELLES QUI MANQUAIENT)
        Route::get('/demandes', [StatistiqueController::class, 'getAllDemandes']);
        Route::post('/demandes/{idDemande}/valider', [StatistiqueController::class, 'validerDemande']);
        Route::post('/demandes/{idDemande}/refuser', [StatistiqueController::class, 'refuserDemande']);
        
        // Routes supplémentaires pour filtres
        Route::get('/demandes/en-attente', [StatistiqueController::class, 'getDemandesEnAttente']);
        Route::get('/demandes/validees', [StatistiqueController::class, 'getDemandesValidees']);
        Route::get('/demandes/refusees', [StatistiqueController::class, 'getDemandesRefusees']);
    });

    // Routes RH compatibilité (à supprimer progressivement)
    Route::prefix('rh-legacy')->group(function () {
        Route::get('/employes', [RhController::class, 'getEmployes']);
        Route::post('/employes', [RhController::class, 'createEmploye']);
        Route::put('/employes/{matricule}', [RhController::class, 'updateEmploye']);
        Route::delete('/employes/{matricule}', [RhController::class, 'deleteEmploye']);
    });
});