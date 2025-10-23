<?php

namespace App\Http\Controllers;

use App\Models\DemandeConge;
use App\Models\TypeConge;
use App\Models\StatutDemande;
use App\Models\JourFerie;
use App\Models\Historique;
use App\Services\NotificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;


class DemandeCongeController extends Controller
{
    /**
     * Récupère toutes les demandes de congé de l'utilisateur connecté
     */
    public function index(Request $request)
    {
        try {
            $user = $request->user();
            
            if (!$user) {
                return response()->json(['message' => 'Utilisateur non authentifié'], 401);
            }

            $user->load('employe');

            if (!$user->employe) {
                return response()->json(['message' => 'Aucun employé associé à cet utilisateur'], 404);
            }

            // Charge TOUTES les colonnes des relations
            $demandes = DemandeConge::with([
                'typeConge:idType,nom,nombreJour', 
                'statut:idStatut,libelle'
            ])
                ->where('idEmploye', $user->employe->matricule)
                ->orderBy('created_at', 'desc')
                ->get();

            // Transforme pour s'assurer que les données sont bien formatées
            $demandesFormatted = $demandes->map(function ($demande) {
                return [
                    'idDemande' => $demande->idDemande,
                    'dateDebut' => $demande->dateDebut,
                    'dateFin' => $demande->dateFin,
                    'motif' => $demande->motif,
                    'dateEnvoi' => $demande->dateEnvoi,
                    'idEmploye' => $demande->idEmploye,
                    'idType' => $demande->idType,
                    'idStatut' => $demande->idStatut,
                    'typeConge' => $demande->typeConge ? [
                        'idType' => $demande->typeConge->idType,
                        'nom' => $demande->typeConge->nom,
                        'nombreJour' => $demande->typeConge->nombreJour
                    ] : null,
                    'statut' => $demande->statut ? [
                        'idStatut' => $demande->statut->idStatut,
                        'libelle' => $demande->statut->libelle
                    ] : null
                ];
            });

            return response()->json([
                'demandes' => $demandesFormatted
            ], 200);

        } catch (\Exception $e) {
            \Illuminate\Support\Facades\Log::error('Erreur récupération demandes:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la récupération des demandes',
                'error' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Récupère les types de congés disponibles
     */
    public function getTypesConge()
    {
        try {
            $types = TypeConge::all();

            return response()->json([
                'types' => $types
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur récupération types congé:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la récupération des types de congé',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Crée une nouvelle demande de congé
     */
    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            $request->validate([
                'dateDebut' => 'required|date|after:yesterday',
                'dateFin' => 'required|date|after_or_equal:dateDebut',
                'idType' => 'required|exists:type_conges,idType',
                'motif' => 'nullable|string|max:500'
            ]);

            $user = $request->user();
            $user->load('employe');

            if (!$user->employe) {
                return response()->json([
                    'message' => 'Aucun employé associé à cet utilisateur'
                ], 404);
            }

            $employe = $user->employe;

            // Vérifie le solde de congé pour les congés annuels
            $typeConge = TypeConge::find($request->idType);
            $dateDebut = Carbon::parse($request->dateDebut);
            $dateFin = Carbon::parse($request->dateFin);
            
            // Calcul du nombre de jours ouvrés
            $nombreJours = 0;
            $currentDate = $dateDebut->copy();
            
            while ($currentDate <= $dateFin) {
                // Ne compte pas les weekends
                if (!$currentDate->isWeekend()) {
                    $nombreJours++;
                }
                $currentDate->addDay();
            }

            // Soustrait les jours fériés
            $joursFeries = JourFerie::whereBetween('date', [$dateDebut, $dateFin])->get();
            foreach ($joursFeries as $jourFerie) {
                $jourDate = Carbon::parse($jourFerie->date);
                if (!$jourDate->isWeekend()) {
                    $nombreJours--;
                }
            }

                if ($typeConge->nom === 'Congé Annuel' && $employe->soldeConge < $nombreJours) {
            return response()->json([
                'message' => 'Solde de congé insuffisant',
                'solde_actuel' => $employe->soldeConge,
                'jours_demandes' => $nombreJours,
                'solde_requis' => $nombreJours
            ], 400);
        }
            // Vérifie les chevauchements
            $chevauchement = DemandeConge::where('idEmploye', $employe->matricule)
                ->whereIn('idStatut', [1, 2]) // En attente ou validée
                ->where(function($query) use ($dateDebut, $dateFin) {
                    $query->whereBetween('dateDebut', [$dateDebut, $dateFin])
                          ->orWhereBetween('dateFin', [$dateDebut, $dateFin])
                          ->orWhere(function($q) use ($dateDebut, $dateFin) {
                              $q->where('dateDebut', '<=', $dateDebut)
                                ->where('dateFin', '>=', $dateFin);
                          });
                })
                ->exists();

            if ($chevauchement) {
                return response()->json([
                    'message' => 'Vous avez déjà une demande de congé sur cette période'
                ], 400);
            }

            // Crée la demande
            $demande = DemandeConge::create([
                'dateDebut' => $dateDebut,
                'dateFin' => $dateFin,
                'motif' => $request->motif,
                'idEmploye' => $employe->matricule,
                'idType' => $request->idType,
                'idStatut' => 1, // En attente
                'dateEnvoi' => now(),
            ]);

            // Journalisation
            Historique::create([
                'idUtilisateur' => $user->idUtilisateur,
                'action' => 'Demande de congé créée',
                'details' => "Demande #{$demande->idDemande} pour {$dateDebut->format('d/m/Y')} au {$dateFin->format('d/m/Y')}"
            ]);

            // 🔔 NOTIFICATION : Notifie le supérieur hiérarchique
            NotificationService::notifierNouvelleDemandeConges($demande);

            DB::commit();

            return response()->json([
                'message' => 'Demande de congé créée avec succès',
                'demande' => $demande->load(['typeConge', 'statut'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur création demande congé:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la création de la demande',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère le solde de congé de l'utilisateur
     */
    public function getSolde(Request $request)
    {
        try {
            $user = $request->user();
            $user->load('employe');

            if (!$user->employe) {
                return response()->json([
                    'message' => 'Aucun employé associé à cet utilisateur'
                ], 404);
            }

            return response()->json([
                'solde' => $user->employe->soldeConge
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur récupération solde:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la récupération du solde',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}