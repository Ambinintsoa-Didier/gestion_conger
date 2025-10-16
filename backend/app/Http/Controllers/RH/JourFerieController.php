<?php
// app/Http/Controllers/RH/JourFerieController.php

namespace App\Http\Controllers\RH;

use App\Http\Controllers\Controller;
use App\Models\JourFerie;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JourFerieController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = JourFerie::query();
            
            // Filtrage par année
            if ($request->has('annee')) {
                $query->whereYear('date', $request->annee);
            }
            
            $joursFeries = $query->orderBy('date')->get();
            
            return response()->json([
                'success' => true,
                'joursFeries' => $joursFeries
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des jours fériés'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'date' => 'required|date|unique:jour_feriers,date',
            'description' => 'required|string|max:255'
        ]);

        try {
            DB::beginTransaction();

            $jourFerie = JourFerie::create($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Jour férié ajouté avec succès',
                'jourFerie' => $jourFerie
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'ajout du jour férié'
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'date' => 'required|date|unique:jour_feriers,date,' . $id . ',idDate',
            'description' => 'required|string|max:255'
        ]);

        try {
            DB::beginTransaction();

            $jourFerie = JourFerie::findOrFail($id);
            $jourFerie->update($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Jour férié modifié avec succès',
                'jourFerie' => $jourFerie
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification du jour férié'
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $jourFerie = JourFerie::findOrFail($id);
            $jourFerie->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Jour férié supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du jour férié'
            ], 500);
        }
    }

    public function importerJoursFeries(Request $request)
    {
        $validated = $request->validate([
            'annee' => 'required|integer|min:2020|max:2030'
        ]);

        try {
            DB::beginTransaction();

            $annee = $validated['annee'];
            
            // Jours fériés fixes en France
            $joursFeriesFixes = [
                ['date' => $annee . '-01-01', 'description' => 'Nouvel An'],
                ['date' => $annee . '-05-01', 'description' => 'Fête du Travail'],
                ['date' => $annee . '-05-08', 'description' => 'Victoire 1945'],
                ['date' => $annee . '-07-14', 'description' => 'Fête Nationale'],
                ['date' => $annee . '-08-15', 'description' => 'Assomption'],
                ['date' => $annee . '-11-01', 'description' => 'Toussaint'],
                ['date' => $annee . '-11-11', 'description' => 'Armistice 1918'],
                ['date' => $annee . '-12-25', 'description' => 'Noël'],
            ];

            $importes = 0;
            foreach ($joursFeriesFixes as $jour) {
                // Vérifier si le jour férié existe déjà
                if (!JourFerie::where('date', $jour['date'])->exists()) {
                    JourFerie::create($jour);
                    $importes++;
                }
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => $importes . ' jours fériés importés pour l\'année ' . $annee,
                'importes' => $importes
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de l\'importation des jours fériés'
            ], 500);
        }
    }
}