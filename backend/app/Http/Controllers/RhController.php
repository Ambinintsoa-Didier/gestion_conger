<?php

namespace App\Http\Controllers;

use App\Models\Employe;
use App\Models\User;
use App\Models\Structure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class RhController extends Controller
{
    /**
     * Récupérer tous les employés avec leurs relations
     */
    public function getEmployes()
    {
        try {
            $employes = Employe::with(['structure', 'superieur', 'user'])
                ->get()
                ->map(function ($employe) {
                    return [
                        'matricule' => $employe->matricule,
                        'nom' => $employe->nom,
                        'prenom' => $employe->prenom,
                        'sexe' => $employe->sexe,
                        'fonction' => $employe->fonction,
                        'soldeConge' => $employe->soldeConge,
                        'dateEmbauche' => $employe->dateEmbauche,
                        'idStructure' => $employe->idStructure,
                        'superieur_id' => $employe->superieur_id,
                        'structure' => $employe->structure,
                        'superieur' => $employe->superieur,
                        'user' => $employe->user
                    ];
                });

            return response()->json([
                'success' => true,
                'employes' => $employes
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des employés',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Récupérer toutes les structures
     */
    public function getStructures()
    {
        try {
            $structures = Structure::all();

            return response()->json([
                'success' => true,
                'structures' => $structures
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des structures',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Créer un nouvel employé avec son compte utilisateur
     */
    public function createEmploye(Request $request)
    {
        DB::beginTransaction();

        try {
            // Validation des données
            $validator = Validator::make($request->all(), [
                'matricule' => 'required|string|unique:employes,matricule',
                'nom' => 'required|string|max:255',
                'prenom' => 'required|string|max:255',
                'sexe' => 'required|in:M,F',
                'fonction' => 'required|string|max:255',
                'soldeConge' => 'required|integer|min:0',
                'dateEmbauche' => 'required|date',
                'idStructure' => 'required|exists:structures,idStructure',
                'superieur_id' => 'nullable|exists:employes,matricule',
                'email' => 'required|email|unique:users,email',
                'role' => 'required|in:employe,superieur,rh,admin',
                'genererMotDePasse' => 'boolean',
                'motDePasse' => $request->genererMotDePasse ? 'nullable' : 'required|string|min:6'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Création de l'employé
            $employe = Employe::create([
                'matricule' => $request->matricule,
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'sexe' => $request->sexe,
                'fonction' => $request->fonction,
                'soldeConge' => $request->soldeConge,
                'dateEmbauche' => $request->dateEmbauche,
                'idStructure' => $request->idStructure,
                'superieur_id' => $request->superieur_id
            ]);

            // Génération du mot de passe
            $motDePasse = $request->genererMotDePasse 
                ? $this->genererMotDePasse()
                : $request->motDePasse;

            // Création du compte utilisateur
            $user = User::create([
                'email' => $request->email,
                'motDePasse' => Hash::make($motDePasse),
                'role' => $request->role,
                'matricule_employe' => $employe->matricule
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Employé créé avec succès',
                'employe' => $employe->load(['structure', 'superieur', 'user']),
                'motDePasseGenere' => $request->genererMotDePasse ? $motDePasse : null
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création de l\'employé',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mettre à jour un employé
     */
    public function updateEmploye(Request $request, $matricule)
    {
        DB::beginTransaction();

        try {
            $employe = Employe::where('matricule', $matricule)->firstOrFail();
            $user = User::where('matricule_employe', $matricule)->first();

            // Validation des données
            $validator = Validator::make($request->all(), [
                'nom' => 'required|string|max:255',
                'prenom' => 'required|string|max:255',
                'sexe' => 'required|in:M,F',
                'fonction' => 'required|string|max:255',
                'soldeConge' => 'required|integer|min:0',
                'dateEmbauche' => 'required|date',
                'idStructure' => 'required|exists:structures,idStructure',
                'superieur_id' => 'nullable|exists:employes,matricule',
                'email' => 'required|email|unique:users,email,' . ($user ? $user->idUtilisateur : 'NULL') . ',idUtilisateur',
                'role' => 'required|in:employe,superieur,rh,admin'
            ]);

            if ($validator->fails()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Erreur de validation',
                    'errors' => $validator->errors()
                ], 422);
            }

            // Mise à jour de l'employé
            $employe->update([
                'nom' => $request->nom,
                'prenom' => $request->prenom,
                'sexe' => $request->sexe,
                'fonction' => $request->fonction,
                'soldeConge' => $request->soldeConge,
                'dateEmbauche' => $request->dateEmbauche,
                'idStructure' => $request->idStructure,
                'superieur_id' => $request->superieur_id
            ]);

            // Mise à jour de l'utilisateur
            if ($user) {
                $user->update([
                    'email' => $request->email,
                    'role' => $request->role
                ]);
            }

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Employé mis à jour avec succès',
                'employe' => $employe->load(['structure', 'superieur', 'user'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'employé',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Supprimer un employé
     */
    public function deleteEmploye($matricule)
    {
        DB::beginTransaction();

        try {
            $employe = Employe::where('matricule', $matricule)->firstOrFail();
            $user = User::where('matricule_employe', $matricule)->first();

            // Vérifier si l'employé est supérieur d'autres employés
            $hasSubordonnes = Employe::where('superieur_id', $matricule)->exists();
            if ($hasSubordonnes) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer cet employé car il est supérieur hiérarchique d\'autres employés'
                ], 422);
            }

            // Vérifier si l'employé a des demandes de congé
            $hasDemandes = $employe->demandesConges()->exists();
            if ($hasDemandes) {
                return response()->json([
                    'success' => false,
                    'message' => 'Impossible de supprimer cet employé car il a des demandes de congé associées'
                ], 422);
            }

            // Supprimer l'utilisateur associé
            if ($user) {
                $user->delete();
            }

            // Supprimer l'employé
            $employe->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Employé supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'employé',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Générer un mot de passe aléatoire
     */
    private function genererMotDePasse($longueur = 8)
    {
        $caracteres = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $motDePasse = '';
        
        for ($i = 0; $i < $longueur; $i++) {
            $motDePasse .= $caracteres[rand(0, strlen($caracteres) - 1)];
        }
        
        return $motDePasse;
    }

    /**
     * Récupérer les statistiques pour le dashboard
     */
    public function getStats()
    {
        try {
            $stats = [
                'total_employes' => Employe::count(),
                'total_structures' => Structure::count(),
                'total_demandes' => \App\Models\DemandeConge::count(),
                'total_demandes_en_attente' => \App\Models\DemandeConge::where('idStatut', 2)->count(), // Assuming 2 = En attente
                'total_demandes_approuvees' => \App\Models\DemandeConge::where('idStatut', 1)->count(), // Assuming 1 = Validée
                'total_demandes_refusees' => \App\Models\DemandeConge::where('idStatut', 3)->count(), // Assuming 3 = Refusée
            ];

            return response()->json([
                'success' => true,
                'stats' => $stats
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la récupération des statistiques',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}