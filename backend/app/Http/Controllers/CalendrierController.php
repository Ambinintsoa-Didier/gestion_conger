<?php
// app/Http/Controllers/CalendrierController.php

namespace App\Http\Controllers;

use App\Models\DemandeConge;
use App\Models\Employe;
use App\Models\Structure;
use App\Models\TypeConge;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class CalendrierController extends Controller
{
    /**
     * Récupère tous les congés validés pour le calendrier
     */
    public function getCongesCalendrier(Request $request)
    {
        try {
            $user = $request->user();
            $user->load('employe');

            $congesQuery = DemandeConge::with([
                'employe' => function($query) {
                    $query->select('matricule', 'nom', 'prenom', 'fonction', 'idStructure');
                },
                'employe.structure',
                'typeConge',
                'statut'
            ])->where('idStatut', 2); // Seulement les congés validés

            // Filtrage selon le rôle
            $congesQuery = $this->applyRoleFilter($congesQuery, $user);

            $conges = $congesQuery->get()
                ->map(function ($conge) {
                    return [
                        'id' => (string) $conge->idDemande,
                        'title' => $conge->employe->prenom . ' ' . $conge->employe->nom,
                        'start' => $conge->dateDebut->format('Y-m-d'),
                        'end' => Carbon::parse($conge->dateFin)->addDay()->format('Y-m-d'),
                        'backgroundColor' => $this->getCongeColor($conge->typeConge->nom),
                        'borderColor' => $this->getCongeColor($conge->typeConge->nom),
                        'textColor' => '#ffffff',
                        'extendedProps' => [
                            'idDemande' => $conge->idDemande,
                            'employe' => $conge->employe->prenom . ' ' . $conge->employe->nom,
                            'matricule' => $conge->employe->matricule,
                            'fonction' => $conge->employe->fonction,
                            'structure' => $conge->employe->structure->nom ?? 'Non assigné',
                            'typeConge' => $conge->typeConge->nom,
                            'statut' => $conge->statut->libelle,
                            'motif' => $conge->motif,
                            'duree' => $conge->dateDebut->diffInDays($conge->dateFin) + 1
                        ]
                    ];
                });

            return response()->json([
                'conges' => $conges,
                'filters' => [
                    'structures' => $this->getStructuresList(),
                    'typesConge' => $this->getTypesCongeList()
                ]
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur récupération calendrier:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors de la récupération des données du calendrier',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Couleurs selon le type de congé (Thème bleu)
     */
    private function getCongeColor($typeConge)
    {
        $colors = [
            'Congé Annuel' => '#3B82F6',      // Blue-500
            'Congé Maladie' => '#60A5FA',     // Blue-400
            'Congé Maternité' => '#2563EB',   // Blue-600
            'Congé Paternité' => '#1D4ED8',   // Blue-700
            'Congé Sans Solde' => '#93C5FD',  // Blue-300
            'Congé Exceptionnel' => '#1E40AF', // Blue-800
            'RTT' => '#1E3A8A',               // Blue-900
        ];

        return $colors[$typeConge] ?? '#6B7280'; // Gris par défaut
    }

    /**
     * Liste des structures pour les filtres
     */
    private function getStructuresList()
    {
        return Structure::select('idStructure', 'nom')->orderBy('nom')->get();
    }

    /**
     * Liste des types de congé pour les filtres
     */
    private function getTypesCongeList()
    {
        return TypeConge::select('idType', 'nom')->orderBy('nom')->get();
    }

    /**
     * Filtrage des congés par structure/type
     */
    public function filterConges(Request $request)
    {
        try {
            $user = $request->user();
            $filters = $request->only(['structure_id', 'type_conge_id']);

            $congesQuery = DemandeConge::with([
                'employe', 
                'typeConge', 
                'statut'
            ])->where('idStatut', 2);

            // Applique les filtres
            if (!empty($filters['structure_id'])) {
                $congesQuery->whereHas('employe', function($query) use ($filters) {
                    $query->where('idStructure', $filters['structure_id']);
                });
            }

            if (!empty($filters['type_conge_id'])) {
                $congesQuery->where('idType', $filters['type_conge_id']);
            }

            // Filtrage par rôle
            $congesQuery = $this->applyRoleFilter($congesQuery, $user);

            $conges = $congesQuery->get()
                ->map(function ($conge) {
                    return [
                        'id' => (string) $conge->idDemande,
                        'title' => $conge->employe->prenom . ' ' . $conge->employe->nom,
                        'start' => $conge->dateDebut->format('Y-m-d'),
                        'end' => Carbon::parse($conge->dateFin)->addDay()->format('Y-m-d'),
                        'backgroundColor' => $this->getCongeColor($conge->typeConge->nom),
                        'borderColor' => $this->getCongeColor($conge->typeConge->nom),
                        'textColor' => '#ffffff',
                        'extendedProps' => [
                            'idDemande' => $conge->idDemande,
                            'employe' => $conge->employe->prenom . ' ' . $conge->employe->nom,
                            'matricule' => $conge->employe->matricule,
                            'fonction' => $conge->employe->fonction,
                            'structure' => $conge->employe->structure->nom ?? 'Non assigné',
                            'typeConge' => $conge->typeConge->nom,
                            'statut' => $conge->statut->libelle,
                            'motif' => $conge->motif,
                            'duree' => $conge->dateDebut->diffInDays($conge->dateFin) + 1
                        ]
                    ];
                });

            return response()->json([
                'conges' => $conges
            ], 200);

        } catch (\Exception $e) {
            Log::error('Erreur filtrage calendrier:', ['error' => $e->getMessage()]);
            return response()->json([
                'message' => 'Erreur lors du filtrage',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    private function applyRoleFilter($query, $user)
    {
        switch ($user->role) {
            case 'employe':
                return $query->where('idEmploye', $user->employe->matricule);
            case 'superieur':
                $subordonnes = Employe::where('superieur_id', $user->employe->matricule)->pluck('matricule');
                return $query->where(function($q) use ($user, $subordonnes) {
                    $q->where('idEmploye', $user->employe->matricule)
                      ->orWhereIn('idEmploye', $subordonnes);
                });
            default:
                return $query;
        }
    }

    /**
     * Statistiques pour le calendrier
     */
    public function getStatsCalendrier(Request $request)
    {
        try {
            $user = $request->user();
            
            $congesQuery = DemandeConge::where('idStatut', 2);
            $congesQuery = $this->applyRoleFilter($congesQuery, $user);

            $stats = [
                'total_conges' => $congesQuery->count(),
                'conges_ce_mois' => $congesQuery->whereMonth('dateDebut', now()->month)->count(),
                'employes_en_conge' => $congesQuery->whereDate('dateDebut', '<=', now())
                    ->whereDate('dateFin', '>=', now())
                    ->count(),
            ];

            return response()->json(['stats' => $stats], 200);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}