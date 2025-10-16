<?php
// app/Http/Controllers/RH/StatistiqueController.php

namespace App\Http\Controllers\RH;

use App\Http\Controllers\Controller;
use App\Models\DemandeConge;
use App\Models\Employe;
use App\Models\Structure;
use App\Models\TypeConge;
use App\Models\JourFerie;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class StatistiqueController extends Controller
{
    public function getStatistiques(Request $request)
    {
        try {
            Log::info('Début getStatistiques', ['annee' => $request->get('annee')]);
            
            $annee = $request->get('annee', date('Y'));
            
            // Statistiques de base
            $stats = [
                'total_employes' => Employe::count(),
                'total_structures' => Structure::count(),
                'total_types_conges' => TypeConge::count(),
                'total_jours_feries' => JourFerie::whereYear('date', $annee)->count(),
            ];

            // Statistiques des demandes - CORRIGÉ : dateDebut au lieu de date_debut
            $totalDemandes = DemandeConge::whereYear('dateDebut', $annee)->count();
            $demandesValidees = DemandeConge::whereYear('dateDebut', $annee)->where('idStatut', 2)->count();
            $demandesRefusees = DemandeConge::whereYear('dateDebut', $annee)->where('idStatut', 3)->count();
            $demandesEnAttente = DemandeConge::whereYear('dateDebut', $annee)->where('idStatut', 1)->count();

            $stats['total_demandes'] = $totalDemandes;
            $stats['demandes_validees'] = $demandesValidees;
            $stats['demandes_refusees'] = $demandesRefusees;
            $stats['demandes_en_attente'] = $demandesEnAttente;
            $stats['taux_validation'] = $totalDemandes > 0 ? round(($demandesValidees / $totalDemandes) * 100, 2) : 0;

            // Demandes par mois - CORRIGÉ : dateDebut au lieu de date_debut
            $stats['demandes_par_mois'] = $this->getDemandesParMois($annee);

            // Types de congés - CORRIGÉ : dateDebut au lieu de date_debut
            $stats['types_conges_stats'] = $this->getTypesCongesStats($annee);

            // Structures - CORRIGÉ : dateDebut au lieu de date_debut
            $stats['structures_stats'] = $this->getStructuresStats($annee);

            Log::info('Statistiques générées avec succès', ['total_demandes' => $totalDemandes]);

            return response()->json([
                'success' => true,
                'stats' => $stats
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur dans getStatistiques', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function getDemandesParMois($annee)
    {
        $moisNoms = [
            1 => 'Jan', 2 => 'Fév', 3 => 'Mar', 4 => 'Avr', 5 => 'Mai', 6 => 'Jun',
            7 => 'Jul', 8 => 'Aoû', 9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Déc'
        ];

        $tousLesMois = [];
        
        for ($mois = 1; $mois <= 12; $mois++) {
            // CORRIGÉ : dateDebut au lieu de date_debut
            $total = DemandeConge::whereYear('dateDebut', $annee)
                ->whereMonth('dateDebut', $mois)
                ->count();
                
            $validees = DemandeConge::whereYear('dateDebut', $annee)
                ->whereMonth('dateDebut', $mois)
                ->where('idStatut', 2)
                ->count();
                
            $refusees = DemandeConge::whereYear('dateDebut', $annee)
                ->whereMonth('dateDebut', $mois)
                ->where('idStatut', 3)
                ->count();
                
            $en_attente = DemandeConge::whereYear('dateDebut', $annee)
                ->whereMonth('dateDebut', $mois)
                ->where('idStatut', 1)
                ->count();

            $tousLesMois[] = [
                'mois' => $moisNoms[$mois],
                'total' => $total,
                'validees' => $validees,
                'refusees' => $refusees,
                'en_attente' => $en_attente
            ];
        }

        return $tousLesMois;
    }

    private function getTypesCongesStats($annee)
    {
        try {
            // CORRIGÉ : dateDebut au lieu de date_debut
            $results = DB::table('demande_conges')
                ->join('type_conges', 'demande_conges.idType', '=', 'type_conges.idType')
                ->whereYear('demande_conges.dateDebut', $annee)
                ->select('type_conges.nom as type', DB::raw('COUNT(*) as count'))
                ->groupBy('type_conges.nom', 'type_conges.idType')
                ->orderByDesc('count')
                ->get();

            return $results->toArray();
        } catch (\Exception $e) {
            Log::error('Erreur dans getTypesCongesStats', ['error' => $e->getMessage()]);
            return [];
        }
    }

    private function getStructuresStats($annee)
    {
        try {
            // CORRIGÉ : dateDebut au lieu de date_debut
            $results = DB::table('demande_conges')
                ->join('employes', 'demande_conges.idEmploye', '=', 'employes.matricule')
                ->join('structures', 'employes.idStructure', '=', 'structures.idStructure')
                ->whereYear('demande_conges.dateDebut', $annee)
                ->select('structures.nom as structure', DB::raw('COUNT(*) as count'))
                ->groupBy('structures.nom', 'structures.idStructure')
                ->orderByDesc('count')
                ->get();

            return $results->toArray();
        } catch (\Exception $e) {
            Log::error('Erreur dans getStructuresStats', ['error' => $e->getMessage()]);
            return [];
        }
    }

    /**
     * Récupère toutes les demandes de congé pour le suivi RH/Admin
     * ✅ CORRECTION : Chargement correct de la relation typeConge
     */
    public function getAllDemandes(Request $request)
    {
        try {
            // ✅ CORRECTION : Charger correctement la relation typeConge avec le nom
            $demandes = DemandeConge::with([
                'employe' => function($query) {
                    $query->select('matricule', 'nom', 'prenom', 'fonction', 'idStructure')
                          ->with(['structure' => function($q) {
                              $q->select('idStructure', 'nom', 'type');
                          }]);
                },
                'typeConge:idType,nom', // ✅ Charger le nom du type de congé
                'statut:idStatut,libelle'
            ])
            ->orderBy('dateDebut', 'desc')
            ->get();

            return response()->json([
                'success' => true,
                'demandes' => $demandes
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur dans getAllDemandes', ['error' => $e->getMessage()]);
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des demandes',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Valide une demande de congé (pour RH/Admin)
     */
    public function validerDemande(Request $request, $idDemande)
    {
        DB::beginTransaction();
        
        try {
            $user = $request->user();
            $demande = DemandeConge::with(['employe', 'typeConge'])->findOrFail($idDemande);

            // Vérifie que la demande est en attente
            if ($demande->idStatut != 1) {
                return response()->json([
                    'message' => 'Cette demande a déjà été traitée'
                ], 400);
            }

            // Met à jour le statut de la demande
            $demande->update([
                'idStatut' => 2 // Validée
            ]);

            DB::commit();

            // Recharge la demande avec les relations
            $demande->load(['typeConge', 'statut', 'employe.structure']);

            return response()->json([
                'success' => true,
                'message' => 'Demande validée avec succès',
                'demande' => $demande
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur validation demande RH', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la validation',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Refuse une demande de congé (pour RH/Admin)
     */
    public function refuserDemande(Request $request, $idDemande)
    {
        DB::beginTransaction();
        
        try {
            $user = $request->user();
            $demande = DemandeConge::findOrFail($idDemande);

            // Vérifie que la demande est en attente
            if ($demande->idStatut != 1) {
                return response()->json([
                    'message' => 'Cette demande a déjà été traitée'
                ], 400);
            }

            // Met à jour le statut de la demande
            $demande->update([
                'idStatut' => 3 // Refusée
            ]);

            DB::commit();

            // Recharge la demande avec les relations
            $demande->load(['typeConge', 'statut', 'employe.structure']);

            return response()->json([
                'success' => true,
                'message' => 'Demande refusée avec succès',
                'demande' => $demande
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur refus demande RH', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du refus',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère les demandes en attente (pour filtres)
     * ✅ CORRECTION : Chargement correct de la relation typeConge
     */
    public function getDemandesEnAttente(Request $request)
    {
        try {
            $demandes = DemandeConge::with([
                'employe' => function($query) {
                    $query->select('matricule', 'nom', 'prenom', 'fonction', 'idStructure')
                          ->with(['structure' => function($q) {
                              $q->select('idStructure', 'nom', 'type');
                          }]);
                },
                'typeConge:idType,nom', // ✅ Charger le nom du type de congé
                'statut:idStatut,libelle'
            ])
            ->where('idStatut', 1) // En attente
            ->orderBy('dateDebut', 'desc')
            ->get();

            return response()->json([
                'success' => true,
                'demandes' => $demandes
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur getDemandesEnAttente', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des demandes en attente',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère les demandes validées (pour filtres)
     * ✅ CORRECTION : Chargement correct de la relation typeConge
     */
    public function getDemandesValidees(Request $request)
    {
        try {
            $demandes = DemandeConge::with([
                'employe' => function($query) {
                    $query->select('matricule', 'nom', 'prenom', 'fonction', 'idStructure')
                          ->with(['structure' => function($q) {
                              $q->select('idStructure', 'nom', 'type');
                          }]);
                },
                'typeConge:idType,nom', // ✅ Charger le nom du type de congé
                'statut:idStatut,libelle'
            ])
            ->where('idStatut', 2) // Validées
            ->orderBy('dateDebut', 'desc')
            ->get();

            return response()->json([
                'success' => true,
                'demandes' => $demandes
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur getDemandesValidees', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des demandes validées',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère les demandes refusées (pour filtres)
     * ✅ CORRECTION : Chargement correct de la relation typeConge
     */
    public function getDemandesRefusees(Request $request)
    {
        try {
            $demandes = DemandeConge::with([
                'employe' => function($query) {
                    $query->select('matricule', 'nom', 'prenom', 'fonction', 'idStructure')
                          ->with(['structure' => function($q) {
                              $q->select('idStructure', 'nom', 'type');
                          }]);
                },
                'typeConge:idType,nom', // ✅ Charger le nom du type de congé
                'statut:idStatut,libelle'
            ])
            ->where('idStatut', 3) // Refusées
            ->orderBy('dateDebut', 'desc')
            ->get();

            return response()->json([
                'success' => true,
                'demandes' => $demandes
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur getDemandesRefusees', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des demandes refusées',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère les statistiques détaillées pour le dashboard RH
     */
    public function getDashboardStats(Request $request)
    {
        try {
            $stats = [
                'total_employes' => Employe::count(),
                'total_structures' => Structure::count(),
                'demandes_en_attente' => DemandeConge::where('idStatut', 1)->count(),
                'demandes_validees_ce_mois' => DemandeConge::where('idStatut', 2)
                    ->whereMonth('dateDebut', now()->month)
                    ->whereYear('dateDebut', now()->year)
                    ->count(),
                'conges_en_cours' => DemandeConge::where('idStatut', 2)
                    ->whereDate('dateDebut', '<=', now())
                    ->whereDate('dateFin', '>=', now())
                    ->count(),
            ];

            return response()->json([
                'success' => true,
                'stats' => $stats
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur getDashboardStats', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère les demandes par structure pour les graphiques
     */
    public function getDemandesParStructure(Request $request)
    {
        try {
            $results = DB::table('demande_conges')
                ->join('employes', 'demande_conges.idEmploye', '=', 'employes.matricule')
                ->join('structures', 'employes.idStructure', '=', 'structures.idStructure')
                ->select('structures.nom as structure', DB::raw('COUNT(*) as total'))
                ->groupBy('structures.nom', 'structures.idStructure')
                ->orderByDesc('total')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $results
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur getDemandesParStructure', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données par structure',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère les demandes par type de congé pour les graphiques
     */
    public function getDemandesParTypeConge(Request $request)
    {
        try {
            $results = DB::table('demande_conges')
                ->join('type_conges', 'demande_conges.idType', '=', 'type_conges.idType')
                ->select('type_conges.nom as type_conge', DB::raw('COUNT(*) as total'))
                ->groupBy('type_conges.nom', 'type_conges.idType')
                ->orderByDesc('total')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $results
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur getDemandesParTypeConge', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des données par type de congé',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupère l'évolution mensuelle des demandes
     */
    public function getEvolutionMensuelle(Request $request)
    {
        try {
            $annee = $request->get('annee', date('Y'));
            
            $results = DB::table('demande_conges')
                ->select(
                    DB::raw('MONTH(dateDebut) as mois'),
                    DB::raw('COUNT(*) as total'),
                    DB::raw('SUM(CASE WHEN idStatut = 2 THEN 1 ELSE 0 END) as validees'),
                    DB::raw('SUM(CASE WHEN idStatut = 3 THEN 1 ELSE 0 END) as refusees'),
                    DB::raw('SUM(CASE WHEN idStatut = 1 THEN 1 ELSE 0 END) as en_attente')
                )
                ->whereYear('dateDebut', $annee)
                ->groupBy(DB::raw('MONTH(dateDebut)'))
                ->orderBy('mois')
                ->get();

            $moisNoms = [
                1 => 'Jan', 2 => 'Fév', 3 => 'Mar', 4 => 'Avr', 5 => 'Mai', 6 => 'Jun',
                7 => 'Jul', 8 => 'Aoû', 9 => 'Sep', 10 => 'Oct', 11 => 'Nov', 12 => 'Déc'
            ];

            $data = [];
            foreach ($results as $result) {
                $data[] = [
                    'mois' => $moisNoms[$result->mois] ?? $result->mois,
                    'total' => $result->total,
                    'validees' => $result->validees,
                    'refusees' => $result->refusees,
                    'en_attente' => $result->en_attente
                ];
            }

            return response()->json([
                'success' => true,
                'data' => $data,
                'annee' => $annee
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur getEvolutionMensuelle', ['error' => $e->getMessage()]);
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération de l\'évolution mensuelle',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}