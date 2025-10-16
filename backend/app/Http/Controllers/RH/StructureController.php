<?php
// app/Http/Controllers/RH/StructureController.php

namespace App\Http\Controllers\RH;

use App\Http\Controllers\Controller;
use App\Models\Structure;
use App\Models\Employe;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StructureController extends Controller
{
    public function index()
    {
        try {
            $structures = Structure::withCount('employes')->get();
            
            return response()->json([
                'success' => true,
                'structures' => $structures
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des structures'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255|unique:structures,nom',
            'type' => 'required|in:Direction,Département,Service'
        ]);

        try {
            DB::beginTransaction();

            $structure = Structure::create($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Structure créée avec succès',
                'structure' => $structure
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de la structure'
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255|unique:structures,nom,' . $id . ',idStructure',
            'type' => 'required|in:Direction,Département,Service'
        ]);

        try {
            DB::beginTransaction();

            $structure = Structure::findOrFail($id);
            $structure->update($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Structure modifiée avec succès',
                'structure' => $structure
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification de la structure'
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $structure = Structure::findOrFail($id);
            
            // Vérifier si la structure est utilisée par des employés
            if ($structure->employes()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer cette structure car elle est assignée à des employés'
                ], 400);
            }

            $structure->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Structure supprimée avec succès'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de la structure'
            ], 500);
        }
    }

    public function show($id)
    {
        try {
            $structure = Structure::with(['employes' => function($query) {
                $query->with('user')->orderBy('nom')->orderBy('prenom');
            }])->findOrFail($id);

            return response()->json([
                'success' => true,
                'structure' => $structure
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement de la structure'
            ], 500);
        }
    }

    public function getStats($id)
    {
        try {
            $structure = Structure::findOrFail($id);
            
            $stats = [
                'total_employes' => $structure->employes()->count(),
                'employes_par_fonction' => $structure->employes()
                    ->select('fonction', DB::raw('COUNT(*) as count'))
                    ->groupBy('fonction')
                    ->get(),
                'conges_en_attente' => $structure->employes()
                    ->join('demande_conges', 'employes.matricule', '=', 'demande_conges.idEmploye')
                    ->where('demande_conges.idStatut', 1)
                    ->count(),
                'conges_approuves' => $structure->employes()
                    ->join('demande_conges', 'employes.matricule', '=', 'demande_conges.idEmploye')
                    ->where('demande_conges.idStatut', 2)
                    ->count(),
            ];

            return response()->json([
                'success' => true,
                'stats' => $stats
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des statistiques'
            ], 500);
        }
    }
}