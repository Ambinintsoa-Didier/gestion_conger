<?php
// app/Http/Controllers/RH/UtilisateurController.php

namespace App\Http\Controllers\RH;

use App\Http\Controllers\Controller;
use App\Models\Employe;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class UtilisateurController extends Controller
{
    /**
     * Display a listing of users.
     */
    public function index()
    {
        try {
            $utilisateurs = User::with(['employe.structure', 'employe.superieur'])
                ->get()
                ->map(function ($user) {
                    return [
                        'idUtilisateur' => $user->idUtilisateur,
                        'email' => $user->email,
                        'role' => $user->role,
                        'must_change_password' => $user->must_change_password,
                        'password_temp' => $user->password_temp,
                        'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                        'updated_at' => $user->updated_at->format('Y-m-d H:i:s'),
                        'employe' => $user->employe ? [
                            'matricule' => $user->employe->matricule,
                            'nom' => $user->employe->nom,
                            'prenom' => $user->employe->prenom,
                            'fonction' => $user->employe->fonction,
                            'structure' => $user->employe->structure,
                            'superieur' => $user->employe->superieur
                        ] : null
                    ];
                });

            return response()->json([
                'success' => true,
                'utilisateurs' => $utilisateurs
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur dans UtilisateurController@index: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des utilisateurs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created user account.
     */
    public function store(Request $request)
    {
        DB::beginTransaction();
        
        try {
            // Validation des données
            $validated = $request->validate([
                'matricule_employe' => 'required|exists:employes,matricule',
                'email' => 'required|email|unique:users,email',
                'role' => 'required|in:employe,superieur,rh,admin',
                'genererMotDePasse' => 'required|boolean',
                'motDePasse' => $request->genererMotDePasse ? 'nullable|string' : 'required|string|min:8'
            ]);

            // Vérifier que l'employé n'a pas déjà un compte
            $employe = Employe::where('matricule', $validated['matricule_employe'])->firstOrFail();
            
            if ($employe->user) {
                return response()->json([
                    'success' => false,
                    'message' => 'Cet employé a déjà un compte utilisateur'
                ], 422);
            }

            // Gestion du mot de passe
            if ($request->genererMotDePasse) {
                $motDePasseTemporaire = $this->genererMotDePasseSecurise();
                $passwordToHash = $motDePasseTemporaire;
            } else {
                $motDePasseTemporaire = $validated['motDePasse'];
                $passwordToHash = $validated['motDePasse'];
            }

            // Créer l'utilisateur
            $user = User::create([
                'email' => $validated['email'],
                'motDePasse' => Hash::make($passwordToHash),
                'role' => $validated['role'],
                'matricule_employe' => $employe->matricule,
                'password_temp' => $request->genererMotDePasse ? $motDePasseTemporaire : null,
                'must_change_password' => $request->genererMotDePasse
            ]);

            DB::commit();

            // Charger les relations pour la réponse
            $user->load(['employe.structure', 'employe.superieur']);

            return response()->json([
                'success' => true,
                'message' => 'Compte utilisateur créé avec succès',
                'user' => $user,
                'tempPassword' => $request->genererMotDePasse ? $motDePasseTemporaire : null
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur dans UtilisateurController@store: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la création du compte utilisateur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified user.
     */
    public function show($id)
    {
        try {
            $user = User::with(['employe.structure', 'employe.superieur'])
                ->findOrFail($id);

            return response()->json([
                'success' => true,
                'user' => [
                    'idUtilisateur' => $user->idUtilisateur,
                    'email' => $user->email,
                    'role' => $user->role,
                    'must_change_password' => $user->must_change_password,
                    'password_temp' => $user->password_temp,
                    'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                    'updated_at' => $user->updated_at->format('Y-m-d H:i:s'),
                    'employe' => $user->employe ? [
                        'matricule' => $user->employe->matricule,
                        'nom' => $user->employe->nom,
                        'prenom' => $user->employe->prenom,
                        'fonction' => $user->employe->fonction,
                        'structure' => $user->employe->structure,
                        'superieur' => $user->employe->superieur
                    ] : null
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur dans UtilisateurController@show: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Utilisateur non trouvé',
                'error' => $e->getMessage()
            ], 404);
        }
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, $id)
    {
        DB::beginTransaction();
        
        try {
            $user = User::findOrFail($id);

            $validated = $request->validate([
                'email' => 'required|email|unique:users,email,' . $user->idUtilisateur . ',idUtilisateur',
                'role' => 'required|in:employe,superieur,rh,admin'
            ]);

            // Mettre à jour l'utilisateur
            $user->update([
                'email' => $validated['email'],
                'role' => $validated['role']
            ]);

            DB::commit();

            $user->load(['employe.structure', 'employe.superieur']);

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur mis à jour avec succès',
                'user' => $user
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur dans UtilisateurController@update: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la mise à jour de l\'utilisateur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified user.
     */
    public function destroy($id)
    {
        DB::beginTransaction();
        
        try {
            $user = User::findOrFail($id);

            // Supprimer l'utilisateur
            $user->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Utilisateur supprimé avec succès'
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur dans UtilisateurController@destroy: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la suppression de l\'utilisateur',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Reset user password
     */
    public function resetPassword($id)
    {
        DB::beginTransaction();
        
        try {
            $user = User::findOrFail($id);

            $nouveauMotDePasse = $this->genererMotDePasseSecurise();

            $user->update([
                'motDePasse' => Hash::make($nouveauMotDePasse),
                'password_temp' => $nouveauMotDePasse,
                'must_change_password' => true
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Mot de passe réinitialisé avec succès',
                'tempPassword' => $nouveauMotDePasse
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur dans UtilisateurController@resetPassword: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la réinitialisation du mot de passe',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Change user role
     */
    public function changeRole(Request $request, $id)
    {
        DB::beginTransaction();
        
        try {
            $user = User::findOrFail($id);

            $validated = $request->validate([
                'role' => 'required|in:employe,superieur,rh,admin'
            ]);

            $user->update([
                'role' => $validated['role']
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Rôle utilisateur modifié avec succès',
                'user' => $user
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Erreur de validation',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Erreur dans UtilisateurController@changeRole: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors de la modification du rôle',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get users by role
     */
    public function getByRole($role)
    {
        try {
            if (!in_array($role, ['employe', 'superieur', 'rh', 'admin'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Rôle non valide'
                ], 422);
            }

            $utilisateurs = User::where('role', $role)
                ->with(['employe.structure', 'employe.superieur'])
                ->get()
                ->map(function ($user) {
                    return [
                        'idUtilisateur' => $user->idUtilisateur,
                        'email' => $user->email,
                        'role' => $user->role,
                        'must_change_password' => $user->must_change_password,
                        'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                        'employe' => $user->employe ? [
                            'matricule' => $user->employe->matricule,
                            'nom' => $user->employe->nom,
                            'prenom' => $user->employe->prenom,
                            'fonction' => $user->employe->fonction,
                            'structure' => $user->employe->structure
                        ] : null
                    ];
                });

            return response()->json([
                'success' => true,
                'utilisateurs' => $utilisateurs,
                'count' => $utilisateurs->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur dans UtilisateurController@getByRole: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des utilisateurs',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get users without employees (orphaned users)
     */
    public function getUtilisateursOrphelins()
    {
        try {
            $utilisateursOrphelins = User::whereNull('matricule_employe')
                ->orWhereDoesntHave('employe')
                ->get()
                ->map(function ($user) {
                    return [
                        'idUtilisateur' => $user->idUtilisateur,
                        'email' => $user->email,
                        'role' => $user->role,
                        'matricule_employe' => $user->matricule_employe,
                        'created_at' => $user->created_at->format('Y-m-d H:i:s')
                    ];
                });

            return response()->json([
                'success' => true,
                'utilisateurs' => $utilisateursOrphelins,
                'count' => $utilisateursOrphelins->count()
            ]);

        } catch (\Exception $e) {
            Log::error('Erreur dans UtilisateurController@getUtilisateursOrphelins: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'message' => 'Erreur lors du chargement des utilisateurs orphelins',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate secure password
     */
    private function genererMotDePasseSecurise($longueur = 12)
    {
        $majuscules = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        $minuscules = 'abcdefghijklmnopqrstuvwxyz';
        $chiffres = '0123456789';
        $speciaux = '!@#$%&*';

        $motDePasse = '';
        
        // Au moins une majuscule
        $motDePasse .= $majuscules[random_int(0, strlen($majuscules) - 1)];
        // Au moins une minuscule
        $motDePasse .= $minuscules[random_int(0, strlen($minuscules) - 1)];
        // Au moins un chiffre
        $motDePasse .= $chiffres[random_int(0, strlen($chiffres) - 1)];
        // Au moins un caractère spécial
        $motDePasse .= $speciaux[random_int(0, strlen($speciaux) - 1)];

        // Remplir le reste
        $tousCaracteres = $majuscules . $minuscules . $chiffres . $speciaux;
        for ($i = strlen($motDePasse); $i < $longueur; $i++) {
            $motDePasse .= $tousCaracteres[random_int(0, strlen($tousCaracteres) - 1)];
        }

        // Mélanger le mot de passe
        return str_shuffle($motDePasse);
    }
}