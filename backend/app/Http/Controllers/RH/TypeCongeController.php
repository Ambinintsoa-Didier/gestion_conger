<?php
// app/Http/Controllers/RH/TypeCongeController.php

namespace App\Http\Controllers\RH;

use App\Http\Controllers\Controller;
use App\Models\TypeConge;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TypeCongeController extends Controller
{
    public function index()
    {
        try {
            $types = TypeConge::all();
            
            return response()->json([
                'success' => true,
                'types' => $types
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des types de congés'
            ], 500);
        }
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255|unique:type_conges,nom',
            'nombreJour' => 'required|integer|min:1'
        ]);

        try {
            DB::beginTransaction();

            $type = TypeConge::create($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Type de congé créé avec succès',
                'type' => $type
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du type de congé'
            ], 500);
        }
    }

    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'nom' => 'required|string|max:255|unique:type_conges,nom,' . $id . ',idType',
            'nombreJour' => 'required|integer|min:1'
        ]);

        try {
            DB::beginTransaction();

            $type = TypeConge::findOrFail($id);
            $type->update($validated);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Type de congé modifié avec succès',
                'type' => $type
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification du type de congé'
            ], 500);
        }
    }

    public function destroy($id)
    {
        try {
            DB::beginTransaction();

            $type = TypeConge::findOrFail($id);
            
            // Vérifier si le type est utilisé dans des demandes
            if ($type->demandesConges()->exists()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer ce type de congé car il est utilisé dans des demandes'
                ], 400);
            }

            $type->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Type de congé supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression du type de congé'
            ], 500);
        }
    }
}