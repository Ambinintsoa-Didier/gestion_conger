<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ValidationCongeController;
use App\Http\Controllers\DemandeCongeController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

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

    // Routes pour la validation des congés
Route::prefix('validation')->group(function () {
    Route::get('/demandes', [ValidationCongeController::class, 'demandesAValider']);
    Route::get('/historique', [ValidationCongeController::class, 'historiqueValidations']);
    Route::post('/valider/{idDemande}', [ValidationCongeController::class, 'validerDemande']);
    Route::post('/refuser/{idDemande}', [ValidationCongeController::class, 'refuserDemande']);
});
});