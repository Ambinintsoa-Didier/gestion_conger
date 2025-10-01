<?php

namespace App\Http\Controllers;

use App\Models\DemandeConge;
use App\Models\Employe;
use App\Models\Historique;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ValidationCongeController extends Controller
{
    /**
     * Récupère les demandes de congé à valider pour le supérieur connecté
     */
    public function demandesAValider(Request $request)
    {
        try {
            $user = $request->user();
            $user->load('employe');

            if (!$user->employe) {
                return response()->json([
                    'message' => 'Aucun employé associé à cet utilisateur'
                ], 404);
            }

            // Récupère les subordonnés du supérieur
            $subordonnes = Employe::where('superieur_id', $user->employe->matricule)
                ->pluck('matricule');

            if ($subordonnes->isEmpty()) {
                return response()->json([
                    'message' => 'Aucun subordonné trouvé',
                    'demandes' => []
                ], 200);
            }

            // DEBUG: Log les subordonnés
            Log::info('Subordonnés de ' . $user->employe->matricule . ':', $subordonnes->toArray());

            // Charge TOUTES les colonnes des relations
            $demandes = DemandeConge::with([
                'typeConge', // Toutes les colonnes
                'statut',    // Toutes les colonnes
                'employe'    // Toutes les colonnes
            ])
                ->whereIn('idEmploye', $subordonnes)
                ->where('idStatut', 1) // En attente
                ->orderBy('created_at', 'desc')
                ->get();

            // DEBUG: Vérifie une demande
            if ($demandes->count() > 0) {
                $premiereDemande = $demandes->first();
                Log::info('Première demande à valider:', [
                    'id' => $premiereDemande->idDemande,
                    'type_conge' => $premiereDemande->typeConge ? $premiereDemande->typeConge->toArray() : 'NULL',
                    'statut' => $premiereDemande->statut ? $premiereDemande->statut->toArray() : 'NULL',
                    'employe' => $premiereDemande->employe ? $premiereDemande->employe->toArray() : 'NULL'
                ]);
            }

            // Formate les données pour s'assurer que les relations sont incluses
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
                    // Force le chargement des relations
                    'typeConge' => $demande->typeConge ? [
                        'idType' => $demande->typeConge->idType,
                        'nom' => $demande->typeConge->nom,
                        'nombreJour' => $demande->typeConge->nombreJour
                    ] : null,
                    'statut' => $demande->statut ? [
                        'idStatut' => $demande->statut->idStatut,
                        'libelle' => $demande->statut->libelle
                    ] : null,
                    'employe' => $demande->employe ? [
                        'matricule' => $demande->employe->matricule,
                        'nom' => $demande->employe->nom,
                        'prenom' => $demande->employe->prenom,
                        'fonction' => $demande->employe->fonction
                    ] : null
                ];
            });

            return response()->json([
                'demandes' => $demandesFormatted
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur récupération demandes à valider:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la récupération des demandes à valider',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Valide une demande de congé
     */
    public function validerDemande(Request $request, $idDemande)
    {
        DB::beginTransaction();

        try {
            $user = $request->user();
            $user->load('employe');

            if (!$user->employe) {
                return response()->json([
                    'message' => 'Aucun employé associé à cet utilisateur'
                ], 404);
            }

            // Récupère la demande
            $demande = DemandeConge::with(['employe', 'typeConge'])
                ->where('idDemande', $idDemande)
                ->first();

            if (!$demande) {
                return response()->json([
                    'message' => 'Demande de congé non trouvée'
                ], 404);
            }

            // Vérifie que le supérieur peut valider cette demande
            $subordonnes = Employe::where('superieur_id', $user->employe->matricule)
                ->pluck('matricule');

            if (!$subordonnes->contains($demande->idEmploye)) {
                return response()->json([
                    'message' => 'Vous n\'êtes pas autorisé à valider cette demande'
                ], 403);
            }

            // Vérifie que la demande est en attente
            if ($demande->idStatut != 1) {
                return response()->json([
                    'message' => 'Cette demande a déjà été traitée'
                ], 400);
            }

            // Met à jour le statut
            $demande->update([
                'idStatut' => 2 // Validée
            ]);

            // Met à jour le solde de congé si c'est un congé annuel
            if ($demande->typeConge && $demande->typeConge->nom === 'Congé Annuel') {
                $dateDebut = \Carbon\Carbon::parse($demande->dateDebut);
                $dateFin = \Carbon\Carbon::parse($demande->dateFin);
                $joursPris = $dateDebut->diffInDays($dateFin) + 1;

                $employe = $demande->employe;
                $employe->soldeConge -= $joursPris;
                $employe->save();
            }

            // Journalisation
            Historique::create([
                'idUtilisateur' => $user->idUtilisateur,
                'action' => 'Demande de congé validée',
                'details' => "Demande #{$demande->idDemande} de {$demande->employe->prenom} {$demande->employe->nom} validée"
            ]);

            DB::commit();

            // Recharge la demande avec les relations pour la réponse
            $demande->load(['typeConge', 'statut', 'employe']);

            return response()->json([
                'message' => 'Demande de congé validée avec succès',
                'demande' => $demande
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur validation demande:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la validation de la demande',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Refuse une demande de congé
     */
    public function refuserDemande(Request $request, $idDemande)
    {
        DB::beginTransaction();

        try {
            $user = $request->user();
            $user->load('employe');

            if (!$user->employe) {
                return response()->json([
                    'message' => 'Aucun employé associé à cet utilisateur'
                ], 404);
            }

            // Récupère la demande
            $demande = DemandeConge::with(['employe'])
                ->where('idDemande', $idDemande)
                ->first();

            if (!$demande) {
                return response()->json([
                    'message' => 'Demande de congé non trouvée'
                ], 404);
            }

            // Vérifie que le supérieur peut refuser cette demande
            $subordonnes = Employe::where('superieur_id', $user->employe->matricule)
                ->pluck('matricule');

            if (!$subordonnes->contains($demande->idEmploye)) {
                return response()->json([
                    'message' => 'Vous n\'êtes pas autorisé à refuser cette demande'
                ], 403);
            }

            // Vérifie que la demande est en attente
            if ($demande->idStatut != 1) {
                return response()->json([
                    'message' => 'Cette demande a déjà été traitée'
                ], 400);
            }

            // Met à jour le statut
            $demande->update([
                'idStatut' => 3 // Refusée
            ]);

            // Journalisation
            Historique::create([
                'idUtilisateur' => $user->idUtilisateur,
                'action' => 'Demande de congé refusée',
                'details' => "Demande #{$demande->idDemande} de {$demande->employe->prenom} {$demande->employe->nom} refusée"
            ]);

            DB::commit();

            // Recharge la demande avec les relations pour la réponse
            $demande->load(['typeConge', 'statut', 'employe']);

            return response()->json([
                'message' => 'Demande de congé refusée avec succès',
                'demande' => $demande
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur refus demande:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du refus de la demande',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère l'historique des validations
     */
    public function historiqueValidations(Request $request)
    {
        try {
            $user = $request->user();
            $user->load('employe');

            if (!$user->employe) {
                return response()->json([
                    'message' => 'Aucun employé associé à cet utilisateur'
                ], 404);
            }

            // Récupère les subordonnés
            $subordonnes = Employe::where('superieur_id', $user->employe->matricule)
                ->pluck('matricule');

            if ($subordonnes->isEmpty()) {
                return response()->json([
                    'message' => 'Aucun subordonné trouvé',
                    'demandes' => []
                ], 200);
            }

            // Récupère toutes les demandes des subordonnés (validées et refusées)
            $demandes = DemandeConge::with([
                'typeConge',
                'statut',
                'employe'
            ])
                ->whereIn('idEmploye', $subordonnes)
                ->whereIn('idStatut', [2, 3]) // Validées ou refusées
                ->orderBy('updated_at', 'desc')
                ->get();

            // Formate les données pour s'assurer que les relations sont incluses
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
                    // Force le chargement des relations
                    'typeConge' => $demande->typeConge ? [
                        'idType' => $demande->typeConge->idType,
                        'nom' => $demande->typeConge->nom,
                        'nombreJour' => $demande->typeConge->nombreJour
                    ] : null,
                    'statut' => $demande->statut ? [
                        'idStatut' => $demande->statut->idStatut,
                        'libelle' => $demande->statut->libelle
                    ] : null,
                    'employe' => $demande->employe ? [
                        'matricule' => $demande->employe->matricule,
                        'nom' => $demande->employe->nom,
                        'prenom' => $demande->employe->prenom,
                        'fonction' => $demande->employe->fonction
                    ] : null
                ];
            });

            return response()->json([
                'demandes' => $demandesFormatted
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur récupération historique validations:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la récupération de l\'historique',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}