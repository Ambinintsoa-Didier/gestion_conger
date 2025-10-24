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
use App\Http\Controllers\NotificationController;   
use App\Http\Controllers\RH\UtilisateurController;

Route::get('/test', function () {
    return response()->json(['message' => 'API Laravel 12 fonctionne !']);
});

// Routes publiques
Route::post('/login', [AuthController::class, 'login']);
Route::post('/employes/creer-compte', [EmployeController::class, 'creerCompteEmploye']);

// AJOUT: Route pour vérifier si un matricule existe (pour l'inscription)
Route::get('/employes/verifier-matricule/{matricule}', [EmployeController::class, 'verifierMatricule']);

// AJOUT: Route pour récupérer les informations d'un employé par matricule (pour pré-remplir l'inscription)
Route::get('/employes/infos-inscription/{matricule}', [EmployeController::class, 'getInfosPourInscription']);

// Routes protégées
Route::middleware('auth:sanctum')->group(function () {
    // Authentification
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    
    // AJOUT: Route pour forcer le changement de mot de passe
    Route::post('/changer-mot-de-passe-obligatoire', [AuthController::class, 'changerMotDePasseObligatoire']);
    
    // Routes pour les congés
    Route::prefix('conges')->group(function () {
        Route::get('/', [DemandeCongeController::class, 'index']);
        Route::get('/types', [DemandeCongeController::class, 'getTypesConge']);
        Route::get('/solde', [DemandeCongeController::class, 'getSolde']);
        Route::post('/', [DemandeCongeController::class, 'store']);
        Route::get('/historique', [DemandeCongeController::class, 'historique']);
        Route::get('/{id}', [DemandeCongeController::class, 'show']);
        Route::put('/{id}', [DemandeCongeController::class, 'update']);
        Route::delete('/{id}', [DemandeCongeController::class, 'destroy']);
        
        // AJOUT: Routes pour annuler une demande
        Route::post('/{id}/annuler', [DemandeCongeController::class, 'annulerDemande']);
        
        // AJOUT: Route pour vérifier la disponibilité des dates
        Route::post('/verifier-disponibilite', [DemandeCongeController::class, 'verifierDisponibilite']);
    });

    // Routes dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'getStats']);
    
    // AJOUT: Route pour les notifications du dashboard
    Route::get('/dashboard/notifications', [DashboardController::class, 'getNotificationsDashboard']);

    // Routes pour la validation des congés (supérieurs hiérarchiques)
    Route::prefix('validation')->group(function () {
        Route::get('/demandes', [ValidationCongeController::class, 'demandesAValider']);
        Route::get('/historique', [ValidationCongeController::class, 'historiqueValidations']);
        Route::post('/valider/{idDemande}', [ValidationCongeController::class, 'validerDemande']);
        Route::post('/refuser/{idDemande}', [ValidationCongeController::class, 'refuserDemande']);
        Route::get('/stats', [ValidationCongeController::class, 'getStatsValidation']);
        
        // AJOUT: Route pour obtenir les détails d'une demande à valider
        Route::get('/demande/{idDemande}', [ValidationCongeController::class, 'getDemandeDetail']);
        
        // AJOUT: Route pour les statistiques de l'équipe
        Route::get('/equipe/stats', [ValidationCongeController::class, 'getStatsEquipe']);
    });

    // Calendrier
    Route::prefix('calendrier')->group(function () {
        Route::get('/conges', [CalendrierController::class, 'getCongesCalendrier']);
        Route::post('/filter', [CalendrierController::class, 'filterConges']);
        Route::get('/stats', [CalendrierController::class, 'getStatsCalendrier']);
        Route::get('/employes', [CalendrierController::class, 'getEmployesCalendrier']);
        
        // AJOUT: Route pour les événements du calendrier
        Route::get('/evenements', [CalendrierController::class, 'getEvenementsCalendrier']);
        
        // AJOUT: Route pour les conflits de congés
        Route::post('/verifier-conflits', [CalendrierController::class, 'verifierConflits']);
    });

    // Routes RH/Admin - Avec vérification des rôles
    Route::prefix('rh')->middleware(['check.role:rh,admin'])->group(function () {
        // Employés - ROUTES COMPLÈTES
        Route::prefix('employes')->group(function () {
            Route::get('/', [EmployeController::class, 'index']);
            Route::post('/', [EmployeController::class, 'store']);
            Route::put('/{matricule}', [EmployeController::class, 'update']);
            Route::delete('/{matricule}', [EmployeController::class, 'destroy']);
            Route::post('/{matricule}/reset-password', [EmployeController::class, 'resetPassword']);
            Route::post('/{matricule}/creer-compte', [EmployeController::class, 'creerCompteUtilisateur']);
            Route::get('/sans-compte', [EmployeController::class, 'employesSansCompte']);
            Route::get('/{matricule}', [EmployeController::class, 'show']);
            
            // AJOUT: Route pour rechercher des employés
            Route::get('/search/{term}', [EmployeController::class, 'search']);
            
            // AJOUT: Route pour les statistiques des employés
            Route::get('/{matricule}/stats-conges', [EmployeController::class, 'getStatsConges']);
        });

        // Utilisateurs - ROUTES COMPLÈTES
        Route::prefix('utilisateurs')->group(function () {
            Route::get('/', [UtilisateurController::class, 'index']);
            Route::post('/', [UtilisateurController::class, 'store']);
            Route::get('/{id}', [UtilisateurController::class, 'show']);
            Route::put('/{id}', [UtilisateurController::class, 'update']);
            Route::delete('/{id}', [UtilisateurController::class, 'destroy']);
            Route::post('/{id}/reset-password', [UtilisateurController::class, 'resetPassword']);
            Route::post('/{id}/change-role', [UtilisateurController::class, 'changeRole']);
            Route::get('/role/{role}', [UtilisateurController::class, 'getByRole']);
            Route::get('/orphelins', [UtilisateurController::class, 'getUtilisateursOrphelins']);
            
            // AJOUT: Route pour activer/désactiver un utilisateur
            Route::post('/{id}/toggle-actif', [UtilisateurController::class, 'toggleActif']);
        });
        
        // Structures - CRUD complet
        Route::prefix('structures')->group(function () {
            Route::get('/', [StructureController::class, 'index']);
            Route::post('/', [StructureController::class, 'store']);
            Route::put('/{id}', [StructureController::class, 'update']);
            Route::delete('/{id}', [StructureController::class, 'destroy']);
            Route::get('/{id}', [StructureController::class, 'show']);
            Route::get('/{id}/stats', [StructureController::class, 'getStats']);
            Route::get('/{id}/employes', [StructureController::class, 'getEmployesStructure']);
            
            // AJOUT: Route pour les supérieurs hiérarchiques d'une structure
            Route::get('/{id}/superieurs', [StructureController::class, 'getSuperieursStructure']);
        });
        
        // Types de congés
        Route::prefix('types-conges')->group(function () {
            Route::get('/', [TypeCongeController::class, 'index']);
            Route::post('/', [TypeCongeController::class, 'store']);
            Route::put('/{id}', [TypeCongeController::class, 'update']);
            Route::delete('/{id}', [TypeCongeController::class, 'destroy']);
            Route::get('/{id}', [TypeCongeController::class, 'show']);
            Route::get('/{id}/statistiques', [TypeCongeController::class, 'getStatistiques']);
            
            // AJOUT: Route pour activer/désactiver un type de congé
            Route::post('/{id}/toggle-actif', [TypeCongeController::class, 'toggleActif']);
        });
        
        // Jours fériés
        Route::prefix('jours-feries')->group(function () {
            Route::get('/', [JourFerieController::class, 'index']);
            Route::post('/', [JourFerieController::class, 'store']);
            Route::put('/{id}', [JourFerieController::class, 'update']);
            Route::delete('/{id}', [JourFerieController::class, 'destroy']);
            Route::get('/{id}', [JourFerieController::class, 'show']);
            Route::post('/importer', [JourFerieController::class, 'importerJoursFeries']);
            Route::get('/annee/{annee}', [JourFerieController::class, 'getByAnnee']);
            
            // AJOUT: Route pour dupliquer les jours fériés d'une année à l'autre
            Route::post('/dupliquer-annee', [JourFerieController::class, 'dupliquerAnnee']);
        });
        
        // Stats RH (compatibilité)
        Route::get('/stats', [RhController::class, 'getStats']);

        // Statistiques avancées
        Route::prefix('statistiques')->group(function () {
            Route::get('/', [StatistiqueController::class, 'getStatistiques']);
            Route::get('/conges-par-mois', [StatistiqueController::class, 'getCongesParMois']);
            Route::get('/conges-par-structure', [StatistiqueController::class, 'getCongesParStructure']);
            Route::get('/conges-par-type', [StatistiqueController::class, 'getCongesParType']);
            Route::get('/taux-approbation', [StatistiqueController::class, 'getTauxApprobation']);
            
            // AJOUT: Nouvelles routes statistiques
            Route::get('/absences-courantes', [StatistiqueController::class, 'getAbsencesCourantes']);
            Route::get('/conges-a-venir', [StatistiqueController::class, 'getCongesAVenir']);
            Route::get('/utilisation-conges', [StatistiqueController::class, 'getUtilisationConges']);
        });
        
        // Gestion des demandes de congés
        Route::prefix('demandes')->group(function () {
            Route::get('/', [StatistiqueController::class, 'getAllDemandes']);
            Route::post('/{idDemande}/valider', [StatistiqueController::class, 'validerDemande']);
            Route::post('/{idDemande}/refuser', [StatistiqueController::class, 'refuserDemande']);
            Route::get('/en-attente', [StatistiqueController::class, 'getDemandesEnAttente']);
            Route::get('/validees', [StatistiqueController::class, 'getDemandesValidees']);
            Route::get('/refusees', [StatistiqueController::class, 'getDemandesRefusees']);
            Route::get('/{idDemande}', [StatistiqueController::class, 'getDemandeDetail']);
            Route::get('/employe/{matricule}', [StatistiqueController::class, 'getDemandesEmploye']);
            
            // AJOUT: Route pour exporter les demandes
            Route::post('/exporter', [StatistiqueController::class, 'exporterDemandes']);
        });

        // Rapports et exports
        Route::prefix('rapports')->group(function () {
            Route::get('/conges-mensuel', [StatistiqueController::class, 'getRapportCongesMensuel']);
            Route::get('/conges-annuel', [StatistiqueController::class, 'getRapportCongesAnnuel']);
            Route::get('/soldes-employes', [StatistiqueController::class, 'getRapportSoldesEmployes']);
            Route::get('/absences-structure', [StatistiqueController::class, 'getRapportAbsencesStructure']);
            
            // AJOUT: Nouveaux rapports
            Route::get('/taux-utilisation', [StatistiqueController::class, 'getRapportTauxUtilisation']);
            Route::get('/planning-conges', [StatistiqueController::class, 'getRapportPlanningConges']);
        });
    });
       
    // 🔔 ROUTES POUR LES NOTIFICATIONS
    Route::prefix('notifications')->group(function () {
        Route::get('/', [NotificationController::class, 'index']);
        Route::get('/non-lues', [NotificationController::class, 'nombreNonLues']);
        Route::post('/{idNotification}/marquer-lue', [NotificationController::class, 'marquerCommeLue']);
        Route::post('/marquer-toutes-lues', [NotificationController::class, 'marquerToutesCommeLues']);
        Route::get('/dernieres', [NotificationController::class, 'getDernieresNotifications']);
        
        // AJOUT: Route pour les préférences de notifications
        Route::get('/preferences', [NotificationController::class, 'getPreferences']);
        Route::post('/preferences', [NotificationController::class, 'updatePreferences']);
    });

    // Routes pour les supérieurs hiérarchiques
    Route::middleware(['check.role:superieur,rh,admin'])->group(function () {
        Route::prefix('superieur')->group(function () {
            Route::get('/equipe', [ValidationCongeController::class, 'getEquipe']);
            Route::get('/equipe/conges', [ValidationCongeController::class, 'getCongesEquipe']);
            Route::get('/equipe/soldes', [ValidationCongeController::class, 'getSoldesEquipe']);
            Route::get('/dashboard-stats', [ValidationCongeController::class, 'getDashboardStats']);
            
            // AJOUT: Routes pour la gestion de l'équipe
            Route::get('/equipe/absences-courantes', [ValidationCongeController::class, 'getAbsencesCourantesEquipe']);
            Route::get('/equipe/conges-a-venir', [ValidationCongeController::class, 'getCongesAVenirEquipe']);
        });
    });

    // Routes RH compatibilité (à supprimer progressivement)
    Route::prefix('rh-legacy')->group(function () {
        Route::get('/employes', [RhController::class, 'getEmployes']);
        Route::post('/employes', [RhController::class, 'createEmploye']);
        Route::put('/employes/{matricule}', [RhController::class, 'updateEmploye']);
        Route::delete('/employes/{matricule}', [RhController::class, 'deleteEmploye']);
        Route::get('/structures', [RhController::class, 'getStructures']);
        Route::get('/dashboard', [RhController::class, 'getDashboard']);
    });

    // Routes communes pour tous les utilisateurs
    Route::prefix('mon-compte')->group(function () {
        Route::get('/profil', [AuthController::class, 'getProfil']);
        Route::put('/profil', [AuthController::class, 'updateProfil']);
        Route::post('/changer-mot-de-passe', [AuthController::class, 'changerMotDePasse']);
        Route::get('/mes-conges', [DemandeCongeController::class, 'getMesConges']);
        Route::get('/mes-soldes', [DemandeCongeController::class, 'getMesSoldes']);
        
        // AJOUT: Route pour les préférences utilisateur
        Route::get('/preferences', [AuthController::class, 'getPreferences']);
        Route::put('/preferences', [AuthController::class, 'updatePreferences']);
    });
});

// AJOUT: Routes de santé de l'API
Route::get('/health', function () {
    return response()->json([
        'status' => 'OK',
        'timestamp' => now(),
        'version' => '1.0.0'
    ]);
});

// AJOUT: Route pour les métadonnées de l'application
Route::get('/app-info', function () {
    return response()->json([
        'name' => 'Gestion des Congés SPAT',
        'version' => '1.0.0',
        'environment' => app()->environment(),
        'maintenance' => app()->isDownForMaintenance()
    ]);
});

// Routes de fallback pour les routes non trouvées
Route::fallback(function () {
    return response()->json([
        'success' => false,
        'message' => 'Route API non trouvée'
    ], 404);
});